import { readFileSync } from 'node:fs'
import mammoth from 'mammoth'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { IngestAdapters } from '../../src/core/ingest/index.ts'

// Node versions of the browser adapters, used by unit tests and the eval.
export const nodeAdapters: IngestAdapters = {
  loadPdf: (data) => getDocument({ data: new Uint8Array(data), verbosity: 0 }).promise,
  docxToHtml: async (bytes) => (await mammoth.convertToHtml({ buffer: Buffer.from(bytes) })).value,
}

export const fixture = (name: string) => new Uint8Array(readFileSync(`tests/fixtures/${name}`))
