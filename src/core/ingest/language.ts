// Simple English heuristic (SPEC 7.1): share of tokens that are common English stop words.
const STOP_WORDS = new Set(
  'the of and to in a is that for be by with on as or any this are shall will not from at which its such an all other may has have it their under'.split(
    ' ',
  ),
)

export function looksEnglish(text: string): boolean {
  const tokens = text.toLowerCase().match(/\p{L}+/gu) ?? []
  if (tokens.length < 30) return true // too short to judge
  const sample = tokens.slice(0, 3000)
  const hits = sample.filter((t) => STOP_WORDS.has(t)).length
  return hits / sample.length >= 0.15
}
