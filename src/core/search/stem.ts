// Light English stemmer shared by retrieval and rule hint matching ("audits" ~ "audit", "notifies" ~ "notify").
const SUFFIXES: [string, string][] = [
  ['ational', 'ate'],
  ['isation', 'ise'],
  ['ization', 'ise'],
  ['izing', 'ise'],
  ['ising', 'ise'],
  ['ized', 'ise'],
  ['ised', 'ise'],
  ['ize', 'ise'],
  ['ies', 'y'],
  ['ied', 'y'],
  ['ions', ''],
  ['ion', ''],
  ['ings', ''],
  ['ing', ''],
  ['ally', 'al'],
  ['ly', ''],
  ['ers', ''],
  ['er', ''],
  ['ed', ''],
  ['es', ''],
  ['s', ''],
]

export function stem(word: string): string {
  const s = stemSuffix(word.toLowerCase())
  // Drop a final silent "e" so "engage", "engages" and "engaged" share one stem.
  return s.length > 4 && s.endsWith('e') && !s.endsWith('ee') ? s.slice(0, -1) : s
}

function stemSuffix(w: string): string {
  if (w.length <= 4)
    return w.endsWith('s') && w.length === 4 && !w.endsWith('ss') ? w.slice(0, -1) : w
  for (const [suffix, repl] of SUFFIXES) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 3) {
      if (suffix === 's' && (w.endsWith('ss') || w.endsWith('us') || w.endsWith('is'))) return w
      return w.slice(0, -suffix.length) + repl
    }
  }
  return w
}

export function tokenize(text: string): string[] {
  return (
    text
      .normalize('NFKC')
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? []
  ).map(stem)
}
