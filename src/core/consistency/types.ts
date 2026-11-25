import type { Chunk, Evidence, Status } from '../types.ts'

// Client mode (SPEC 9.3): one vendor answer row, kept as its own chunk so its quote can be verified.
export type VendorAnswer = {
  qid: string
  question: string
  answer: string
  chunk: Chunk
}

export type ConsistencyKind =
  | 'numbers-differ'
  | 'one-number'
  | 'none-vs-list'
  | 'unlisted-name'
  | 'eu-only-vs-location'
  | 'audit-excluded'
  | 'audit-limited'
  | 'ai-polarity'
  | 'claim-unbacked'

/**
 * A code-decided finding. `answer` quotes the vendor's answer, `contract` quotes the DPA.
 * Every quote here passed verifyQuote against its chunk; the model never decides these.
 */
export type ConsistencyFinding = {
  id: string
  ruleId: string
  qid: string
  kind: ConsistencyKind
  status: Extract<Status, 'CONFLICT' | 'PARTIAL' | 'NOT_FOUND'>
  answer: Evidence
  contract: Evidence[]
  /** Values for the plain-language diff line, e.g. { answer: '24 hours', contract: '72 hours' }. */
  detail: Record<string, string>
}

/** A sentence or table row inside a chunk; the unit that becomes a quote. */
export type Unit = { chunk: Chunk; text: string }
