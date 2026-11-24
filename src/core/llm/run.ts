import type { Rule } from '../../data/schemas.ts'
import type { DraftedAnswer, QaContext } from '../qa/answer.ts'
import { answerNoAi } from '../qa/answer.ts'
import type { Question } from '../qa/detect.ts'
import type { RuleResult } from '../rules/engine.ts'
import type { Chunk } from '../types.ts'
import { gateReply } from './gate.ts'
import { withRetry } from './pool.ts'
import {
  ANSWER_SYSTEM,
  answerUserMessage,
  QUOTE_RETRY,
  RULE_SYSTEM,
  ruleUserMessage,
  type PromptPassage,
} from './prompts.ts'
import type { LLMProvider, LlmUsage } from './provider.ts'
import {
  answerReplyJsonSchema,
  answerReplySchema,
  parseReply,
  ruleReplyJsonSchema,
  ruleReplySchema,
} from './schemas.ts'

// SPEC 12.3: only the question and the selected passages (about 1,500 words) are sent; never whole files or file names.
export const MAX_PASSAGE_WORDS = 1500
// Thinking is on by default on current Claude models and counts toward this limit; only used tokens are billed.
const MAX_TOKENS = 8000

export type AiOutcome<T> = T & { usage: LlmUsage; calls: number; warnings: string[] }

export function toPromptPassages(
  chunks: Chunk[],
  docLabels: Record<string, string>,
): PromptPassage[] {
  const out: PromptPassage[] = []
  let words = 0
  for (const c of chunks) {
    const w = c.text.split(/\s+/).length
    if (words + w > MAX_PASSAGE_WORDS && out.length > 0) break
    words += w
    out.push({ id: c.id, doc: docLabels[c.docId] ?? 'document', page: c.page, text: c.text })
  }
  return out
}

type Reply = {
  status: 'FOUND' | 'PARTIAL' | 'NOT_FOUND'
  chunkId: string
  quote: string
  missingElements: string[]
  draft?: string
}

/** One model call with: parse retry, quote retry ("quote must be copied exactly"), then stop (SPEC 6.2, 12.2). */
async function askWithGate(
  provider: LLMProvider,
  system: string,
  user: string,
  schema: Record<string, unknown>,
  parse: (text: string) => Reply | null,
  passages: Chunk[],
  docNames: Record<string, string>,
  signal?: AbortSignal,
) {
  const usage: LlmUsage = { inputTokens: 0, outputTokens: 0 }
  let calls = 0
  let message = user
  let lastGate: ReturnType<typeof gateReply> | null = null
  let lastReply: Reply | null = null
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await withRetry(
      () => provider.complete({ system, user: message, schema, maxTokens: MAX_TOKENS, signal }),
      signal,
    )
    calls++
    usage.inputTokens += res.usage.inputTokens
    usage.outputTokens += res.usage.outputTokens
    const reply = parse(res.text)
    if (!reply) {
      lastGate = { status: 'NEEDS_HUMAN', evidence: [], warnings: ['reply-not-valid-json'] }
      continue
    }
    lastReply = reply
    lastGate = gateReply(reply, passages, docNames)
    if (!lastGate.warnings.includes('quote-not-verified')) break
    message = `${user}\n\n${QUOTE_RETRY}`
  }
  return {
    gate: lastGate ?? { status: 'NEEDS_HUMAN' as const, evidence: [], warnings: [] },
    reply: lastReply,
    usage,
    calls,
  }
}

export async function answerWithAi(
  q: Question,
  topicId: string,
  ctx: QaContext,
  provider: LLMProvider,
  docLabels: Record<string, string>,
  signal?: AbortSignal,
): Promise<AiOutcome<DraftedAnswer>> {
  const base = answerNoAi(q, topicId, ctx)
  const none = { usage: { inputTokens: 0, outputTokens: 0 }, calls: 0, warnings: [] as string[] }
  // Code decides conflicts and missing documents; no passages means nothing to send.
  if (base.status === 'CONFLICT' || base.note === 'needs-doc' || base.passages.length === 0)
    return { ...base, ...none }
  const topic = ctx.topics.find((t) => t.id === topicId)?.name ?? topicId
  const passages = toPromptPassages(base.passages, docLabels)
  const sent = base.passages.filter((c) => passages.some((p) => p.id === c.id))
  const r = await askWithGate(
    provider,
    ANSWER_SYSTEM,
    answerUserMessage(q.text, topic, passages),
    answerReplyJsonSchema,
    (t) => parseReply(answerReplySchema, t),
    sent,
    ctx.docNames,
    signal,
  )
  return {
    ...base,
    source: 'llm',
    status: r.gate.status,
    evidence: r.gate.evidence,
    ...(r.reply?.draft && r.gate.status !== 'NOT_FOUND' ? { draft: r.reply.draft } : {}),
    note: r.gate.warnings[0] ?? r.reply?.missingElements.join('; ') ?? '',
    usage: r.usage,
    calls: r.calls,
    warnings: r.gate.warnings,
  }
}

export async function evaluateRuleWithAi(
  rule: Rule,
  noAi: RuleResult,
  provider: LLMProvider,
  docNames: Record<string, string>,
  docLabels: Record<string, string>,
  signal?: AbortSignal,
): Promise<AiOutcome<RuleResult>> {
  const none = { usage: { inputTokens: 0, outputTokens: 0 }, calls: 0, warnings: [] as string[] }
  if (noAi.candidates.length === 0) return { ...noAi, ...none }
  const chunks = noAi.candidates.map((c) => c.chunk)
  const passages = toPromptPassages(chunks, docLabels)
  const r = await askWithGate(
    provider,
    RULE_SYSTEM,
    ruleUserMessage(rule.requirement, rule.elements, passages),
    ruleReplyJsonSchema,
    (t) => parseReply(ruleReplySchema, t),
    chunks,
    docNames,
    signal,
  )
  const status = r.gate.status
  return {
    ...noAi,
    status,
    severity:
      status === 'FOUND' ? 'INFO' : status === 'NOT_FOUND' ? rule.severityIfMissing : 'MEDIUM',
    evidence: r.gate.evidence,
    missingElements: r.reply?.missingElements ?? [],
    basis: 'ai',
    usage: r.usage,
    calls: r.calls,
    warnings: r.gate.warnings,
  }
}
