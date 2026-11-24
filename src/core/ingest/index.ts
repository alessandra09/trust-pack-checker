import type { Doc, DocKind, Table } from '../types.ts'
import { docxToDoc, type DocxToHtml } from './docx.ts'
import { assertSize, IngestError, type IngestWarningCode } from './errors.ts'
import { looksEnglish } from './language.ts'
import { pdfToDoc, type PdfLoader } from './pdf.ts'
import { csvToTable, xlsxToTable } from './sheet.ts'
import { makeDoc } from './text.ts'

export type IngestAdapters = { loadPdf: PdfLoader; docxToHtml: DocxToHtml }
export type DocResult = { type: 'doc'; doc: Doc; warnings: IngestWarningCode[] }
export type TableResult = { type: 'table'; table: Table; warnings: IngestWarningCode[] }

export function extensionOf(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name)
  return m?.[1]?.toLowerCase() ?? ''
}

const decoder = new TextDecoder('utf-8')

function withWarnings(doc: Doc): DocResult {
  return { type: 'doc', doc, warnings: looksEnglish(doc.text) ? [] : ['not_english'] }
}

/** Parses a document file (DPA, policy) into a Doc. Throws IngestError with a code the UI can explain. */
export async function ingestDocument(
  id: string,
  name: string,
  kind: DocKind,
  bytes: Uint8Array,
  adapters: IngestAdapters,
): Promise<DocResult> {
  assertSize(bytes.byteLength, name)
  const ext = extensionOf(name)
  if (ext === 'pdf') return withWarnings(await pdfToDoc(id, name, kind, bytes, adapters.loadPdf))
  if (ext === 'docx')
    return withWarnings(await docxToDoc(id, name, kind, bytes, adapters.docxToHtml))
  if (ext === 'txt' || ext === 'md')
    return withWarnings(makeDoc(id, name, kind, [decoder.decode(bytes)]))
  throw new IngestError('unsupported_type', name)
}

/** Text pasted by the user. */
export function ingestPasted(id: string, name: string, kind: DocKind, text: string): DocResult {
  return withWarnings(makeDoc(id, name, kind, [text]))
}

/** Parses a questionnaire or answers file (XLSX, CSV) into a Table. */
export async function ingestTable(
  id: string,
  name: string,
  bytes: Uint8Array,
): Promise<TableResult> {
  assertSize(bytes.byteLength, name)
  const ext = extensionOf(name)
  if (ext === 'xlsx')
    return { type: 'table', table: await xlsxToTable(id, name, bytes), warnings: [] }
  if (ext === 'csv')
    return { type: 'table', table: csvToTable(id, name, decoder.decode(bytes)), warnings: [] }
  throw new IngestError('unsupported_type', name)
}
