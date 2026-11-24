import { pageAt, pageOffsets } from '../ingest/text.ts'
import type { Chunk, Doc } from '../types.ts'

// SPEC 7.2: split by headings and numbered clauses, merge tiny pieces, split large ones, keep page/heading/offsets.
export const MIN_WORDS = 40
export const MAX_WORDS = 250

const NUMBERED = /^\d+(\.\d+)*[.)]?\s/
const ANNEX = /^(#+\s*)?(annex|schedule|appendix)\b/i
const MD_HEADING = /^#{1,6}\s+/

type Piece = { start: number; end: number; heading?: string; annex: boolean }

function isAllCapsHeading(line: string): boolean {
  const letters = line.replace(/[^\p{L}]/gu, '')
  return letters.length >= 4 && line.length <= 80 && letters === letters.toUpperCase()
}

function isBoundary(line: string): boolean {
  return NUMBERED.test(line) || ANNEX.test(line) || MD_HEADING.test(line) || isAllCapsHeading(line)
}

// A boundary line short enough to be a title (not a full numbered clause).
function titleOf(line: string): string | undefined {
  const clean = line.replace(MD_HEADING, '').trim()
  if (clean.length > 90 || (/[.;:]$/.test(clean) && clean.split(/\s+/).length > 8)) return undefined
  return clean
}

const words = (s: string) => (s.match(/\S+/g) ?? []).length

function splitIntoPieces(text: string): Piece[] {
  const pieces: Piece[] = []
  let heading: string | undefined
  let annex = false
  let current: Piece | null = null
  let pos = 0
  for (const line of text.split('\n')) {
    const start = pos
    pos += line.length + 1
    const trimmed = line.trim()
    if (trimmed === '') continue
    if (isBoundary(trimmed)) {
      if (ANNEX.test(trimmed)) annex = true
      const title = titleOf(trimmed)
      if (title) heading = title
      if (current) pieces.push(current)
      current = { start, end: start + line.length, heading, annex }
      continue
    }
    if (!current) current = { start, end: start + line.length, heading, annex }
    else current.end = start + line.length
  }
  if (current) pieces.push(current)
  return pieces
}

// Heading-only pieces join the clause that follows them. Other tiny pieces (<MIN_WORDS) join a neighbour
// from the same section, so a chunk never carries the wrong heading or mixes annex and body text.
function mergeTiny(pieces: Piece[], text: string): Piece[] {
  const count = (p: Piece) => words(text.slice(p.start, p.end))
  const sameSection = (a: Piece, b: Piece) => a.heading === b.heading && a.annex === b.annex

  const withHeadings: Piece[] = []
  let pendingStart: number | null = null
  for (const p of pieces) {
    const body = text.slice(p.start, p.end).trim()
    const headingOnly = !body.includes('\n') && titleOf(body) !== undefined && count(p) <= 12
    const piece: Piece = pendingStart === null ? p : { ...p, start: pendingStart }
    pendingStart = null
    if (headingOnly) pendingStart = piece.start
    else withHeadings.push(piece)
  }
  if (pendingStart !== null) {
    const last = pieces[pieces.length - 1]
    if (last) withHeadings.push({ ...last, start: pendingStart })
  }

  const out: Piece[] = []
  for (const p of withHeadings) {
    const prev = out[out.length - 1]
    if (
      prev &&
      (count(p) < MIN_WORDS || count(prev) < MIN_WORDS) &&
      sameSection(prev, p) &&
      count(prev) + count(p) <= MAX_WORDS
    ) {
      prev.end = p.end
    } else {
      out.push({ ...p })
    }
  }
  return out
}

function splitLarge(p: Piece, text: string): Piece[] {
  const body = text.slice(p.start, p.end)
  if (words(body) <= MAX_WORDS) return [p]
  const sentences = [...body.matchAll(/[^.!?]+(?:[.!?]+|$)\s*/g)]
  const out: Piece[] = []
  let segStart = 0
  let segWords = 0
  for (const s of sentences) {
    const w = words(s[0])
    const idx = s.index ?? 0
    if (segWords > 0 && segWords + w > MAX_WORDS) {
      out.push({ ...p, start: p.start + segStart, end: p.start + idx })
      segStart = idx
      segWords = 0
    }
    segWords += w
  }
  out.push({ ...p, start: p.start + segStart, end: p.end })
  return out
}

function trimOffsets(text: string, start: number, end: number): [number, number] {
  let s = start
  let e = end
  while (s < e && /\s/.test(text[s] ?? '')) s++
  while (e > s && /\s/.test(text[e - 1] ?? '')) e--
  return [s, e]
}

export function chunkDoc(doc: Doc): Chunk[] {
  const offsets = pageOffsets(doc)
  const pieces = mergeTiny(splitIntoPieces(doc.text), doc.text).flatMap((p) =>
    splitLarge(p, doc.text),
  )
  return pieces
    .map((p) => {
      const [start, end] = trimOffsets(doc.text, p.start, p.end)
      return { ...p, start, end }
    })
    .filter((p) => p.end > p.start)
    .map((p, i) => ({
      id: `${doc.id}:c${i}`,
      docId: doc.id,
      page: pageAt(offsets, p.start),
      ...(p.heading ? { heading: p.heading } : {}),
      text: doc.text.slice(p.start, p.end),
      start: p.start,
      end: p.end,
      annex: p.annex,
    }))
}
