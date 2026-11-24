// Evidence data model (SPEC 6.1).
export type DocKind =
  'dpa' | 'privacy' | 'security' | 'ropa' | 'questionnaire' | 'answers' | 'other'
export type Page = { n: number; text: string } // n = 1 for non-paged formats
export type Doc = { id: string; name: string; kind: DocKind; pages: Page[]; text: string }
export type Chunk = {
  id: string
  docId: string
  page: number
  heading?: string
  text: string
  start: number
  end: number
  annex: boolean
}
export type Evidence = {
  chunkId: string
  docName: string
  page: number
  quote: string
  verified: boolean
}
export type Status = 'FOUND' | 'PARTIAL' | 'NOT_FOUND' | 'CONFLICT' | 'NEEDS_HUMAN'
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
export type Answer = {
  qid: string
  status: Status
  draft?: string
  evidence: Evidence[]
  source: 'rules' | 'retrieval' | 'llm'
  reviewed: 'pending' | 'accepted' | 'edited' | 'rejected'
  note?: string
}
export type Finding = {
  id: string
  ruleId: string
  status: Status
  severity: Severity
  evidence: Evidence[]
  whyItMatters: string
  suggestedAsk?: string
}

// A spreadsheet or CSV as plain cell text, before questionnaire detection (M2).
export type SheetRow = { index: number; cells: string[]; hidden: boolean }
export type Sheet = { name: string; rows: SheetRow[]; hidden: boolean }
export type Table = { id: string; name: string; sheets: Sheet[] }
