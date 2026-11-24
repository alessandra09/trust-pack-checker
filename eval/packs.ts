import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chunkDoc } from '../src/core/chunk/chunker.ts'
import { makeDoc } from '../src/core/ingest/text.ts'
import type { Chunk, Doc } from '../src/core/types.ts'

export const PACKS_DIR = 'eval/packs'

export type KeyRule = {
  expected: 'FOUND' | 'PARTIAL' | 'NOT_FOUND' | 'CONFLICT'
  quote?: string
  conflictQuote?: string
  defect?: string
  missingElements?: string[]
  incorporatedByReference?: boolean
}
export type Defect = {
  id: string
  type: 'missing' | 'partial' | 'vague' | 'incorporated' | 'contradictory' | 'decoy'
  ruleId: string
}
export type PackKey = {
  pack: string
  document: string
  rules: Record<string, KeyRule>
  defects: Defect[]
}
export type LoadedPack = { name: string; doc: Doc; chunks: Chunk[]; key: PackKey }

export function listPacks(): string[] {
  if (!existsSync(PACKS_DIR)) return []
  return readdirSync(PACKS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
}

// The key is read only by the evaluator, never passed to the engine or the model.
export function loadPack(name: string): LoadedPack {
  const key = JSON.parse(readFileSync(join(PACKS_DIR, name, 'key', 'key.json'), 'utf8')) as PackKey
  const text = readFileSync(join(PACKS_DIR, name, key.document), 'utf8')
  const doc = makeDoc(name, key.document, 'dpa', [text])
  return { name, doc, chunks: chunkDoc(doc), key }
}
