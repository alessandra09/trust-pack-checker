import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import summary from '../../src/data/eval-summary.json'

type Row = { id: string; value: number; total: number; packs: number; missed: string[] }
const latest = JSON.parse(readFileSync('eval/results/latest.json', 'utf8')) as { noAi: Row[] }

// SPRINT2 task 6: the numbers on the site must equal the last eval run, misses included.
describe('landing results equal eval/results/latest.json', () => {
  it('has the same metrics, numbers and misses', () => {
    const site = summary.noAi
      .map((m) => ({
        id: m.id,
        value: m.value,
        total: m.total,
        packs: m.packs,
        missed: m.missed.map((x) => x.ref).sort(),
      }))
      .sort((a, b) => a.id.localeCompare(b.id))
    const run = [...latest.noAi].sort((a, b) => a.id.localeCompare(b.id))
    expect(site).toEqual(run)
  })

  it('gives a reason for every miss', () => {
    for (const m of summary.noAi) for (const x of m.missed) expect(x.why.length).toBeGreaterThan(20)
  })
})
