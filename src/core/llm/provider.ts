// Provider interface (SPEC 12.1). The browser implementation lives in /src/app; tests and eval inject fakes.
export type LlmRequest = {
  system: string
  user: string
  /** JSON Schema the reply must match. */
  schema: Record<string, unknown>
  maxTokens: number
  signal?: AbortSignal
}
export type LlmUsage = { inputTokens: number; outputTokens: number }
export type LlmResponse = { text: string; usage: LlmUsage; model: string }
export interface LLMProvider {
  readonly model: string
  complete(req: LlmRequest): Promise<LlmResponse>
}

/** Errors a provider throws so the runner can decide whether to retry. */
export class LlmHttpError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'LlmHttpError'
    this.status = status
  }
}

export const isRetryable = (err: unknown): boolean =>
  err instanceof LlmHttpError && (err.status === 429 || err.status >= 500)
