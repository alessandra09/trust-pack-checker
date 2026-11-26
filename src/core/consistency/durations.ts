import { matchHints } from '../rules/candidates.ts'
import { scanDurations, type Duration } from '../rules/durations.ts'
import { contentTerms, sharedTerms } from '../qa/terms.ts'
import { answerEvidence, evidenceFor, units, YES } from './text.ts'
import type { ConsistencyFinding, Unit, VendorAnswer } from './types.ts'
import type { Chunk } from '../types.ts'

// C-BREACH-TIME and C-RETENTION (SPEC 9.3): numbers are parsed and compared by code.
export const DURATION_RULES = [
  { ruleId: 'C-BREACH-TIME', hints: ['breach', 'incident'] },
  {
    ruleId: 'C-RETENTION',
    hints: [
      'retention',
      'retain',
      'delete',
      'deletion',
      'return',
      'termination',
      'destroy',
      'backup',
      'export',
      'end of the contract',
    ],
  },
] as const

// A DPA sentence must share this many content words with the question and answer to be compared.
const MIN_SHARED = 2

type Statement = { unit: Unit; duration?: Duration; vague?: string; shared: number }

/** The vendor's stated duration; a bare "Yes" to "within 72 hours?" takes the question's number. */
function answerDuration(a: VendorAnswer): { duration: Duration; sentence: string } | null {
  for (const s of a.answer.split(/(?<=[.!?])\s+/)) {
    const d = scanDurations(s).durations[0]
    if (d) return { duration: d, sentence: s }
  }
  const q = scanDurations(a.question).durations[0]
  return q && YES.test(a.answer) ? { duration: q, sentence: a.answer } : null
}

function bestStatement(a: VendorAnswer, dpa: Chunk[], hints: readonly string[]): Statement | null {
  // Numbers are left out: matching "90" to "90" would pick the sentence that agrees, not the one on topic.
  const terms = new Set([...contentTerms(`${a.question} ${a.answer}`)].filter((t) => !/\d/.test(t)))
  let best: Statement | null = null
  for (const unit of units(dpa)) {
    if (matchHints(unit.text, [...hints]).length === 0) continue
    const scan = scanDurations(unit.text)
    const duration = scan.durations[0]
    const vague = scan.vague[0]
    if (!duration && !vague) continue
    // A topic word that both the answer and the sentence use (e.g. "backup") counts as one shared term.
    const answerHints = matchHints(`${a.question}\n${a.answer}`, [...hints])
    const commonHint = matchHints(unit.text, answerHints).length > 0 ? 1 : 0
    const shared = sharedTerms(terms, unit.text) + commonHint
    if (shared < MIN_SHARED) continue
    if (!best || shared > best.shared)
      best = { unit, shared, ...(duration ? { duration } : {}), ...(vague ? { vague } : {}) }
  }
  return best
}

export function checkDurations(
  answers: VendorAnswer[],
  dpa: Chunk[],
  docNames: Record<string, string>,
): ConsistencyFinding[] {
  const out: ConsistencyFinding[] = []
  for (const rule of DURATION_RULES) {
    for (const a of answers) {
      if (matchHints(`${a.question}\n${a.answer}`, [...rule.hints]).length === 0) continue
      const stated = answerDuration(a)
      const st = bestStatement(a, dpa, rule.hints)
      if (!st) continue
      const contract = evidenceFor(st.unit, docNames)
      if (!contract) continue
      const vagueAnswer = scanDurations(a.answer).vague[0]
      // Both numeric and different: CONFLICT. Only one side gives a number: PARTIAL.
      let kind: 'numbers-differ' | 'one-number'
      let detail: Record<string, string>
      if (stated && st.duration) {
        if (stated.duration.hours === st.duration.hours) continue
        kind = 'numbers-differ'
        detail = { answer: stated.duration.raw, contract: st.duration.raw }
      } else if (stated && st.vague) {
        kind = 'one-number'
        detail = { answer: stated.duration.raw, contract: st.vague }
      } else if (!stated && vagueAnswer && st.duration) {
        kind = 'one-number'
        detail = { answer: vagueAnswer, contract: st.duration.raw }
      } else continue
      const needle = (detail.answer ?? '').toLowerCase()
      const answer = answerEvidence(a, docNames, (s) => s.toLowerCase().includes(needle))
      if (!answer) continue
      out.push({
        id: `${rule.ruleId}:${a.qid}`,
        ruleId: rule.ruleId,
        qid: a.qid,
        kind,
        status: kind === 'numbers-differ' ? 'CONFLICT' : 'PARTIAL',
        answer,
        contract: [contract],
        detail,
      })
    }
  }
  return out
}
