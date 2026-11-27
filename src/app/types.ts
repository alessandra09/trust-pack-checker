import type { IngestErrorCode, IngestWarningCode } from '../core/ingest/errors.ts'
import type { DraftedAnswer } from '../core/qa/answer.ts'
import type { ColumnMapping, Question } from '../core/qa/detect.ts'
import type { RuleResult } from '../core/rules/engine.ts'
import type { ConsistencyFinding } from '../core/consistency/types.ts'
import type { Chunk, Doc, DocKind, Table } from '../core/types.ts'

export type Mode = 'company' | 'client'
export type Step = 'mode' | 'upload' | 'review'
export type DocSlotId = 'dpa' | 'privacy' | 'security' | 'ropa'
export type SlotId = DocSlotId | 'questionnaire'

export type LoadedFile = {
  name: string
  warnings: IngestWarningCode[]
  error?: IngestErrorCode | 'unknown'
  doc?: Doc
  table?: Table
  bytes?: Uint8Array
}

export type ReviewAnswer = DraftedAnswer & {
  warnings?: string[]
  followUp?: boolean
  libraryNote?: 'supported' | 'outdated'
  libraryAnswer?: string
  libraryDate?: string
}
export type ReviewFinding = RuleResult & {
  reviewed: 'pending' | 'accepted' | 'edited' | 'rejected'
  followUp?: boolean
}

export type ReviewConsistency = ConsistencyFinding & {
  reviewed: 'pending' | 'accepted' | 'edited' | 'rejected'
  followUp?: boolean
}
/** A vendor answer row shown next to a client-mode finding. */
export type VendorRow = { qid: string; question: string; answer: string; chunkId: string }

export type Analysis = {
  chunks: Chunk[]
  docNames: Record<string, string>
  questions: Question[]
  answers: Record<string, ReviewAnswer>
  findings: ReviewFinding[]
  /** Client mode only: findings from comparing the vendor's answers with its DPA. */
  consistency: ReviewConsistency[]
  vendorRows: VendorRow[]
}

export type Tab = 'questions' | 'vendor' | 'rules' | 'gaps' | 'ai'

export type AppState = {
  step: Step
  mode: Mode | null
  files: Partial<Record<SlotId, LoadedFile>>
  mapping: ColumnMapping | null
  analysis: Analysis | null
  selected: string | null
  tab: Tab
  statusFilter: string
  search: string
  sample: boolean
}

export const DOC_SLOTS: { id: DocSlotId; kind: DocKind; required: boolean }[] = [
  { id: 'dpa', kind: 'dpa', required: true },
  { id: 'privacy', kind: 'privacy', required: false },
  { id: 'security', kind: 'security', required: false },
  { id: 'ropa', kind: 'ropa', required: false },
]
