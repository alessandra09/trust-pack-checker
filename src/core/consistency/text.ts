import { verifyQuote, QUOTE_MAX_LENGTH, QUOTE_MIN_LENGTH } from '../llm/verifyQuote.ts'
import type { Chunk, Evidence } from '../types.ts'
import type { Unit, VendorAnswer } from './types.ts'

// Splits text into quotable units: each line, then sentences inside a line. Table rows stay whole.
// A sentence ends at . ! ? followed by space and a capital, so "Inc. (usage" is not split.
export function splitUnits(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '' && !/^\|?[\s|:-]+\|?$/.test(l))
    .flatMap((l) => (l.includes('|') ? [l] : l.split(/(?<=[.!?])\s+(?=[A-Z"])/)))
    .map((s) =>
      s
        .replace(/^#+\s*/, '')
        .replace(/^\|\s*|\s*\|$/g, '')
        .trim(),
    )
    .filter((s) => s.length > 0)
}

export function units(chunks: Chunk[]): Unit[] {
  return chunks.flatMap((chunk) => splitUnits(chunk.text).map((text) => ({ chunk, text })))
}

/** Evidence for a unit, or null when the text cannot be verified as a quote of its chunk. */
export function evidenceFor(
  unit: Unit,
  docNames: Record<string, string>,
  quote: string = unit.text,
): Evidence | null {
  const q = quote.length > QUOTE_MAX_LENGTH ? quote.slice(0, QUOTE_MAX_LENGTH) : quote
  if (!verifyQuote(q, unit.chunk.text)) return null
  return {
    chunkId: unit.chunk.id,
    docName: docNames[unit.chunk.docId] ?? unit.chunk.docId,
    page: unit.chunk.page,
    quote: q,
    verified: true,
  }
}

/**
 * Quote for the vendor's side. Uses the answer sentence that `pick` selects; a short answer such as
 * "Yes." is too short to verify, so the question and answer are quoted together.
 */
export function answerEvidence(
  a: VendorAnswer,
  docNames: Record<string, string>,
  pick: (sentence: string) => boolean = () => true,
): Evidence | null {
  const sentences = splitUnits(a.answer)
  const s = sentences.find(pick) ?? sentences[0] ?? ''
  const unit = { chunk: a.chunk, text: s }
  if (s.length >= QUOTE_MIN_LENGTH) return evidenceFor(unit, docNames)
  return evidenceFor(unit, docNames, a.chunk.text)
}

export const YES = /^\s*(yes|yes,|correct|we do|we can|confirmed)\b/i
export const NO = /^\s*(no|none|not applicable|we do not|we don't|never)\b/i
