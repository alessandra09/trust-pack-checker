import mammoth from 'mammoth'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { IngestAdapters } from '../core/ingest/index.ts'

GlobalWorkerOptions.workerSrc = workerUrl

// Browser versions of the parsers (pdf.js v6 uses no eval, so the strict CSP holds).
export const browserAdapters: IngestAdapters = {
  loadPdf: (data) => getDocument({ data, verbosity: 0 }).promise,
  docxToHtml: async (bytes) => {
    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer
    return (await mammoth.convertToHtml({ arrayBuffer })).value
  },
}
