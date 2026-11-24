import type { Doc, DocKind } from '../types.ts'
import { IngestError } from './errors.ts'
import { htmlToStructuredText } from './html.ts'
import { makeDoc } from './text.ts'

// mammoth differs between browser and Node, so the caller injects a DOCX -> HTML converter.
export type DocxToHtml = (bytes: Uint8Array) => Promise<string>

export async function docxToDoc(
  id: string,
  name: string,
  kind: DocKind,
  bytes: Uint8Array,
  toHtml: DocxToHtml,
): Promise<Doc> {
  let html: string
  try {
    html = await toHtml(bytes)
  } catch {
    throw new IngestError('corrupt', name)
  }
  return makeDoc(id, name, kind, [htmlToStructuredText(html)])
}
