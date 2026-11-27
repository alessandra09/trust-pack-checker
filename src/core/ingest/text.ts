import type { Doc, DocKind, Page } from '../types.ts'
import { IngestError } from './errors.ts'

// Page separator inside Doc.text; offsets of chunks point into Doc.text.
export const PAGE_SEPARATOR = '\n\n'

export function cleanText(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\u00A0]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Joins words split by a line-end hyphen in extracted PDF text ("process-\ning" -> "processing").
export function dehyphenate(text: string): string {
  return text.replace(/(\p{Ll})-\n(\p{Ll})/gu, '$1$2')
}

/**
 * PDF text keeps the visual line breaks, which split sentences (QA, SPRINT2 task 4): a line that does not
 * end a sentence is joined to the next line when that line starts in lower case.
 */
export function unwrapLines(text: string): string {
  return text.replace(/([^\n.!?:;])\n(?=\p{Ll})/gu, '$1 ')
}

export function makeDoc(id: string, name: string, kind: DocKind, pageTexts: string[]): Doc {
  const pages: Page[] = pageTexts.map((t, i) => ({ n: i + 1, text: cleanText(t) }))
  const text = pages.map((p) => p.text).join(PAGE_SEPARATOR)
  if (text.trim().length === 0) throw new IngestError('empty', name)
  return { id, name, kind, pages, text }
}

/** Start offset of each page inside Doc.text. */
export function pageOffsets(doc: Doc): number[] {
  const offsets: number[] = []
  let pos = 0
  for (const p of doc.pages) {
    offsets.push(pos)
    pos += p.text.length + PAGE_SEPARATOR.length
  }
  return offsets
}

export function pageAt(offsets: number[], position: number): number {
  let page = 1
  for (let i = 0; i < offsets.length; i++) {
    const start = offsets[i]
    if (start !== undefined && start <= position) page = i + 1
  }
  return page
}
