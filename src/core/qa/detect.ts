import type { Sheet, Table } from '../types.ts'

// SPEC 8.1: detect the question and answer columns; the UI always shows the result and lets the user change it.
export type ColumnMapping = {
  sheet: string
  headerRow: number | null
  questionCol: number
  answerCol: number | null
  idCol: number | null
}
export type Question = {
  qid: string
  sheet: string
  row: number
  text: string
  existingAnswer: string
  section?: string
  hidden: boolean
}

const QUESTION_START =
  /^(do|does|did|is|are|was|were|can|could|have|has|how|what|which|who|where|when|why|will|would|should|please|describe|provide|list|explain|confirm|state|indicate|specify)\b/i
const YES_NO = /^(yes|no|n\/a|na|partial|partially|yes\/no)$/i
const HEADER_WORDS =
  /^(id|#|no\.?|ref|question|questions|answer|response|comments?|notes?|control|requirement)$/i

const isQuestionLike = (s: string) =>
  s.length >= 20 && s.length <= 300 && (s.trim().endsWith('?') || QUESTION_START.test(s.trim()))

function columnCount(sheet: Sheet): number {
  return sheet.rows.reduce((n, r) => Math.max(n, r.cells.length), 0)
}

export function detectColumns(sheet: Sheet): ColumnMapping | null {
  const cols = columnCount(sheet)
  let best = { col: -1, share: 0 }
  for (let c = 0; c < cols; c++) {
    const cells = sheet.rows.map((r) => r.cells[c] ?? '').filter((v) => v !== '')
    if (cells.length === 0) continue
    const share = cells.filter(isQuestionLike).length / cells.length
    if (share > best.share) best = { col: c, share }
  }
  if (best.col < 0 || best.share < 0.3) return null

  const first = sheet.rows[0]
  const headerRow =
    first && first.cells.some((v) => HEADER_WORDS.test(v.trim())) ? first.index : null
  const dataRows = sheet.rows.filter((r) => r.index !== headerRow)
  let answerCol: number | null = null
  for (let c = best.col + 1; c < cols; c++) {
    const cells = dataRows.map((r) => (r.cells[c] ?? '').trim())
    const fit = cells.filter((v) => v === '' || YES_NO.test(v)).length / Math.max(cells.length, 1)
    const header = first?.cells[c] ?? ''
    if (fit >= 0.8 || /answer|response/i.test(header)) {
      answerCol = c
      break
    }
  }
  const idCol = best.col > 0 ? best.col - 1 : null
  return { sheet: sheet.name, headerRow, questionCol: best.col, answerCol, idCol }
}

export function detectTable(table: Table): ColumnMapping | null {
  const scored = table.sheets
    .filter((s) => !s.hidden)
    .map((s) => detectColumns(s))
    .filter((m): m is ColumnMapping => m !== null)
  return scored[0] ?? null
}

/** Rows with a question become questions; rows with only a short label become the current section. */
export function extractQuestions(table: Table, m: ColumnMapping): Question[] {
  const sheet = table.sheets.find((s) => s.name === m.sheet)
  if (!sheet) return []
  const out: Question[] = []
  let section: string | undefined
  for (const row of sheet.rows) {
    if (row.index === m.headerRow) continue
    const text = (row.cells[m.questionCol] ?? '').trim()
    if (text === '') continue
    if (!isQuestionLike(text)) {
      section = text
      continue
    }
    const id = m.idCol !== null ? (row.cells[m.idCol] ?? '').trim() : ''
    out.push({
      qid: id || `${sheet.name}!${row.index}`,
      sheet: sheet.name,
      row: row.index,
      text,
      existingAnswer: m.answerCol !== null ? (row.cells[m.answerCol] ?? '').trim() : '',
      ...(section ? { section } : {}),
      hidden: row.hidden,
    })
  }
  return out
}
