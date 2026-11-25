import type { Chunk } from '../../core/types.ts'
import { Highlight } from '../../components/Highlight.tsx'
import { t } from '../../i18n/t.ts'

// The "document paper" block: the visual centre of the product (SPEC 11.3).
export function Passage({
  chunk,
  docName,
  query,
  quote,
}: {
  chunk: Chunk
  docName: string
  query: string
  quote?: string
}) {
  return (
    <figure className="paper" data-chunk-id={chunk.id}>
      <figcaption className="mb-2 text-[14px] text-[var(--muted)]">
        {docName}
        {chunk.heading ? ` · ${chunk.heading}` : ''} · {t('evidence.page')} {chunk.page}
      </figcaption>
      <blockquote className="quote whitespace-pre-wrap">
        <Highlight text={chunk.text} query={query} {...(quote ? { quote } : {})} />
      </blockquote>
    </figure>
  )
}

/** Text the user selected inside one passage, with that passage's chunk id. */
export function readSelection(): { chunkId: string; text: string } | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const text = sel.toString().trim()
  const node = sel.getRangeAt(0).commonAncestorContainer
  const el = node instanceof Element ? node : node.parentElement
  const fig = el?.closest('[data-chunk-id]')
  const chunkId = fig?.getAttribute('data-chunk-id')
  return chunkId && text ? { chunkId, text } : null
}
