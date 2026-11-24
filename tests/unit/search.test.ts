import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { chunkDoc } from '../../src/core/chunk/chunker.ts'
import { makeDoc } from '../../src/core/ingest/text.ts'
import { findRuleCandidates, matchHints } from '../../src/core/rules/candidates.ts'
import { buildIndex } from '../../src/core/search/index.ts'
import { stem } from '../../src/core/search/stem.ts'
import { art28 } from '../../src/data/load.ts'

const chunksOf = (pack: string) =>
  chunkDoc(makeDoc(pack, 'dpa.md', 'dpa', [readFileSync(`eval/packs/${pack}/docs/dpa.md`, 'utf8')]))
const rule = (id: string) => {
  const r = art28.rules.find((x) => x.id === id)
  if (!r) throw new Error(id)
  return r
}

describe('stem', () => {
  it('maps word forms to one stem', () => {
    expect(new Set(['engage', 'engages', 'engaged', 'engaging'].map(stem)).size).toBe(1)
    expect(stem('audits')).toBe(stem('audit'))
    expect(stem('authorisation')).toBe(stem('authorise'))
    expect(stem('process')).toBe('process')
  })
})

describe('matchHints', () => {
  it('matches phrases case-insensitively across word forms', () => {
    expect(
      matchHints('Audits, including Inspections, by the Customer', [
        'audits, including inspections',
      ]),
    ).toHaveLength(1)
    expect(matchHints('engages another processor', ['engage another processor'])).toHaveLength(1)
    expect(matchHints('another kind of processor', ['another processor'])).toHaveLength(0)
  })
})

describe('findRuleCandidates', () => {
  it('finds the audit clause in Pack A', () => {
    const top = findRuleCandidates(rule('A28-3-h'), chunksOf('pack-a'))[0]
    expect(top?.chunk.text).toContain('audits, including inspections')
  })

  it('ignores the financial-audit decoy in Pack B', () => {
    expect(findRuleCandidates(rule('A28-3-h'), chunksOf('pack-b'))).toEqual([])
  })

  it('returns nothing for clauses missing from Pack B', () => {
    for (const id of ['A28-3-b', 'A28-3-e', 'A28-3-g'])
      expect(findRuleCandidates(rule(id), chunksOf('pack-b'))).toEqual([])
  })
})

describe('buildIndex', () => {
  it('ranks the sub-processor annex for a sub-processor question', () => {
    const index = buildIndex(chunksOf('pack-a'))
    const hits = index.search('Which sub-processors do you use and where are they located?')
    expect(hits.length).toBeLessThanOrEqual(5)
    expect(hits.some((c) => c.text.includes('Skyline Hosting B.V.'))).toBe(true)
  })
})
