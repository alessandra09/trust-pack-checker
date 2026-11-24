import { describe, expect, it } from 'vitest'
import { createAnthropicProvider, toOutputSchema } from '../../src/core/llm/anthropic.ts'
import { LlmHttpError, isRetryable } from '../../src/core/llm/provider.ts'

type Captured = { url: string; body: Record<string, unknown> }

function fakeFetch(status: number, payload: unknown, seen: Captured[]): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    seen.push({
      url: String(input),
      body: JSON.parse(String(init?.body)) as Record<string, unknown>,
    })
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  }) as typeof fetch
}

const message = (text: string, stop = 'end_turn') => ({
  id: 'msg_1',
  type: 'message',
  role: 'assistant',
  model: 'claude-haiku-5-5',
  content: [{ type: 'text', text }],
  stop_reason: stop,
  usage: { input_tokens: 120, output_tokens: 30 },
})

const req = {
  system: 'sys',
  user: 'question',
  schema: { $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object' },
  maxTokens: 8000,
}

describe('anthropic provider', () => {
  it('sends a schema-constrained request to api.anthropic.com without temperature', async () => {
    const seen: Captured[] = []
    const p = createAnthropicProvider({
      apiKey: 'test',
      model: 'claude-haiku-5-5',
      fetch: fakeFetch(200, message('{"a":1}'), seen),
    })
    const res = await p.complete(req)
    expect(res).toEqual({
      text: '{"a":1}',
      model: 'claude-haiku-5-5',
      usage: { inputTokens: 120, outputTokens: 30 },
    })
    expect(seen[0]?.url).toBe('https://api.anthropic.com/v1/messages')
    const body = seen[0]?.body ?? {}
    expect(body.temperature).toBeUndefined()
    expect(body.output_config).toEqual({
      effort: 'low',
      format: { type: 'json_schema', schema: { type: 'object' } },
    })
  })

  it('returns empty text on refusal so the reply goes to human review', async () => {
    const p = createAnthropicProvider({
      apiKey: 'test',
      model: 'm',
      fetch: fakeFetch(200, message('partial', 'refusal'), []),
    })
    expect((await p.complete(req)).text).toBe('')
  })

  it('maps HTTP errors to LlmHttpError so the pool can retry 429', async () => {
    const p = createAnthropicProvider({
      apiKey: 'test',
      model: 'm',
      fetch: fakeFetch(
        429,
        { type: 'error', error: { type: 'rate_limit_error', message: 'slow' } },
        [],
      ),
    })
    const err = await p.complete(req).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(LlmHttpError)
    expect(isRetryable(err)).toBe(true)
  })

  it('strips $schema from output schemas', () => {
    expect(toOutputSchema({ $schema: 'x', type: 'object' })).toEqual({ type: 'object' })
  })
})
