import { chunkDoc } from '../core/chunk/chunker.ts'
import type { QaContext } from '../core/qa/answer.ts'
import { answerNoAi } from '../core/qa/answer.ts'
import { classifyTopic } from '../core/qa/classify.ts'
import { extractQuestions, type ColumnMapping } from '../core/qa/detect.ts'
import { evaluateAllNoAi } from '../core/rules/engine.ts'
import { buildIndex } from '../core/search/index.ts'
import type { Doc, Table } from '../core/types.ts'
import { art28, topics } from '../data/load.ts'
import type { Analysis, ReviewAnswer } from './types.ts'

export type AnalysisInput = { docs: Doc[]; table: Table | null; mapping: ColumnMapping | null }

// Company mode, no AI: retrieval answers for each question plus the Art. 28 check of the DPA.
export function analyzeCompany({ docs, table, mapping }: AnalysisInput): Analysis {
  const chunks = docs.flatMap(chunkDoc)
  const docNames = Object.fromEntries(docs.map((d) => [d.id, d.name]))
  const ctx: QaContext = {
    index: buildIndex(chunks),
    docNames,
    docKinds: Object.fromEntries(docs.map((d) => [d.id, d.kind])),
    topics: topics.topics,
  }
  const questions =
    table && mapping ? extractQuestions(table, mapping).filter((q) => !q.hidden) : []
  const answers: Record<string, ReviewAnswer> = {}
  for (const q of questions)
    answers[q.qid] = answerNoAi(q, classifyTopic(q.text, topics.topics).topic, ctx)
  const dpaChunks = chunks.filter((c) => docs.find((d) => d.id === c.docId)?.kind === 'dpa')
  const findings = evaluateAllNoAi(art28.rules, dpaChunks, docNames).map((f) => ({
    ...f,
    reviewed: 'pending' as const,
  }))
  return { chunks, docNames, questions, answers, findings }
}

export function chunkById(analysis: Analysis, id: string) {
  return analysis.chunks.find((c) => c.id === id)
}
