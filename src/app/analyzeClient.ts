import { chunkDoc } from '../core/chunk/chunker.ts'
import { vendorAnswers } from '../core/consistency/answers.ts'
import { checkConsistency } from '../core/consistency/engine.ts'
import { evaluateAllNoAi } from '../core/rules/engine.ts'
import type { ColumnMapping } from '../core/qa/detect.ts'
import type { Doc, Table } from '../core/types.ts'
import { art28 } from '../data/load.ts'
import type { Analysis } from './types.ts'

export const ANSWERS_DOC_ID = 'answers'

/**
 * Client mode, no AI (SPEC 1, 9.3): the Art. 28 check of the vendor's DPA, plus code checks that compare
 * the vendor's answers with that DPA. Answers are evidence too, so each row is a verifiable chunk.
 */
export function analyzeClient({
  dpa,
  table,
  mapping,
  answersName,
}: {
  dpa: Doc
  table: Table | null
  mapping: ColumnMapping | null
  answersName: string
}): Analysis {
  const dpaChunks = chunkDoc(dpa)
  const rows = table && mapping ? vendorAnswers(table, mapping, ANSWERS_DOC_ID) : []
  const docNames = { [dpa.id]: dpa.name, [ANSWERS_DOC_ID]: answersName }
  const findings = evaluateAllNoAi(art28.rules, dpaChunks, docNames).map((f) => ({
    ...f,
    reviewed: 'pending' as const,
  }))
  const consistency = checkConsistency(rows, dpaChunks, docNames).map((f) => ({
    ...f,
    reviewed: 'pending' as const,
  }))
  return {
    chunks: [...dpaChunks, ...rows.map((r) => r.chunk)],
    docNames,
    questions: [],
    answers: {},
    findings,
    consistency,
    vendorRows: rows.map((r) => ({
      qid: r.qid,
      question: r.question,
      answer: r.answer,
      chunkId: r.chunk.id,
    })),
  }
}
