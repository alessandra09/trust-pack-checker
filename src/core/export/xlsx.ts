import ExcelJS from 'exceljs'
import type { Question } from '../qa/detect.ts'
import type { Answer } from '../types.ts'
import { DISCLAIMER, REVIEW_LABEL, STATUS_LABEL } from './labels.ts'

// SPEC 8.1: output is a COPY with new columns to the right. Existing cells, including dropdowns, are never written.
export const NEW_COLUMNS = [
  'Draft answer',
  'Status',
  'Evidence (quote)',
  'Source (document, page)',
  'Reviewer note',
] as const

export type ExportRow = { question: Question; answer: Answer }

function rowValues(a: Answer): string[] {
  const draft = a.reviewed === 'rejected' ? '' : (a.draft ?? '')
  const status = `${STATUS_LABEL[a.status]} (${REVIEW_LABEL[a.reviewed]})`
  const quotes = a.evidence.filter((e) => e.verified).map((e) => `"${e.quote}"`)
  const sources = a.evidence.filter((e) => e.verified).map((e) => `${e.docName}, p. ${e.page}`)
  return [draft, status, quotes.join('\n'), sources.join('\n'), a.note ?? '']
}

async function loadOrCreate(
  original: Uint8Array | null,
  rows: ExportRow[],
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook()
  if (original) {
    await wb.xlsx.load(
      original.buffer.slice(
        original.byteOffset,
        original.byteOffset + original.byteLength,
      ) as ArrayBuffer,
    )
    return wb
  }
  // CSV or pasted questions: build a sheet with the questions, then add the same columns.
  const sheetName = rows[0]?.question.sheet ?? 'Questions'
  const ws = wb.addWorksheet(sheetName)
  ws.addRow(['ID', 'Question', 'Existing answer'])
  for (const r of rows)
    ws.getRow(r.question.row).values = [r.question.qid, r.question.text, r.question.existingAnswer]
  return wb
}

export async function exportXlsx(
  original: Uint8Array | null,
  rows: ExportRow[],
  headerRow: number | null,
): Promise<Uint8Array> {
  const wb = await loadOrCreate(original, rows)
  const bySheet = new Map<string, ExportRow[]>()
  for (const r of rows) bySheet.set(r.question.sheet, [...(bySheet.get(r.question.sheet) ?? []), r])
  for (const [sheetName, sheetRows] of bySheet) {
    const ws = wb.getWorksheet(sheetName)
    if (!ws) continue
    const first = ws.actualColumnCount + 1
    const header = ws.getRow(headerRow ?? 1)
    NEW_COLUMNS.forEach((title, i) => {
      const cell = header.getCell(first + i)
      if (headerRow !== null || cell.value === null) cell.value = title
      cell.font = { bold: true }
    })
    for (const r of sheetRows) {
      const values = rowValues(r.answer)
      const row = ws.getRow(r.question.row)
      values.forEach((v, i) => {
        const cell = row.getCell(first + i)
        cell.value = v
        cell.alignment = { wrapText: true, vertical: 'top' }
      })
    }
    ws.getRow(ws.rowCount + 2).getCell(first).value = DISCLAIMER
  }
  return new Uint8Array(await wb.xlsx.writeBuffer())
}
