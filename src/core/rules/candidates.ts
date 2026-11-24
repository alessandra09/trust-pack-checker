import { tokenize } from '../search/stem.ts'
import type { Chunk } from '../types.ts'

// SPEC 9.2 step 1: candidate chunks contain any hint (case-insensitive, stemmed), ranked by distinct hints matched.
export const RULE_TOP_N = 3

type HintRule = { hints: string[]; negativeHints: string[] }
export type Candidate = { chunk: Chunk; matchedHints: string[] }

function containsSequence(haystack: string[], needle: string[]): boolean {
  if (needle.length === 0 || needle.length > haystack.length) return false
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (haystack[i + j] !== needle[j]) continue outer
    return true
  }
  return false
}

export function matchHints(text: string, hints: string[]): string[] {
  const tokens = tokenize(text)
  return hints.filter((h) => containsSequence(tokens, tokenize(h)))
}

export function findRuleCandidates(
  rule: HintRule,
  chunks: Chunk[],
  topN = RULE_TOP_N,
): Candidate[] {
  return chunks
    .map((chunk, order) => ({
      chunk,
      order,
      matchedHints: matchHints(`${chunk.heading ?? ''}\n${chunk.text}`, rule.hints),
    }))
    .filter((c) => c.matchedHints.length > 0)
    .filter((c) => matchHints(c.chunk.text, rule.negativeHints).length === 0)
    .sort((a, b) => b.matchedHints.length - a.matchedHints.length || a.order - b.order)
    .slice(0, topN)
    .map(({ chunk, matchedHints }) => ({ chunk, matchedHints }))
}
