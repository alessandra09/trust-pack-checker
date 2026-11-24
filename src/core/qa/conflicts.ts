import { verifyQuote } from '../llm/verifyQuote.ts'
import { matchHints } from '../rules/candidates.ts'
import { scanDurations } from '../rules/durations.ts'
import type { Chunk, Evidence } from '../types.ts'
import { contentTerms, sharedTerms } from './terms.ts'

// Code-decided CONFLICT (SPEC 9.3): two documents state different numeric durations for the same question.
// The model is never allowed to declare a conflict.
export type DurationStatement = { chunk: Chunk; sentence: string; hours: number; relevance: number }

const MIN_RELEVANCE = 2
// Only questions that ask about a time, period or frequency can have a duration conflict.
const TIME_CUE =
  /\b(how long|how many|how much notice|how often|how soon|how quickly|within|when|period|frequency|retain|retained|retention|hours?|days?|months?|deadline)\b/i

export function asksAboutTime(question: string): boolean {
  return TIME_CUE.test(question)
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12)
}

export function durationStatements(
  question: string,
  chunks: Chunk[],
  topicHints: string[] = [],
): DurationStatement[] {
  const terms = contentTerms(question)
  const out: DurationStatement[] = []
  for (const chunk of chunks) {
    for (const sentence of sentences(chunk.text)) {
      const d = scanDurations(sentence).durations[0]
      if (!d) continue
      // A sentence that uses the topic's own vocabulary counts as one extra shared term.
      const relevance =
        sharedTerms(terms, sentence) + (matchHints(sentence, topicHints).length > 0 ? 1 : 0)
      if (relevance >= MIN_RELEVANCE) out.push({ chunk, sentence, hours: d.hours, relevance })
    }
  }
  return out
}

/** Best statement per document; a conflict exists when two documents disagree on the number. */
export function findDurationConflict(
  question: string,
  chunks: Chunk[],
  docNames: Record<string, string>,
  topicHints: string[] = [],
): Evidence[] | null {
  if (!asksAboutTime(question)) return null
  const best = new Map<string, DurationStatement>()
  for (const s of durationStatements(question, chunks, topicHints)) {
    const cur = best.get(s.chunk.docId)
    if (!cur || s.relevance > cur.relevance) best.set(s.chunk.docId, s)
  }
  const statements = [...best.values()]
  if (new Set(statements.map((s) => s.hours)).size < 2) return null
  const evidence = statements
    .map((s) => ({ s, quote: s.sentence.slice(0, 400) }))
    .filter(({ s, quote }) => verifyQuote(quote, s.chunk.text))
    .map(({ s, quote }) => ({
      chunkId: s.chunk.id,
      docName: docNames[s.chunk.docId] ?? s.chunk.docId,
      page: s.chunk.page,
      quote,
      verified: true,
    }))
  return evidence.length >= 2 ? evidence : null
}
