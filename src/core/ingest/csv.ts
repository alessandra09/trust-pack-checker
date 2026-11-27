import Papa from 'papaparse'
import type { Sheet, SheetRow, Table } from '../types.ts'
import { IngestError, LIMITS } from './errors.ts'

// CSV parsing lives apart from XLSX so the app can load the large XLSX library only when needed.
export function checkRows(sheets: Sheet[], name: string): void {
  const rows = sheets.reduce((n, s) => n + s.rows.length, 0)
  if (rows > LIMITS.maxRows) throw new IngestError('too_many_rows', name)
  if (rows === 0) throw new IngestError('empty', name)
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
