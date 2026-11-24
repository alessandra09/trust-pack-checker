import { tokenize } from '../search/stem.ts'

// Words that carry no topic meaning in questionnaire questions.
const WEAK = new Set(
  tokenize(
    'a an the of to in on at for by with from and or is are was be been do does did you your yours we us our ours it its this that these those how what which who where when why will would should can could have has had any all please provide describe list explain confirm state if so there their they them many much often within customer customers data',
  ),
)

export function contentTerms(text: string): Set<string> {
  return new Set(tokenize(text).filter((t) => t.length > 1 && !WEAK.has(t)))
}

export function sharedTerms(a: Set<string>, text: string): number {
  const b = contentTerms(text)
  let n = 0
  for (const t of a) if (b.has(t)) n++
  return n
}
