import ExcelJS from 'exceljs'
import Papa from 'papaparse'
import type { Sheet, SheetRow, Table } from '../types.ts'
import { IngestError, LIMITS } from './errors.ts'

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object') {
    if ('richText' in value) return value.richText.map((r) => r.text).join('')
    if ('text' in value && typeof value.text === 'string') return value.text
    if ('result' in value) return value.result === undefined ? '' : String(value.result)
    if ('error' in value) return ''
  }
  return String(value).trim()
}

function checkRows(sheets: Sheet[], name: string): void {
  const rows = sheets.reduce((n, s) => n + s.rows.length, 0)
  if (rows > LIMITS.maxRows) throw new IngestError('too_many_rows', name)
  if (rows === 0) throw new IngestError('empty', name)
}

export async function xlsxToTable(id: string, name: string, bytes: Uint8Array): Promise<Table> {
  const wb = new ExcelJS.Workbook()
  try {
    await wb.xlsx.load(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    )
  } catch {
    throw new IngestError('corrupt', name)
  }
  const sheets: Sheet[] = wb.worksheets.map((ws) => {
    const rows: SheetRow[] = []
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const cells: string[] = []
      for (let c = 1; c <= ws.columnCount; c++) cells.push(cellText(row.getCell(c).value))
      if (cells.some((c) => c !== '')) rows.push({ index: rowNumber, cells, hidden: row.hidden })
    })
    return { name: ws.name, rows, hidden: ws.state !== 'visible' }
  })
  checkRows(sheets, name)
  return { id, name, sheets }
}

export function csvToTable(id: string, name: string, text: string): Table {
  const parsed = Papa.parse<string[]>(text.replace(/^\uFEFF/, ''), { skipEmptyLines: 'greedy' })
  if (parsed.errors.some((e) => e.type === 'Quotes')) throw new IngestError('corrupt', name)
  const rows: SheetRow[] = parsed.data.map((cells, i) => ({
    index: i + 1,
    cells: cells.map((c) => c.trim()),
    hidden: false,
  }))
  const sheets: Sheet[] = [{ name: 'CSV', rows, hidden: false }]
  checkRows(sheets, name)
  return { id, name, sheets }
}
