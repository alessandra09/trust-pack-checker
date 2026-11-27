import type { Doc, DocKind } from '../types.ts'
import { IngestError, LIMITS } from './errors.ts'
import { dehyphenate, makeDoc, unwrapLines } from './text.ts'

// Minimal shape of pdf.js that we use, so the browser build and Node (tests, eval) can inject their own copy.
type TextItem = { str: string; hasEOL?: boolean }
type PdfPage = { getTextContent(): Promise<{ items: unknown[] }> }
export type PdfDocument = { numPages: number; getPage(n: number): Promise<PdfPage> }
export type PdfLoader = (data: Uint8Array) => Promise<PdfDocument>

function isTextItem(item: unknown): item is TextItem {
  return typeof item === 'object' && item !== null && typeof (item as TextItem).str === 'string'
}

export function pageTextFromItems(items: unknown[]): string {
  let out = ''
  for (const item of items) {
    if (!isTextItem(item)) continue
    out += item.str
    out += item.hasEOL ? '\n' : ''
  }
  return out
}

function classifyLoadError(err: unknown, fileName: string): IngestError {
  const name = typeof err === 'object' && err !== null ? (err as { name?: string }).name : ''
  return new IngestError(name === 'PasswordException' ? 'password' : 'corrupt', fileName)
}

export async function pdfToDoc(
  id: string,
  name: string,
  kind: DocKind,
  bytes: Uint8Array,
  load: PdfLoader,
): Promise<Doc> {
  let pdf: PdfDocument
  try {
    pdf = await load(bytes)
  } catch (err) {
    throw classifyLoadError(err, name)
  }
  if (pdf.numPages > LIMITS.maxPages) throw new IngestError('too_many_pages', name)

  const pages: string[] = []
  for (let n = 1; n <= pdf.numPages; n++) {
    const content = await (await pdf.getPage(n)).getTextContent()
    pages.push(unwrapLines(dehyphenate(pageTextFromItems(content.items))))
  }
  const totalChars = pages.reduce((sum, p) => sum + p.replace(/\s/g, '').length, 0)
  if (totalChars / Math.max(pdf.numPages, 1) < LIMITS.scannedCharsPerPage) {
    throw new IngestError('scanned_pdf', name)
  }
  return makeDoc(id, name, kind, pages)
}
