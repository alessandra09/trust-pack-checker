import { art28 } from '../../src/data/load.ts'

// SPRINT2 task 9: three carousels. Rule names, articles and reasons come from src/data/art28.rules.json.
export type Slide =
  | { kind: 'cover'; title: string; kicker: string; keyword: string }
  | { kind: 'list'; heading: string; items: { title: string; note?: string }[] }
  | { kind: 'text'; heading: string; body: string[] }
  | { kind: 'checklist'; heading: string; items: string[] }
  | { kind: 'cta'; heading: string; body: string }

export type Carousel = {
  name: string
  slides: Slide[]
  caption: string
  alt: string[]
}

const rule = (id: string) => {
  const r = art28.rules.find((x) => x.id === id)
  if (!r) throw new Error(`unknown rule ${id}`)
  return r
}
const firstSentence = (s: string) => /^[^.]*\./.exec(s)?.[0] ?? s
const CTA: Slide = {
  kind: 'cta',
  heading: 'Try the free checker, link in bio',
  body: 'It runs in your browser: your documents stay on your machine. Every result comes with the quote and page it is based on. Draft for human review, not legal advice.',
}
const FOOTER = '\n\nNot legal advice. Checks are a first pass for human review.'

const CORE = art28.rules.filter((r) => r.class === 'core')
const chunks = <T>(xs: T[], n: number) =>
  Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n))

const art28Slides: Slide[] = [
  {
    kind: 'cover',
    kicker: 'GDPR Article 28',
    title: 'What Article 28 requires in a DPA, in 7 slides',
    keyword: 'Article 28 DPA checklist',
  },
  ...chunks(CORE, 3).map((group, i): Slide => ({
    kind: 'list',
    heading: `The contract must cover (${i + 1}/${Math.ceil(CORE.length / 3)})`,
    items: group.map((r) => ({ title: r.title, note: r.article })),
  })),
  {
    kind: 'checklist',
    heading: `Save this: the ${CORE.length} elements`,
    items: CORE.map((r) => r.title),
  },
  CTA,
]

const proofSlides: Slide[] = [
  {
    kind: 'cover',
    kicker: 'Security questionnaires',
    title: 'Found in text: why every answer needs proof',
    keyword: 'found in text',
  },
  {
    kind: 'text',
    heading: 'The problem',
    body: [
      'A questionnaire answer says "Yes".',
      'Nobody can tell which document says so, or whether it still does.',
    ],
  },
  {
    kind: 'text',
    heading: '"Found in text" means a quote',
    body: [
      'The exact sentence from your own document, with the document name and page.',
      'No quote, no "found".',
    ],
  },
  {
    kind: 'text',
    heading: '"Not found in text" is useful too',
    body: [
      'It shows what your documents do not cover yet.',
      'That is your list of gaps to fix before the customer finds them.',
    ],
  },
  {
    kind: 'text',
    heading: 'Numbers are compared by code',
    body: [
      'Answer: "deleted within 30 days". Contract: "within 45 days".',
      'A mismatch like this is flagged with both quotes side by side.',
    ],
  },
  {
    kind: 'checklist',
    heading: 'Save this: before you send an answer',
    items: [
      'Quote the sentence it is based on',
      'Name the document and page',
      'Check numbers and durations match',
      'Mark what is not covered',
      'Have a person review it',
    ],
  },
  CTA,
]

const EIGHT = [
  'A28-3-a',
  'A28-2',
  'A28-4',
  'A28-3-f',
  'A28-3-g',
  'A28-3-h',
  'P-BREACH-TIME',
  'P-TRANSFER',
]
const clauseSlides: Slide[] = [
  {
    kind: 'cover',
    kicker: 'Processor agreements',
    title: 'Eight clauses I check first in a processor agreement',
    keyword: 'processor agreement clauses',
  },
  ...chunks(EIGHT, 2).map((ids, i): Slide => ({
    kind: 'list',
    heading: `Clauses ${i * 2 + 1} and ${i * 2 + 2}`,
    items: ids.map((id) => ({
      title: rule(id).title,
      note: firstSentence(rule(id).whyItMatters),
    })),
  })),
  {
    kind: 'checklist',
    heading: 'Save this: the eight clauses',
    items: EIGHT.map((id) => rule(id).title),
  },
  CTA,
]

const altFor = (s: Slide): string => {
  switch (s.kind) {
    case 'cover':
      return `Cover slide with the title "${s.title}" and space for a photo of the author.`
    case 'list':
      return `Slide titled "${s.heading}" listing: ${s.items.map((i) => (i.note ? `${i.title} (${i.note})` : i.title)).join('; ')}.`
    case 'text':
      return `Slide titled "${s.heading}": ${s.body.join(' ')}`
    case 'checklist':
      return `Checklist slide titled "${s.heading}": ${s.items.join('; ')}.`
    case 'cta':
      return `Final slide: "${s.heading}". ${s.body}`
  }
}

const make = (name: string, slides: Slide[], caption: string): Carousel => ({
  name,
  slides,
  caption: caption + FOOTER,
  alt: slides.map(altFor),
})

export const CAROUSELS: Carousel[] = [
  make(
    'article-28-dpa',
    art28Slides,
    `Article 28 DPA checklist: the ${CORE.length} elements a processor contract has to cover, from documented instructions to deletion at the end of the service.\n\nSave it for your next DPA review. The last slide is the full checklist.\n\n#GDPR #DPA`,
  ),
  make(
    'found-in-text',
    proofSlides,
    'Found in text: every questionnaire answer should point to the exact sentence it is based on. If there is no quote, it is not an answer yet.\n\nSave the checklist on slide 6 for your next security questionnaire.\n\n#SecurityQuestionnaire #GDPR',
  ),
  make(
    'eight-clauses',
    clauseSlides,
    'Processor agreement clauses I check first: instructions, sub-processors, flow-down, help with security and breaches, deletion, audits, breach notice time and transfers.\n\nSave the checklist on slide 6.\n\n#DPA #GDPR',
  ),
]
