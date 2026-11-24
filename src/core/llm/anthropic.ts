import Anthropic from '@anthropic-ai/sdk'
import { LlmHttpError, type LLMProvider, type LlmRequest, type LlmResponse } from './provider.ts'

// Anthropic provider (SPEC 12.1, decision 17 #17). The SDK is used only inside src/core/llm.
// Retries are done by our pool (pool.ts), so the SDK's own retries are off.
// Schema-constrained output does not replace our checks: replies still go through zod and verifyQuote.
export type AnthropicOptions = {
  apiKey: string
  model: string
  /** Injected in tests. */
  fetch?: typeof fetch
}

/** Structured-output schemas must not carry the "$schema" keyword. */
export function toOutputSchema(schema: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(schema).filter(([k]) => k !== '$schema'))
}

export function createAnthropicProvider(opts: AnthropicOptions): LLMProvider {
  const client = new Anthropic({
    apiKey: opts.apiKey,
    maxRetries: 0,
    // The key never leaves the user's browser except to api.anthropic.com (SPEC 10).
    dangerouslyAllowBrowser: true,
    ...(opts.fetch ? { fetch: opts.fetch } : {}),
  })
  return {
    model: opts.model,
    async complete(req: LlmRequest): Promise<LlmResponse> {
      try {
        const res = await client.messages.create(
          {
            model: opts.model,
            max_tokens: req.maxTokens,
            system: req.system,
            messages: [{ role: 'user', content: req.user }],
            output_config: {
              // Short extraction task: low effort keeps thinking (and cost) small.
              effort: 'low',
              format: { type: 'json_schema', schema: toOutputSchema(req.schema) },
            },
          },
          req.signal ? { signal: req.signal } : undefined,
        )
        // A refusal or a cut-off reply yields text that fails validation, so it becomes NEEDS_HUMAN.
        const text =
          res.stop_reason === 'refusal'
            ? ''
            : res.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
        return {
          text,
          model: res.model,
          usage: { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens },
        }
      } catch (err) {
        if (err instanceof Anthropic.APIError && typeof err.status === 'number')
          throw new LlmHttpError(err.status, err.message)
        throw err
      }
    },
  }
}
