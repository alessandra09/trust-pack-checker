import MiniSearch from 'minisearch'
import { z } from 'zod'
import { verifyQuote } from '../llm/verifyQuote.ts'
import { stem } from '../search/stem.ts'
import type { Chunk } from '../types.ts'

// SPEC 8.4 approved-answers library. A suggestion is never document evidence and never produces FOUND by itself.
export const libraryEntrySchema = z.object({
  question: z.string().min(1),
  topic: z.string(),
  answer: z.string(),
  quote: z.string(),
  sourceDocument: z.string(),
  dateApproved: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reviewer: z.string(),
})
export const libraryFileSchema = z.object({
  format: z.literal('trust-library'),
  version: z.literal(1),
  entries: z.array(libraryEntrySchema),
})
export type LibraryEntry = z.infer<typeof libraryEntrySchema>
export type LibraryFile = z.infer<typeof libraryFileSchema>

export function exportLibrary(entries: LibraryEntry[]): string {
  return JSON.stringify(
    { format: 'trust-library', version: 1, entries } satisfies LibraryFile,
    null,
    2,
  )
}

export function importLibrary(json: string): LibraryFile | null {
  try {
    const parsed = libraryFileSchema.safeParse(JSON.parse(json))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/** Minimum BM25 score for a library question to count as the same question. Set from unit tests; retune on real libraries. */
export const MATCH_THRESHOLD = 6

export type Suggestion = { entry: LibraryEntry; score: number; stillSupported: boolean }

export function buildLibraryMatcher(entries: LibraryEntry[]) {
  const ms = new MiniSearch<LibraryEntry & { id: number }>({
    fields: ['question'],
    storeFields: [],
    processTerm: (t) => (t.length < 2 ? null : stem(t.toLowerCase())),
  })
  ms.addAll(entries.map((e, id) => ({ ...e, id })))
  return (question: string, topic: string, chunks: Chunk[]): Suggestion | null => {
    const hit = ms
      .search(question)
      .find((r) => entries[Number(r.id)]?.topic === topic && r.score >= MATCH_THRESHOLD)
    const entry = hit ? entries[Number(hit.id)] : undefined
    if (!hit || !entry) return null
    // The evidence check against the CURRENT documents still runs: an unsupported quote means "may be outdated".
    const stillSupported =
      entry.quote.length > 0 && chunks.some((c) => verifyQuote(entry.quote, c.text))
    return { entry, score: hit.score, stillSupported }
  }
}
