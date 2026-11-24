// Deterministic duration parsing (SPEC 3.2, 9.3): numbers are compared by code, never by the model.
export type Duration = { hours: number; raw: string; index: number }
export type DurationScan = { durations: Duration[]; vague: string[] }

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fourteen: 14,
  fifteen: 15,
  twenty: 20,
  'twenty-four': 24,
  thirty: 30,
  'thirty-five': 35,
  forty: 40,
  'forty-five': 45,
  'forty-eight': 48,
  sixty: 60,
  'seventy-two': 72,
  ninety: 90,
}
const UNIT_HOURS: Record<string, number> = {
  hour: 1,
  day: 24,
  'business day': 24,
  'working day': 24,
  week: 168,
  month: 730,
  year: 8760,
}
const UNIT = '(hours?|(?:business |working )?days?|weeks?|months?|years?)'
const WORD = `(${Object.keys(NUMBER_WORDS)
  .sort((a, b) => b.length - a.length)
  .join('|')})`

// "forty-eight (48) hours", "48 hours", "forty-eight hours", "thirty (30) days'".
const NUMERIC = new RegExp(
  `\\b(?:${WORD}\\s*\\(\\s*(\\d+)\\s*\\)|(\\d+)|${WORD})\\s*${UNIT}\\b`,
  'gi',
)
const PERIODIC: [RegExp, number][] = [
  [/\b(every|each) (year|twelve months)\b|\bannual(ly)?\b|\bonce a year\b/gi, 8760],
  [/\b(every|each) quarter\b|\bquarterly\b/gi, 2190],
  [/\b(every|each) week\b|\bweekly\b/gi, 168],
]
const VAGUE =
  /\b(without undue delay|immediately|promptly|as soon as (reasonably )?practicable|within a reasonable time)\b/gi

function unitHours(unit: string): number {
  const u = unit.toLowerCase().replace(/s$/, '')
  return UNIT_HOURS[u] ?? 0
}

export function scanDurations(text: string): DurationScan {
  const durations: Duration[] = []
  for (const m of text.matchAll(NUMERIC)) {
    const value = m[2]
      ? Number(m[2])
      : m[3]
        ? Number(m[3])
        : NUMBER_WORDS[(m[1] ?? m[4] ?? '').toLowerCase()]
    const unit = m[5] ?? ''
    if (value === undefined || !Number.isFinite(value)) continue
    durations.push({ hours: value * unitHours(unit), raw: m[0], index: m.index })
  }
  for (const [re, hours] of PERIODIC) {
    for (const m of text.matchAll(re)) durations.push({ hours, raw: m[0], index: m.index })
  }
  const vague = [...text.matchAll(VAGUE)].map((m) => m[0])
  return { durations: durations.sort((a, b) => a.index - b.index), vague }
}
