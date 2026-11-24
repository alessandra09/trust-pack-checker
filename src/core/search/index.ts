import MiniSearch from 'minisearch'
import type { Chunk } from '../types.ts'
import { stem } from './stem.ts'

// Client-side BM25 retrieval (SPEC 7.3). Heading boosted x2; top-k = 5.
export const TOP_K = 5

export type ChunkIndex = { search(query: string, k?: number): Chunk[] }

export function buildIndex(chunks: Chunk[]): ChunkIndex {
  const byId = new Map(chunks.map((c) => [c.id, c]))
  const ms = new MiniSearch<Chunk>({
    fields: ['heading', 'text'],
    idField: 'id',
    processTerm: (term) => {
      const t = term.toLowerCase()
      return t.length < 2 ? null : stem(t)
    },
    searchOptions: { boost: { heading: 2 } },
  })
  ms.addAll(chunks)
  return {
    search(query, k = TOP_K) {
      return ms
        .search(query)
        .slice(0, k)
        .map((r) => byId.get(String(r.id)))
        .filter((c): c is Chunk => c !== undefined)
    },
  }
}
