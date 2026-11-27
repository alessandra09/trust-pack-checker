import ExcelJS from 'exceljs'
import type { Sheet, SheetRow, Table } from '../types.ts'
import { checkRows } from './csv.ts'
import { IngestError } from './errors.ts'

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

export { csvToTable } from './csv.ts'
