import { IngestError } from '../core/ingest/errors.ts'
import { ingestDocument, ingestTable } from '../core/ingest/index.ts'
import type { DocKind } from '../core/types.ts'
import { browserAdapters } from './adapters.ts'
import type { LoadedFile } from './types.ts'

// File contents are never logged (SPEC 7.1); only the error code and file name reach the UI.
export async function loadDocFile(file: File, slot: string, kind: DocKind): Promise<LoadedFile> {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const r = await ingestDocument(slot, file.name, kind, bytes, browserAdapters)
    return { name: file.name, doc: r.doc, warnings: r.warnings }
  } catch (e) {
    return { name: file.name, warnings: [], error: e instanceof IngestError ? e.code : 'unknown' }
  }
}

export async function loadTableFile(file: File): Promise<LoadedFile> {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const r = await ingestTable('questionnaire', file.name, bytes)
    return {
      name: file.name,
      table: r.table,
      warnings: r.warnings,
      ...(/\.xlsx$/i.test(file.name) ? { bytes } : {}),
    }
  } catch (e) {
    return { name: file.name, warnings: [], error: e instanceof IngestError ? e.code : 'unknown' }
  }
}

export function download(name: string, data: Uint8Array | string, type: string): void {
  const blob = new Blob([typeof data === 'string' ? data : (data.slice().buffer as ArrayBuffer)], {
    type,
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
