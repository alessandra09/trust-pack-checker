import { describe, expect, it } from 'vitest'
import { aiQuestions, art28, dates, topics } from '../../src/data/load.ts'

describe('data files', () => {
  it('seed Art. 28 rules match SPEC 9.2', () => {
    const ids = art28.rules.map((r) => r.id)
    expect(ids).toHaveLength(20)
    expect(new Set(ids).size).toBe(20)
    expect(art28.rules.filter((r) => r.class === 'core')).toHaveLength(12)
    expect(art28.reviewedByLawyer).toBe(false)
  })

  it('every rule points to an existing topic', () => {
    const topicIds = new Set(topics.topics.map((t) => t.id))
    for (const r of art28.rules) expect(topicIds.has(r.topic)).toBe(true)
  })

  it('has the 19 topics of SPEC 9.5 and the 10 AI questions of SPEC 10.2', () => {
    expect(topics.topics).toHaveLength(19)
    expect(aiQuestions.questions).toHaveLength(10)
  })

  it('every AI flag links to a date with a source', () => {
    const dateIds = new Set(dates.dates.map((d) => d.id))
    for (const f of aiQuestions.flags) expect(dateIds.has(f.dateId)).toBe(true)
  })

  it('no rule text uses words banned in the UI', () => {
    for (const r of art28.rules) {
      for (const field of [r.title, r.whyItMatters, r.suggestedAsk])
        expect(field).not.toMatch(/\b(compliant|certified|safe|guaranteed)\b/i)
    }
  })
})
