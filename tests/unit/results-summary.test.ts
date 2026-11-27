import { describe, expect, it } from 'vitest'
import { resultsSummary } from '../../src/components/EvalResults.tsx'
import summary from '../../src/data/eval-summary.json'

describe('results summary sentence', () => {
  it('uses the same held-out numbers as the detail tables', () => {
    const text = resultsSummary()
    for (const id of ['missing', 'vendor', 'vendorClean']) {
      const m = summary.noAi.find((x) => x.id === id && x.group === 'new')
      expect(m).toBeDefined()
      expect(text).toContain(`${m?.value}/${m?.total}`)
    }
    expect(text).not.toContain('?')
  })
})
