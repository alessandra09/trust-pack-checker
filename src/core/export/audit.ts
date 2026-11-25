import { PROMPT_VERSION } from '../llm/prompts.ts'
import type { ConsistencyFinding } from '../consistency/types.ts'
import type { Answer, Finding } from '../types.ts'

// JSON audit log (SPEC 4, 12.2): what was decided, on what evidence, by which method, model and prompt version.
export type AuditLog = {
  tool: 'Trust Pack Checker'
  createdAt: string
  promptVersion: string
  model: string | null
  mode: 'company' | 'client'
  documents: { name: string; kind: string; pages: number }[]
  answers: Answer[]
  findings: Finding[]
  /** Client mode: answer-versus-DPA findings, each with its verified quotes. */
  consistency?: ConsistencyFinding[]
  disclaimer: string
}

export function buildAuditLog(
  input: Omit<AuditLog, 'tool' | 'createdAt' | 'promptVersion' | 'disclaimer'>,
  now = new Date(),
): AuditLog {
  return {
    tool: 'Trust Pack Checker',
    createdAt: now.toISOString(),
    promptVersion: PROMPT_VERSION,
    disclaimer: 'Draft for human review. Not legal advice.',
    ...input,
  }
}
