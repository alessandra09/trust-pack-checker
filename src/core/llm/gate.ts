import type { Chunk, Evidence, Status } from '../types.ts'
import { verifyQuote } from './verifyQuote.ts'

// SPEC 6.2: FOUND needs a verified quote AND a draft without details missing from the quote.
const DETAIL_PATTERNS = [
  /\b(ISO(?:\/IEC)?\s?\d{4,5}(?:-\d+)?|SOC\s?[123](?:\s?Type\s?(?:I{1,2}|[12]))?|AES[-\s]?\d{3}|TLS\s?\d(?:\.\d)?|PCI[-\s]?DSS|HIPAA|NIST(?:\s?[\w.-]+)?)\b/gi,
  /\b\d+(?:[.,]\d+)?\s*(?:%|hours?|days?|weeks?|months?|years?|minutes?)?/gi,
  /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|twelve|fourteen|twenty|thirty|forty|sixty|ninety)\b(?:[-\s]\w+)?\s+(?:hours?|days?|weeks?|months?|years?)\b/gi,
]
// Capitalised words that are not sentence starts (names of companies, products, places).
const NAME = /(?<![.!?]\s|^)\b[A-Z][a-zA-Z0-9&]+(?:[\s-][A-Z][a-zA-Z0-9&]+)*/g
const COMMON = new Set([
  'We',
  'Our',
  'Us',
  'The',
  'I',
  'GDPR',
  'EU',
  'EEA',
  'Customer',
  'Customers',
  'Annex',
  'Article',
  'DPA',
])

const norm = (s: string) => s.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ')

export function unsupportedDetails(draft: string, quotes: string[]): string[] {
  const evidence = norm(quotes.join(' \n '))
  const found = new Set<string>()
  for (const re of DETAIL_PATTERNS) for (const m of draft.matchAll(re)) found.add(m[0].trim())
  for (const m of draft.matchAll(NAME)) if (!COMMON.has(m[0])) found.add(m[0].trim())
  return [...found].filter((d) => d.length > 0 && !evidence.includes(norm(d)))
}

export type GatedResult = { status: Status; evidence: Evidence[]; warnings: string[] }

/** Applies the hard gate to a model reply that cites `chunkId` and `quote`. */
export function gateReply(
  reply: {
    status: 'FOUND' | 'PARTIAL' | 'NOT_FOUND'
    chunkId: string
    quote: string
    draft?: string
  },
  passages: Chunk[],
  docNames: Record<string, string>,
): GatedResult {
  if (reply.status === 'NOT_FOUND') return { status: 'NOT_FOUND', evidence: [], warnings: [] }
  const chunk = passages.find((c) => c.id === reply.chunkId)
  const verified = chunk !== undefined && verifyQuote(reply.quote, chunk.text)
  const ev: Evidence = {
    chunkId: reply.chunkId,
    docName: chunk ? (docNames[chunk.docId] ?? chunk.docId) : '',
    page: chunk?.page ?? 0,
    quote: reply.quote,
    verified,
  }
  if (!verified) return { status: 'NEEDS_HUMAN', evidence: [ev], warnings: ['quote-not-verified'] }
  const extra = reply.draft ? unsupportedDetails(reply.draft, [reply.quote]) : []
  if (reply.status === 'FOUND' && extra.length > 0) {
    return {
      status: 'PARTIAL',
      evidence: [ev],
      warnings: ['draft-details-not-in-evidence', ...extra],
    }
  }
  return { status: reply.status, evidence: [ev], warnings: [] }
}
