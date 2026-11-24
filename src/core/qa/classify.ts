import type { Topic } from '../../data/schemas.ts'
import { matchHints } from '../rules/candidates.ts'

export const OTHER_TOPIC = 'T19'

// SPEC 8.2: keyword rules first. The model is used only when nothing matches and AI is enabled.
export function classifyTopic(
  question: string,
  topics: Topic[],
): { topic: string; matched: string[] } {
  let best = { topic: OTHER_TOPIC, matched: [] as string[] }
  for (const t of topics) {
    if (t.id === OTHER_TOPIC) continue
    const matched = matchHints(question, t.hints)
    if (matched.length > best.matched.length) best = { topic: t.id, matched }
  }
  return best
}
