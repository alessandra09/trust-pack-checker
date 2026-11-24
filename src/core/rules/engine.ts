import type { Rule } from '../../data/schemas.ts'
import type { Chunk, Evidence, Finding, Status } from '../types.ts'
import { verifyQuote } from '../llm/verifyQuote.ts'
import { findRuleCandidates, type Candidate } from './candidates.ts'

// SPEC 9.2 rule evaluation. Without AI a rule is never FOUND: a hint match is only a "possible passage"
// (PARTIAL) for the user to read and confirm. The AI path (M2, llm/) may upgrade it with a verified quote.

const INCORPORATED =
  /incorporated (herein )?by reference|attached as (annex|schedule|appendix)|available at\s+\S+/i

export type RuleResult = Finding & {
  candidates: Candidate[]
  incorporatedByReference: boolean
  missingElements: string[]
  ruleClass: Rule['class']
  basis: 'hint-match' | 'no-match' | 'ai' | 'user'
}

export function docNameFor(chunk: Chunk, docNames: Record<string, string>): string {
  return docNames[chunk.docId] ?? chunk.docId
}

/** Evidence for a possible passage: the whole chunk is shown, nothing is claimed as a quote yet. */
function passageEvidence(c: Candidate, docNames: Record<string, string>): Evidence {
  return {
    chunkId: c.chunk.id,
    docName: docNameFor(c.chunk, docNames),
    page: c.chunk.page,
    quote: '',
    verified: false,
  }
}

export function evaluateRuleNoAi(
  rule: Rule,
  chunks: Chunk[],
  docNames: Record<string, string>,
): RuleResult {
  const candidates = findRuleCandidates(rule, chunks)
  const status: Status = candidates.length > 0 ? 'PARTIAL' : 'NOT_FOUND'
  return {
    id: `F-${rule.id}`,
    ruleId: rule.id,
    status,
    severity: status === 'NOT_FOUND' ? rule.severityIfMissing : 'INFO',
    evidence: candidates.map((c) => passageEvidence(c, docNames)),
    whyItMatters: rule.whyItMatters,
    suggestedAsk: rule.suggestedAsk,
    candidates,
    incorporatedByReference: candidates.some((c) => INCORPORATED.test(c.chunk.text)),
    missingElements: status === 'NOT_FOUND' ? rule.elements : [],
    ruleClass: rule.class,
    basis: candidates.length > 0 ? 'hint-match' : 'no-match',
  }
}

export function evaluateAllNoAi(
  rules: Rule[],
  chunks: Chunk[],
  docNames: Record<string, string>,
): RuleResult[] {
  return rules.map((r) => evaluateRuleNoAi(r, chunks, docNames))
}

/**
 * The user selected text in a passage and confirmed it satisfies the rule (SPEC 9.2 step 2).
 * The selection still goes through the quote gate: FOUND only if it is verbatim in the chunk.
 */
export function confirmBySelection(
  result: RuleResult,
  chunk: Chunk,
  quote: string,
  docName: string,
): RuleResult {
  if (!verifyQuote(quote, chunk.text)) return result
  return {
    ...result,
    status: 'FOUND',
    severity: 'INFO',
    evidence: [{ chunkId: chunk.id, docName, page: chunk.page, quote, verified: true }],
    missingElements: [],
    basis: 'user',
  }
}
