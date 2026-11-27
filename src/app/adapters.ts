import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { IngestAdapters } from '../core/ingest/index.ts'

// Browser versions of the parsers (pdf.js v6 uses no eval, so the strict CSP holds), loaded on first use.
export const browserAdapters: IngestAdapters = {
  loadPdf: async (data) => {
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
    GlobalWorkerOptions.workerSrc = workerUrl
    return getDocument({ data, verbosity: 0 }).promise
  },
  docxToHtml: async (bytes) => {
    const { default: mammoth } = await import('mammoth')
    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer
    return (await mammoth.convertToHtml({ arrayBuffer })).value
  },
}
