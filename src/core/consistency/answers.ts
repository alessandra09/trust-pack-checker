import { extractQuestions, type ColumnMapping } from '../qa/detect.ts'
import type { Chunk, Table } from '../types.ts'
import type { VendorAnswer } from './types.ts'

// Client mode: each vendor answer row becomes one chunk ("question\nanswer"), so the answer side of a
// finding is a verifiable quote with the same evidence model as the DPA side.
export function vendorAnswers(table: Table, mapping: ColumnMapping, docId: string): VendorAnswer[] {
  if (mapping.answerCol === null) return []
  return extractQuestions(table, mapping)
    .filter((q) => !q.hidden && q.existingAnswer !== '')
    .map((q, i) => {
      const text = `${q.text}\n${q.existingAnswer}`
      const chunk: Chunk = {
        id: `${docId}#${q.qid}`,
        docId,
        page: 1,
        heading: q.qid,
        text,
        start: i,
        end: i,
        annex: false,
      }
      return { qid: q.qid, question: q.text, answer: q.existingAnswer, chunk }
    })
}
