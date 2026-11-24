import { isRetryable } from './provider.ts'

// SPEC 12.1: concurrency 3, exponential backoff on 429/5xx (max 3 retries), cancel button.
export const CONCURRENCY = 3
export const MAX_RETRIES = 3

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })

export async function withRetry<T>(
  fn: () => Promise<T>,
  signal?: AbortSignal,
  baseMs = 1000,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt >= MAX_RETRIES || !isRetryable(err) || signal?.aborted) throw err
      await sleep(baseMs * 2 ** attempt, signal)
    }
  }
}

/** Runs tasks with limited concurrency; results keep input order; completed results survive later failures. */
export async function runPool<T, R>(
  items: T[],
  task: (item: T) => Promise<R>,
  opts: {
    concurrency?: number
    signal?: AbortSignal
    onDone?: (done: number, total: number) => void
  } = {},
): Promise<{ results: (R | undefined)[]; errors: { index: number; error: unknown }[] }> {
  const results: (R | undefined)[] = new Array<R | undefined>(items.length).fill(undefined)
  const errors: { index: number; error: unknown }[] = []
  let next = 0
  let done = 0
  const worker = async () => {
    while (next < items.length && !opts.signal?.aborted) {
      const i = next++
      const item = items[i] as T
      try {
        results[i] = await task(item)
      } catch (error) {
        errors.push({ index: i, error })
      }
      opts.onDone?.(++done, items.length)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(opts.concurrency ?? CONCURRENCY, items.length) }, worker),
  )
  return { results, errors }
}
