import type { Topic } from '../../data/schemas.ts'
import type { ChunkIndex } from '../search/index.ts'
import type { Answer, Chunk, DocKind } from '../types.ts'
import { OTHER_TOPIC } from './classify.ts'
import { findDurationConflict } from './conflicts.ts'
import type { Question } from './detect.ts'
import { contentTerms, sharedTerms } from './terms.ts'

// Retrieval-only answering (SPEC 7.3, 8.3). Never FOUND: possible passages are shown for the user to confirm.
export type QaContext = {
  index: ChunkIndex
  docNames: Record<string, string>
  docKinds: Record<string, DocKind>
  topics: Topic[]
}
export type DraftedAnswer = Answer & { topic: string; passages: Chunk[]; neededDocs: DocKind[] }

export const PASSAGE_K = 5
const STRONG_MATCH = 3

function missingDocTypes(topic: Topic | undefined, ctx: QaContext): DocKind[] {
  if (!topic || topic.answerableFrom.length === 0) return []
  const have = new Set(Object.values(ctx.docKinds))
  return topic.answerableFrom.some((k) => have.has(k)) ? [] : topic.answerableFrom
}

/** Passages that share enough meaningful words with the question to be worth reading. */
export function relevantPassages(question: string, ctx: QaContext): Chunk[] {
  const terms = contentTerms(question)
  const need = terms.size <= 2 ? 1 : 2
  return ctx.index
    .search(question, PASSAGE_K)
    .filter((c) => sharedTerms(terms, `${c.heading ?? ''} ${c.text}`) >= need)
}

export function answerNoAi(q: Question, topicId: string, ctx: QaContext): DraftedAnswer {
  const topic = ctx.topics.find((t) => t.id === topicId)
  const base = {
    qid: q.qid,
    topic: topicId,
    source: 'retrieval' as const,
    reviewed: 'pending' as const,
  }
  const neededDocs = missingDocTypes(topic, ctx)
  if (neededDocs.length > 0) {
    return {
      ...base,
      status: 'NEEDS_HUMAN',
      evidence: [],
      passages: [],
      neededDocs,
      note: 'needs-doc',
    }
  }
  const passages = relevantPassages(q.text, ctx)
  const conflict = findDurationConflict(q.text, passages, ctx.docNames, topic?.hints ?? [])
  if (conflict) return { ...base, status: 'CONFLICT', evidence: conflict, passages, neededDocs: [] }
  if (passages.length === 0)
    return { ...base, status: 'NOT_FOUND', evidence: [], passages, neededDocs: [] }
  // SPEC 9.5: "Other" stays NEEDS_HUMAN unless retrieval finds a strong match.
  const terms = contentTerms(q.text)
  const strong = passages.some((c) => sharedTerms(terms, c.text) >= STRONG_MATCH)
  if (topicId === OTHER_TOPIC && !strong)
    return {
      ...base,
      status: 'NEEDS_HUMAN',
      evidence: [],
      passages,
      neededDocs: [],
      note: 'unclassified',
    }
  return {
    ...base,
    status: 'PARTIAL',
    evidence: [],
    passages,
    neededDocs: [],
    note: 'possible-passage',
  }
}
