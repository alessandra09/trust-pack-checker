import { verifyQuote } from '../core/llm/verifyQuote.ts'
import type { Status } from '../core/types.ts'
import type { Analysis } from './types.ts'

// Recorded AI run on the synthetic sample (SPRINT2 task 7), made by `npm run record-sample`.
// The file is data, not trusted output: every quote is verified again against the sample text on load.
export const RECORDED_LABEL = 'Recorded run on synthetic documents, not live'

type RecordedEvidence = { chunkId: string; quote: string }
type RecordedItem = { status: Status; draft?: string; evidence: RecordedEvidence[] }
export type RecordedSample = {
  label: string
  date: string
  model: string
  promptVersion: string
  answers: Record<string, RecordedItem>
  findings: Record<string, RecordedItem>
}

/** What `npm run record-sample` saves: only model-drafted items, quotes and statuses. */
export function toRecording(
  a: Analysis,
  meta: { date: string; model: string; promptVersion: string },
): RecordedSample {
  const answers: Record<string, RecordedItem> = {}
  for (const [qid, x] of Object.entries(a.answers)) {
    if (x.source !== 'llm') continue
    const ev = x.evidence
      .filter((e) => e.verified)
      .map((e) => ({ chunkId: e.chunkId, quote: e.quote }))
    answers[qid] = { status: x.status, ...(x.draft ? { draft: x.draft } : {}), evidence: ev }
  }
  const findings: Record<string, RecordedItem> = {}
  for (const f of a.findings) {
    if (f.basis !== 'ai') continue
    const ev = f.evidence
      .filter((e) => e.verified)
      .map((e) => ({ chunkId: e.chunkId, quote: e.quote }))
    findings[f.ruleId] = { status: f.status, evidence: ev }
  }
  return { label: RECORDED_LABEL, ...meta, answers, findings }
}

/** Applies a recording to the no-AI sample analysis. A quote not found in its chunk is dropped,
 *  and an item left without a verified quote cannot stay FOUND or PARTIAL. */
export function applyRecording(a: Analysis, rec: RecordedSample): Analysis {
  const text = new Map(a.chunks.map((c) => [c.id, c]))
  const check = (item: RecordedItem) => {
    const evidence = item.evidence.flatMap((e) => {
      const c = text.get(e.chunkId)
      if (!c || !verifyQuote(e.quote, c.text)) return []
      return [{ ...e, docName: a.docNames[c.docId] ?? c.docId, page: c.page, verified: true }]
    })
    const needsQuote = item.status === 'FOUND' || item.status === 'PARTIAL'
    const status: Status = needsQuote && evidence.length === 0 ? 'NEEDS_HUMAN' : item.status
    return { status, evidence }
  }
  const answers = { ...a.answers }
  for (const [qid, item] of Object.entries(rec.answers)) {
    const base = answers[qid]
    if (!base) continue
    const { status, evidence } = check(item)
    answers[qid] = {
      ...base,
      source: 'llm',
      status,
      evidence,
      ...(item.draft && status !== 'NEEDS_HUMAN' ? { draft: item.draft } : {}),
    }
  }
  const findings = a.findings.map((f) => {
    const item = rec.findings[f.ruleId]
    if (!item) return f
    const { status, evidence } = check(item)
    return { ...f, status, evidence, basis: 'ai' as const }
  })
  return { ...a, answers, findings }
}
