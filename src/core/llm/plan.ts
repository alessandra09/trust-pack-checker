import type { Rule } from '../../data/schemas.ts'
import type { DraftedAnswer } from '../qa/answer.ts'
import type { RuleResult } from '../rules/engine.ts'
import { ANSWER_SYSTEM, answerUserMessage, RULE_SYSTEM, ruleUserMessage } from './prompts.ts'
import { toPromptPassages } from './run.ts'

// Which items would go to the model, and how many characters each prompt has (for the cost guard, SPEC 12.1).
// Mirrors the skip rules in run.ts: code-decided conflicts, missing documents and empty retrieval are never sent.
export function willSendAnswer(a: DraftedAnswer): boolean {
  return a.status !== 'CONFLICT' && a.note !== 'needs-doc' && a.passages.length > 0
}

export function answerPromptChars(
  question: string,
  topicName: string,
  a: DraftedAnswer,
  docLabels: Record<string, string>,
): number {
  const user = answerUserMessage(question, topicName, toPromptPassages(a.passages, docLabels))
  return ANSWER_SYSTEM.length + user.length
}

export function rulePromptChars(
  rule: Rule,
  r: RuleResult,
  docLabels: Record<string, string>,
): number {
  const passages = toPromptPassages(
    r.candidates.map((c) => c.chunk),
    docLabels,
  )
  return RULE_SYSTEM.length + ruleUserMessage(rule.requirement, rule.elements, passages).length
}
