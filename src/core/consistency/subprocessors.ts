import { matchHints } from '../rules/candidates.ts'
import type { Chunk } from '../types.ts'
import { answerEvidence, evidenceFor, NO, units } from './text.ts'
import type { ConsistencyFinding, Unit, VendorAnswer } from './types.ts'

// C-SUBPROC (SPEC 9.3): names are extracted and compared by code.
// A name is a capitalised phrase ending in a company form (Ltd, Inc., GmbH, BV, Oy, ...).
const FORMS =
  'Ltd\\.?|Limited|Inc\\.?|LLC|GmbH|AG|B\\.?V\\.?|N\\.?V\\.?|Oy|AB|ASA?|A/S|ApS|S\\.?A\\.?S?|SARL|S\\.?r\\.?l\\.?|S\\.?p\\.?A\\.?|plc|PLC|Corp\\.?|Corporation|Pty Ltd|Sp\\. z o\\.o\\.|Kft\\.?|s\\.r\\.o\\.'
const NAME = new RegExp(
  `\\b((?:[A-Z][\\w&'-]*\\s+){0,4}[A-Z][\\w&'-]*)\\s+(?:${FORMS})(?=[\\s,;:)|]|$)`,
  'g',
)
const SUBPROC_HINTS = [
  'sub-processor',
  'subprocessor',
  'third parties',
  'third party',
  'subcontractor',
  'vendors',
  'suppliers',
]
const NONE =
  /\b(no|none|not use any|do not use|don't use|never use)\b[^.]{0,40}\b(sub-?processors?|third[- ]part(y|ies)|subcontractors?|suppliers)\b|^\s*none\b/i
// A party used as a defined term ("Harbourline") appears throughout the DPA; a sub-processor does not.
const PARTY_MIN_MENTIONS = 5

export type NamedEntity = { name: string; key: string; unit: Unit }

export function nameKey(name: string): string {
  return name
    .replace(new RegExp(`\\s+(?:${FORMS})$`), '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const LEAD = /^(?:(?:The|A|An|And|Or|Our|We|Use|Uses|Using|With|By|Via|Including|Also)\s+)+/

export function findNames(text: string): string[] {
  return [...text.matchAll(NAME)].map((m) => m[0].trim().replace(LEAD, '')).filter((n) => n !== '')
}

function mentions(word: string, text: string): number {
  return text.split(new RegExp(`\\b${word.replace(/[^\w]/g, '')}\\b`, 'i')).length - 1
}

/** Sub-processors named in the DPA's sub-processor clauses or annex, without the contracting parties. */
export function dpaSubprocessors(dpa: Chunk[]): NamedEntity[] {
  const all = dpa.map((c) => c.text).join('\n')
  const relevant = dpa.filter(
    (c) => matchHints(`${c.heading ?? ''}\n${c.text}`, SUBPROC_HINTS).length > 0,
  )
  const seen = new Map<string, NamedEntity>()
  for (const unit of units(relevant)) {
    for (const name of findNames(unit.text)) {
      const key = nameKey(name)
      const first = key.split(' ')[0] ?? ''
      if (key === '' || mentions(first, all) >= PARTY_MIN_MENTIONS) continue
      if (!seen.has(key)) seen.set(key, { name, key, unit })
    }
  }
  return [...seen.values()]
}

/** Matches a listed name in free text even without its company form ("Cobalt Hosting"). */
function mentionsListed(text: string, listed: NamedEntity[]): Set<string> {
  const flat = ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `
  return new Set(listed.filter((e) => flat.includes(` ${e.key} `)).map((e) => e.key))
}

export function checkSubprocessors(
  answers: VendorAnswer[],
  dpa: Chunk[],
  docNames: Record<string, string>,
): ConsistencyFinding[] {
  const listed = dpaSubprocessors(dpa)
  if (listed.length === 0) return []
  const dpaText = dpa.map((c) => c.text).join('\n')
  const out: ConsistencyFinding[] = []
  for (const a of answers) {
    if (matchHints(`${a.question}\n${a.answer}`, SUBPROC_HINTS).length === 0) continue
    const contract = listed.flatMap((e) => evidenceFor(e.unit, docNames) ?? [])
    if (NONE.test(a.answer) || (NO.test(a.answer) && /\buse any\b/i.test(a.question))) {
      const answer = answerEvidence(a, docNames, (s) => NONE.test(s))
      if (answer && contract.length > 0)
        out.push({
          id: `C-SUBPROC:${a.qid}`,
          ruleId: 'C-SUBPROC',
          qid: a.qid,
          kind: 'none-vs-list',
          status: 'CONFLICT',
          answer,
          contract,
          detail: { count: String(listed.length) },
        })
      continue
    }
    const known = mentionsListed(a.answer, listed)
    for (const name of findNames(a.answer)) {
      const key = nameKey(name)
      const first = key.split(' ')[0] ?? ''
      if (known.has(key) || mentions(first, dpaText) >= PARTY_MIN_MENTIONS) continue
      const answer = answerEvidence(a, docNames, (s) => s.includes(name))
      if (!answer || contract.length === 0) continue
      out.push({
        id: `C-SUBPROC:${a.qid}:${key}`,
        ruleId: 'C-SUBPROC',
        qid: a.qid,
        kind: 'unlisted-name',
        status: 'CONFLICT',
        answer,
        contract,
        detail: { name },
      })
    }
  }
  return out
}
