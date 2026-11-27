import type { Sheet, SheetRow, Table } from '../types.ts'

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
const ID_WORDS = /^(id|#|no\.?|ref\.?|ref(erence)? ?(no\.?)?|item|q ?id|number)$/i
const HEADER_WORDS =
  /^(id|#|no\.?|ref|question|questions|answer|response|comments?|notes?|control|requirement)$/i

const isQuestionLike = (s: string) =>
  s.length >= 20 && s.length <= 300 && (s.trim().endsWith('?') || QUESTION_START.test(s.trim()))

function columnCount(sheet: Sheet): number {
  return sheet.rows.reduce((n, r) => Math.max(n, r.cells.length), 0)
}

// Title rows often sit above the header (QA, SPRINT2 task 4): look for it in the first rows.
const HEADER_SCAN_ROWS = 10

function findHeader(sheet: Sheet): SheetRow | undefined {
  const words = (r: SheetRow) => r.cells.filter((v) => HEADER_WORDS.test(v.trim())).length
  const first = sheet.rows[0]
  if (first && words(first) >= 1) return first
  return sheet.rows.slice(0, HEADER_SCAN_ROWS).find((r) => words(r) >= 2)
}

/** The ID column: a header like "ID" or "Ref", else the nearest column on the left with unique values. */
function findIdCol(sheet: Sheet, questionCol: number, header: SheetRow | undefined): number | null {
  const named = header?.cells.findIndex((v, i) => i < questionCol && ID_WORDS.test(v.trim())) ?? -1
  if (named >= 0) return named
  const data = sheet.rows.filter((r) => isQuestionLike(r.cells[questionCol] ?? ''))
  for (let c = questionCol - 1; c >= 0; c--) {
    const values = data.map((r) => (r.cells[c] ?? '').trim()).filter((v) => v !== '')
    if (values.length > 0 && new Set(values).size / data.length >= 0.9) return c
  }
  return null
}

export function detectColumns(sheet: Sheet): ColumnMapping | null {
  const cols = columnCount(sheet)
  let best = { col: -1, share: 0, count: 0 }
  for (let c = 0; c < cols; c++) {
    const cells = sheet.rows.map((r) => r.cells[c] ?? '').filter((v) => v !== '')
    if (cells.length === 0) continue
    const count = cells.filter(isQuestionLike).length
    const share = count / cells.length
    if (share > best.share) best = { col: c, share, count }
  }
  if (best.col < 0 || best.share < 0.3) return null

  const header = findHeader(sheet)
  const headerRow = header ? header.index : null
  const dataRows = sheet.rows.filter((r) => (headerRow === null ? true : r.index > headerRow))
  let answerCol: number | null = null
  for (let c = best.col + 1; c < cols; c++) {
    const cells = dataRows.map((r) => (r.cells[c] ?? '').trim())
    const fit = cells.filter((v) => v === '' || YES_NO.test(v)).length / Math.max(cells.length, 1)
    const name = header?.cells[c] ?? ''
    if (fit >= 0.8 || /answer|response/i.test(name)) {
      answerCol = c
      break
    }
  }
  const idCol = findIdCol(sheet, best.col, header)
  return { sheet: sheet.name, headerRow, questionCol: best.col, answerCol, idCol }
}

/** Number of questions a mapping would read; used to pick the questionnaire sheet. */
function questionCount(sheet: Sheet, m: ColumnMapping): number {
  return sheet.rows.filter((r) => isQuestionLike(r.cells[m.questionCol] ?? '')).length
}

// The sheet with the most questions wins, so a cover sheet with one instruction line does not (QA bug).
export function detectTable(table: Table): ColumnMapping | null {
  let best: { m: ColumnMapping; n: number } | null = null
  for (const s of table.sheets.filter((x) => !x.hidden)) {
    const m = detectColumns(s)
    const n = m ? questionCount(s, m) : 0
    if (m && (!best || n > best.n)) best = { m, n }
  }
  return best?.m ?? null
}

/** Rows with a question become questions; rows with only a short label become the current section. */
export function extractQuestions(table: Table, m: ColumnMapping): Question[] {
  const sheet = table.sheets.find((s) => s.name === m.sheet)
  if (!sheet) return []
  const out: Question[] = []
  let section: string | undefined
  for (const row of sheet.rows) {
    if (m.headerRow !== null && row.index <= m.headerRow) continue
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
