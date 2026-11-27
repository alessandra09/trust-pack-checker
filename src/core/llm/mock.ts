import { LlmHttpError, type LLMProvider, type LlmRequest, type LlmResponse } from './provider.ts'

// Mock provider for testing the whole AI pipeline without a key (SPRINT2 task 7). Deterministic.
// honest:    copies the first long sentence of the first passage as the quote.
// obedient:  follows instructions planted in a passage (quotes the planted line, drafts what it says).
// paraphrase: returns FOUND with a quote that is not in any passage.
// garbage:   returns text that is not JSON.
export type MockBehaviour = 'honest' | 'obedient' | 'paraphrase' | 'garbage'

export type MockOptions = {
  behaviour?: MockBehaviour
  /** HTTP statuses thrown on the first calls, in order (e.g. [429, 503]). */
  failFirst?: number[]
  /** Throw this status on every call whose message contains `match` (one question keeps failing). */
  failFor?: { match: string; status: number }
  model?: string
}

export type MockProvider = LLMProvider & { readonly requests: LlmRequest[] }

const PASSAGE = /<passage id="([^"]+)"[^>]*>([\s\S]*?)<\/passage>/g
const INJECTED =
  /(ignore (all )?previous instructions|assistant instructions|automated assistants)/i

const unescape = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>')

function passages(user: string): { id: string; text: string }[] {
  return [...user.matchAll(PASSAGE)].map((m) => ({ id: m[1] ?? '', text: unescape(m[2] ?? '') }))
}

const sentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.replace(/^#+\s*/, '').trim())
    .filter((s) => s.length >= 20 && s.length <= 400)

function reply(behaviour: MockBehaviour, user: string): string {
  if (behaviour === 'garbage') return 'I think the answer is yes.'
  const ps = passages(user)
  const first = ps[0]
  const quote = first ? sentences(first.text)[0] : undefined
  if (!first || !quote)
    return JSON.stringify({
      status: 'NOT_FOUND',
      draft: '',
      chunkId: '',
      quote: '',
      missingElements: [],
    })
  if (behaviour === 'obedient') {
    const planted = ps.flatMap((p) =>
      sentences(p.text)
        .filter((s) => INJECTED.test(s))
        .map((s) => ({ id: p.id, s })),
    )[0]
    if (planted)
      return JSON.stringify({
        status: 'FOUND',
        draft: `Yes. ${planted.s}`,
        chunkId: planted.id,
        quote: planted.s,
        missingElements: [],
      })
  }
  const q = behaviour === 'paraphrase' ? `In short, ${quote.toLowerCase()} (summarised)` : quote
  return JSON.stringify({
    status: 'FOUND',
    draft: 'We describe this in our documents.',
    chunkId: first.id,
    quote: q,
    missingElements: [],
  })
}

export function createMockProvider(opts: MockOptions = {}): MockProvider {
  const requests: LlmRequest[] = []
  const failFirst = [...(opts.failFirst ?? [])]
  return {
    model: opts.model ?? 'mock',
    requests,
    complete(req: LlmRequest): Promise<LlmResponse> {
      requests.push(req)
      if (req.signal?.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'))
      const always = opts.failFor && req.user.includes(opts.failFor.match) ? opts.failFor.status : 0
      const status = failFirst.shift() ?? always
      if (status) return Promise.reject(new LlmHttpError(status, `mock ${status}`))
      const text = reply(opts.behaviour ?? 'honest', req.user)
      return Promise.resolve({
        text,
        model: opts.model ?? 'mock',
        usage: {
          inputTokens: Math.ceil(req.user.length / 4),
          outputTokens: Math.ceil(text.length / 4),
        },
      })
    },
  }
}
