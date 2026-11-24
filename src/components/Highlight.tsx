import { contentTerms } from '../core/qa/terms.ts'
import { stem } from '../core/search/stem.ts'

// Renders passage text with the question's meaningful words highlighted, and an optional exact quote marked.
export function Highlight({ text, query, quote }: { text: string; query: string; quote?: string }) {
  const terms = contentTerms(query)
  const qStart = quote ? text.toLowerCase().indexOf(quote.toLowerCase()) : -1
  const parts = text.split(/([\p{L}\p{N}]+)/u)
  const starts = parts.reduce<number[]>(
    (acc, _part, i) => [...acc, i === 0 ? 0 : (acc[i - 1] ?? 0) + (parts[i - 1]?.length ?? 0)],
    [],
  )
  return (
    <>
      {parts.map((part, i) => {
        const start = starts[i] ?? 0
        const inQuote =
          qStart >= 0 && quote !== undefined && start >= qStart && start < qStart + quote.length
        const hit = /[\p{L}\p{N}]/u.test(part) && terms.has(stem(part))
        if (inQuote)
          return (
            <mark key={i} className="rounded-sm bg-[var(--quote-bg)] text-inherit">
              {part}
            </mark>
          )
        if (hit)
          return (
            <mark key={i} className="rounded-sm bg-[var(--hit-bg)] text-inherit">
              {part}
            </mark>
          )
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
