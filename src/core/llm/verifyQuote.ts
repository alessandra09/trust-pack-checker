// Hard gate of the evidence model (SPEC 6.2): a quote counts only if it appears verbatim in the cited chunk.
export const QUOTE_MIN_LENGTH = 12
export const QUOTE_MAX_LENGTH = 400

const SOFT_HYPHEN = /­/g
const BULLETS = /[•‣◦⁃∙▪●]/g
const SMART_SINGLE = /[‘’‚‛]/g
const SMART_DOUBLE = /[“”„‟]/g
const DASHES = /[‐-―−]/g

export function normalizeForQuote(s: string): string {
  return s
    .normalize('NFKC')
    .replace(SOFT_HYPHEN, '')
    .replace(BULLETS, ' ')
    .replace(SMART_SINGLE, "'")
    .replace(SMART_DOUBLE, '"')
    .replace(DASHES, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function verifyQuote(quote: string, chunkText: string): boolean {
  const q = normalizeForQuote(quote)
  if (q.length < QUOTE_MIN_LENGTH || q.length > QUOTE_MAX_LENGTH) return false
  return normalizeForQuote(chunkText).includes(q)
}
