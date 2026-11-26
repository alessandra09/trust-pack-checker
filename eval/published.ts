import { readFileSync } from 'node:fs'

// Numbers shown on the landing page (src/data/eval-summary.json) must equal what this eval measures,
// including the list of misses shown under "How it was tested". Metrics add up across packs.
export type Measured = { value: number; total: number; missed: string[] }
export const measured: Record<string, Measured> = {}

export function record(id: string, value: number, total: number, missed: string[] = []): void {
  const cur = measured[id] ?? { value: 0, total: 0, missed: [] }
  measured[id] = {
    value: cur.value + value,
    total: cur.total + total,
    missed: [...cur.missed, ...missed],
  }
}

type Published = { id: string; value: number; total: number; missed: { ref: string }[] }

export function publishedMismatches(): string[] {
  const summary = JSON.parse(readFileSync('src/data/eval-summary.json', 'utf8')) as {
    noAi: Published[]
  }
  const ids = new Set([...summary.noAi.map((m) => m.id), ...Object.keys(measured)])
  return [...ids].flatMap((id) => {
    const p = summary.noAi.find((m) => m.id === id)
    const m = measured[id]
    const pMissed = (p?.missed ?? [])
      .map((x) => x.ref)
      .sort()
      .join(', ')
    const mMissed = [...(m?.missed ?? [])].sort().join(', ')
    if (p && m && p.value === m.value && p.total === m.total && pMissed === mMissed) return []
    return [
      `${id}: page shows ${p ? `${p.value}/${p.total} missed [${pMissed}]` : 'nothing'}, eval measured ${m ? `${m.value}/${m.total} missed [${mMissed}]` : 'nothing'}`,
    ]
  })
}
