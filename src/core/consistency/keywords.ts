import { matchHints } from '../rules/candidates.ts'
import type { Chunk } from '../types.ts'
import { answerEvidence, evidenceFor, NO, splitUnits, units, YES } from './text.ts'
import type { ConsistencyFinding, Unit, VendorAnswer } from './types.ts'

// C-TRANSFER, C-AUDIT, C-AI-TRAIN, C-CLAIM-UNBACKED (SPEC 9.3): keyword and polarity checks in code.

type Ctx = { answers: VendorAnswer[]; dpa: Chunk[]; docNames: Record<string, string> }

const EU_ONLY =
  /\b(only|exclusively|solely|stays?|remains?|kept|never leaves?|never (be )?transferred|does not leave|not transferred)\b[^.?]{0,60}\b(EU|EEA|European Union|European Economic Area)\b|\b(EU|EEA)[- ]only\b/i
// Case-sensitive so the pronoun "us" is never read as a country.
const NON_EEA =
  /\b(United States|USA|U\.S\.A?\.|US|United Kingdom|UK|Switzerland|India|Canada|Australia|New Zealand|Singapore|Japan|South Korea|Philippines|Brazil|Argentina|Mexico|China|Hong Kong|Israel|South Africa|Ukraine|Serbia|Turkey|Malaysia|Vietnam|Indonesia|Egypt|Nigeria|Kenya|United Arab Emirates|UAE)\b/
const LOCATION_CUE =
  /\b(located|location|hosted|hosting|stored|processed|data cent(re|er)s?|region|servers?|facilit(y|ies))\b/i
const FRAMEWORK = /\bEU[- ]U\.?S\.?\b|Data Privacy Framework/gi

function claimsEuOnly(a: VendorAnswer): boolean {
  if (NO.test(a.answer)) return false
  return EU_ONLY.test(a.answer) || (EU_ONLY.test(a.question) && YES.test(a.answer))
}

function nonEeaUnits(dpa: Chunk[]): { unit: Unit; country: string }[] {
  return units(dpa).flatMap((unit) => {
    const text = unit.text.replace(FRAMEWORK, '')
    const m = NON_EEA.exec(text)
    if (!m) return []
    const isRow = unit.chunk.text.includes(`| ${unit.text}`) || unit.chunk.text.includes('\t')
    return isRow || LOCATION_CUE.test(text) ? [{ unit, country: m[0] }] : []
  })
}

export function checkTransfers({ answers, dpa, docNames }: Ctx): ConsistencyFinding[] {
  const places = nonEeaUnits(dpa)
  if (places.length === 0) return []
  const contract = places.flatMap((p) => evidenceFor(p.unit, docNames) ?? [])
  return answers.filter(claimsEuOnly).flatMap((a) => {
    const answer = answerEvidence(a, docNames, (s) => EU_ONLY.test(s))
    if (!answer || contract.length === 0) return []
    return [
      {
        id: `C-TRANSFER:${a.qid}`,
        ruleId: 'C-TRANSFER',
        qid: a.qid,
        kind: 'eu-only-vs-location' as const,
        status: 'CONFLICT' as const,
        answer,
        contract,
        detail: { country: [...new Set(places.map((p) => p.country))].join(', ') },
      },
    ]
  })
}

const AUDIT_HINTS = ['audit', 'inspection', 'inspect']
const AUDIT_CLAIM =
  /\b(may|can|allow|allows|permit|permits|right to|entitled to)\b[^.]{0,40}\b(audit|inspect)/i
const AUDIT_EXCLUDED =
  /\b(no|not)\b[^.]{0,40}\b(audits?|inspections?)\b[^.]{0,30}\b(permitted|allowed|entitled)\b|\b(audits?|inspections?)\b[^.]{0,40}\b(are|is|shall be|will be) (not permitted|not allowed|excluded)\b|\bshall not be entitled to (audit|inspect)/i
const AUDIT_LIMITED = /\b(limited to|only by|solely by|in lieu of|instead of|satisf(y|ies|ied))\b/i
const REPORT = /\b(reports?|certificates?|attestations?|questionnaires?)\b/i

export function checkAudit({ answers, dpa, docNames }: Ctx): ConsistencyFinding[] {
  const auditUnits = units(dpa).filter((u) => /\b(audit|inspect)/i.test(u.text))
  const excluded = auditUnits.find((u) => AUDIT_EXCLUDED.test(u.text))
  const limited = auditUnits.find((u) => AUDIT_LIMITED.test(u.text) && REPORT.test(u.text))
  const unit = excluded ?? limited
  if (!unit) return []
  const contract = evidenceFor(unit, docNames)
  if (!contract) return []
  return answers.flatMap((a) => {
    if (matchHints(`${a.question}\n${a.answer}`, AUDIT_HINTS).length === 0) return []
    if (NO.test(a.answer) || !(YES.test(a.answer) || AUDIT_CLAIM.test(a.answer))) return []
    const answer = answerEvidence(a, docNames, (s) => AUDIT_CLAIM.test(s))
    if (!answer) return []
    return [
      {
        id: `C-AUDIT:${a.qid}`,
        ruleId: 'C-AUDIT',
        qid: a.qid,
        kind: excluded ? ('audit-excluded' as const) : ('audit-limited' as const),
        status: excluded ? ('CONFLICT' as const) : ('PARTIAL' as const),
        answer,
        contract: [contract],
        detail: {},
      },
    ]
  })
}

const TRAIN = /\b(train|training|trained)\b/i
const AI = /\b(AI|artificial intelligence|machine learning|models?|LLMs?)\b/
const NEGATION = /\b(not|never|no|neither|nor)\b|n't\b/i
const aboutTraining = (s: string) => TRAIN.test(s) && AI.test(s)

/** true = data is used for training, false = it is not, null = the text does not say. */
function answerPolarity(a: VendorAnswer): { yes: boolean; sentence: string } | null {
  const s = splitUnits(a.answer).find(aboutTraining)
  if (s) return { yes: !NEGATION.test(s), sentence: s }
  if (!aboutTraining(a.question)) return null
  if (NO.test(a.answer)) return { yes: false, sentence: a.answer }
  if (YES.test(a.answer)) return { yes: true, sentence: a.answer }
  return null
}

export function checkAiTraining({ answers, dpa, docNames }: Ctx): ConsistencyFinding[] {
  const stated = units(dpa)
    .filter((u) => aboutTraining(u.text))
    .map((u) => ({ unit: u, yes: !NEGATION.test(u.text) }))
  return answers.flatMap((a) => {
    const p = answerPolarity(a)
    if (!p) return []
    const opposite = stated.find((s) => s.yes !== p.yes)
    const contract = opposite ? evidenceFor(opposite.unit, docNames) : null
    const answer = answerEvidence(a, docNames, (s) => s === p.sentence)
    if (!contract || !answer) return []
    return [
      {
        id: `C-AI-TRAIN:${a.qid}`,
        ruleId: 'C-AI-TRAIN',
        qid: a.qid,
        kind: 'ai-polarity' as const,
        status: 'CONFLICT' as const,
        answer,
        contract: [contract],
        detail: {},
      },
    ]
  })
}

export const CLAIMS: { claim: string; re: RegExp }[] = [
  { claim: 'encryption', re: /\bencrypt/i },
  { claim: 'multi-factor authentication', re: /\b(mfa|multi-factor|two-factor|2fa)\b/i },
  { claim: 'ISO 27001', re: /\biso(\/iec)?\s*27001\b/i },
  { claim: 'SOC 2', re: /\bsoc\s*2\b/i },
  { claim: 'penetration testing', re: /\b(penetration test|pen[- ]?test)/i },
]

export function checkClaims({ answers, dpa, docNames }: Ctx): ConsistencyFinding[] {
  const contractText = dpa.map((c) => c.text).join('\n')
  return answers.flatMap((a) => {
    if (NO.test(a.answer)) return []
    return CLAIMS.filter((c) => c.re.test(a.answer) && !c.re.test(contractText)).flatMap((c) => {
      const answer = answerEvidence(a, docNames, (s) => c.re.test(s))
      return answer
        ? [
            {
              id: `C-CLAIM-UNBACKED:${a.qid}:${c.claim}`,
              ruleId: 'C-CLAIM-UNBACKED',
              qid: a.qid,
              kind: 'claim-unbacked' as const,
              status: 'NOT_FOUND' as const,
              answer,
              contract: [],
              detail: { claim: c.claim },
            },
          ]
        : []
    })
  })
}
