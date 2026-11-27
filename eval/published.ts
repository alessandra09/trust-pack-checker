import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

// Numbers shown on the landing page (src/data/eval-summary.json) must equal what this eval measures,
// including the list of misses shown under "How it was tested". Metrics add up across packs.
/** packs: how many packs contributed (each record call with total > 0 is one pack). */
export type Measured = { value: number; total: number; missed: string[]; packs: number }
export const measured: Record<string, Measured> = {}

export function record(id: string, value: number, total: number, missed: string[] = []): void {
  const cur = measured[id] ?? { value: 0, total: 0, missed: [], packs: 0 }
  measured[id] = {
    value: cur.value + value,
    total: cur.total + total,
    missed: [...cur.missed, ...missed],
    packs: cur.packs + (total > 0 ? 1 : 0),
  }
}

type Published = {
  id: string
  value: number
  total: number
  packs?: number
  missed: { ref: string }[]
}

export function publishedMismatches(): string[] {
  const summary = JSON.parse(readFileSync('src/data/eval-summary.json', 'utf8')) as {
    noAi: Published[]
  }
  // A metric no pack measured (total 0) need not be published.
  const measuredIds = Object.keys(measured).filter((id) => (measured[id]?.total ?? 0) > 0)
  const ids = new Set([...summary.noAi.map((m) => m.id), ...measuredIds])
  return [...ids].flatMap((id) => {
    const p = summary.noAi.find((m) => m.id === id)
    const m = measured[id]
    const pMissed = (p?.missed ?? [])
      .map((x) => x.ref)
      .sort()
      .join(', ')
    const mMissed = [...(m?.missed ?? [])].sort().join(', ')
    if (
      p &&
      m &&
      p.value === m.value &&
      p.total === m.total &&
      p.packs === m.packs &&
      pMissed === mMissed
    )
      return []
    return [
      `${id}: page shows ${p ? `${p.value}/${p.total} on ${p.packs ?? '?'} packs missed [${pMissed}]` : 'nothing'}, eval measured ${m ? `${m.value}/${m.total} on ${m.packs} packs missed [${mMissed}]` : 'nothing'}`,
    ]
  })
}

/** Writes what this run measured to eval/results/latest.json; a unit test compares it to the landing data. */
export function writeLatest(path = 'eval/results/latest.json'): void {
  const ids = Object.keys(measured)
    .filter((id) => (measured[id]?.total ?? 0) > 0)
    .sort()
  const out = ids.map((id) => {
    const m = measured[id] as Measured
    return { id, value: m.value, total: m.total, packs: m.packs, missed: [...m.missed].sort() }
  })
  mkdirSync('eval/results', { recursive: true })
  writeFileSync(path, `${JSON.stringify({ mode: 'no-ai', noAi: out }, null, 2)}\n`)
}
