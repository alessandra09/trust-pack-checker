import { estimateCost, type CostEstimate } from '../core/llm/cost.ts'
import { modelInfo } from '../core/llm/models.ts'
import { answerPromptChars, rulePromptChars, willSendAnswer } from '../core/llm/plan.ts'
import { runPool } from '../core/llm/pool.ts'
import { LlmHttpError, type LLMProvider } from '../core/llm/provider.ts'
import { answerWithAi, evaluateRuleWithAi } from '../core/llm/run.ts'
import type { DocKind, Doc } from '../core/types.ts'
import { art28 } from '../data/load.ts'
import { buildContext } from './analyze.ts'
import type { Analysis, ReviewAnswer, ReviewFinding } from './types.ts'

// Only a document label goes to the model, never the file name (SPEC 12.3).
const LABEL: Partial<Record<DocKind, string>> = {
  dpa: 'DPA',
  privacy: 'Privacy policy',
  security: 'Security policy',
  ropa: 'Record of processing',
}
const labelsFor = (docs: Doc[]) =>
  Object.fromEntries(docs.map((d) => [d.id, LABEL[d.kind] ?? 'document']))

export function planCost(analysis: Analysis, docs: Doc[], model: string): CostEstimate {
  const labels = labelsFor(docs)
  const { ctx } = buildContext(docs)
  const chars: number[] = []
  for (const q of analysis.questions) {
    const a = analysis.answers[q.qid]
    if (!a || !willSendAnswer(a)) continue
    const topic = ctx.topics.find((tp) => tp.id === a.topic)?.name ?? a.topic
    chars.push(answerPromptChars(q.text, topic, a, labels))
  }
  for (const f of analysis.findings) {
    const rule = art28.rules.find((r) => r.id === f.ruleId)
    if (rule && f.candidates.length > 0) chars.push(rulePromptChars(rule, f, labels))
  }
  const price = modelInfo(model)?.price ?? { inputPerMTok: 0, outputPerMTok: 0 }
  return estimateCost(chars, price)
}

export type AiRunResult = { analysis: Analysis; failed: number; authError: boolean }

/** Replaces no-AI drafts with gated model drafts. Items whose call fails keep their no-AI result. */
export async function draftWithAi(
  analysis: Analysis,
  docs: Doc[],
  provider: LLMProvider,
  opts: { signal: AbortSignal; onProgress: (done: number, total: number) => void },
): Promise<AiRunResult> {
  const labels = labelsFor(docs)
  const { ctx } = buildContext(docs)
  const stop = new AbortController()
  opts.signal.addEventListener('abort', () => stop.abort())
  let authError = false
  const guard = <T>(p: Promise<T>) =>
    p.catch((err: unknown) => {
      // A rejected key fails every call: stop at once instead of sending the rest.
      if (err instanceof LlmHttpError && (err.status === 401 || err.status === 403)) {
        authError = true
        stop.abort()
      }
      throw err
    })
  const qs = analysis.questions.filter((q) => {
    const a = analysis.answers[q.qid]
    return a ? willSendAnswer(a) : false
  })
  const fs = analysis.findings.filter((f) => f.candidates.length > 0)
  const total = qs.length + fs.length
  let done = 0
  const tick = () => opts.onProgress(++done, total)
  const answers = await runPool(
    qs,
    (q) =>
      guard(
        answerWithAi(q, analysis.answers[q.qid]?.topic ?? '', ctx, provider, labels, stop.signal),
      ),
    { signal: stop.signal, onDone: tick },
  )
  const findings = await runPool(
    fs,
    (f) => {
      const rule = art28.rules.find((r) => r.id === f.ruleId)
      if (!rule) throw new Error('unknown rule')
      return guard(evaluateRuleWithAi(rule, f, provider, ctx.docNames, labels, stop.signal))
    },
    { signal: stop.signal, onDone: tick },
  )
  const nextAnswers: Record<string, ReviewAnswer> = { ...analysis.answers }
  for (const r of answers.results) {
    if (!r) continue
    const { usage: _u, calls: _c, warnings, ...answer } = r
    nextAnswers[r.qid] = { ...answer, ...(warnings.length ? { warnings } : {}) }
  }
  const byId = new Map(findings.results.flatMap((r) => (r ? [[r.id, r] as const] : [])))
  const nextFindings: ReviewFinding[] = analysis.findings.map((f) => {
    const r = byId.get(f.id)
    if (!r) return f
    const { usage: _u, calls: _c, warnings: _w, ...finding } = r
    return { ...finding, reviewed: f.reviewed }
  })
  const failed = answers.errors.length + findings.errors.length + (total - done)
  return {
    analysis: { ...analysis, answers: nextAnswers, findings: nextFindings },
    failed,
    authError,
  }
}
