import { readFileSync } from 'node:fs'

// Numbers shown on the landing page (src/data/eval-summary.json) must equal what this eval measures.
export type Measured = { value: number; total: number }
export const measured: Record<string, Measured> = {}

export function record(id: string, value: number, total: number): void {
  measured[id] = { value, total }
}

export function publishedMismatches(): string[] {
  const summary = JSON.parse(readFileSync('src/data/eval-summary.json', 'utf8')) as {
    noAi: { id: string; value: number; total: number }[]
  }
  return summary.noAi
    .filter((m) => measured[m.id]?.value !== m.value || measured[m.id]?.total !== m.total)
    .map(
      (m) =>
        `${m.id}: page shows ${m.value}/${m.total}, eval measured ${measured[m.id]?.value ?? '?'}/${measured[m.id]?.total ?? '?'}`,
    )
}
