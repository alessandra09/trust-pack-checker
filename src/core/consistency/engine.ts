import type { Chunk } from '../types.ts'
import { checkDurations } from './durations.ts'
import { checkAiTraining, checkAudit, checkClaims, checkTransfers } from './keywords.ts'
import { checkSubprocessors } from './subprocessors.ts'
import type { ConsistencyFinding, VendorAnswer } from './types.ts'

const STATUS_ORDER = { CONFLICT: 0, PARTIAL: 1, NOT_FOUND: 2 } as const

/**
 * Client mode (SPEC 9.3): compares a vendor's answers with its DPA. Every check is code; a finding
 * exists only when both sides have a verified quote (the claim check quotes the answer only).
 */
export function checkConsistency(
  answers: VendorAnswer[],
  dpa: Chunk[],
  docNames: Record<string, string>,
): ConsistencyFinding[] {
  const ctx = { answers, dpa, docNames }
  const all = [
    ...checkDurations(answers, dpa, docNames),
    ...checkSubprocessors(answers, dpa, docNames),
    ...checkTransfers(ctx),
    ...checkAudit(ctx),
    ...checkAiTraining(ctx),
    ...checkClaims(ctx),
  ]
  const ok = all.filter(
    (f) => f.answer.verified && f.contract.every((e) => e.verified) && f.answer.quote !== '',
  )
  const order = new Map(answers.map((a, i) => [a.qid, i]))
  return ok.sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      (order.get(a.qid) ?? 0) - (order.get(b.qid) ?? 0),
  )
}
