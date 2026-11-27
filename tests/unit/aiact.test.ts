import { describe, expect, it } from 'vitest'
import { buildDisclosure } from '../../src/core/aiact/disclosure.ts'
import {
  EMPTY_ANSWERS,
  screeningFlags,
  triggeredFlagIds,
  verifiedDates,
  type AiAnswers,
} from '../../src/core/aiact/flags.ts'
import { aiQuestions, dates } from '../../src/data/load.ts'

const a = (over: Partial<AiAnswers>): AiAnswers => ({ ...EMPTY_ANSWERS, q1: 'yes', ...over })
const BANNED = [/\bcompliant\b/i, /\bcertified\b/i, /\bsafe\b/i, /\bguaranteed\b/i, /\bapproved\b/i]

describe('AI Act screening flags (SPEC 10.3)', () => {
  it('no answers, no flags', () => {
    expect(triggeredFlagIds(EMPTY_ANSWERS)).toEqual([])
    expect(
      triggeredFlagIds(a({ q5: 'Annual training', q6: 'yes', q6told: 'yes', q8: 'no', q9: 'no' })),
    ).toEqual([])
  })

  it('emotion inference on employees or students: the workplace/education flag only', () => {
    expect(triggeredFlagIds(a({ q9: 'yes', q9groups: ['employees'] }))).toEqual(['F-EMOTION-WORK'])
    expect(triggeredFlagIds(a({ q9: 'yes', q9groups: ['customers', 'students'] }))).toEqual([
      'F-EMOTION-WORK',
    ])
  })

  it('emotion inference in other settings: the general emotion flag only', () => {
    expect(triggeredFlagIds(a({ q9: 'yes', q9groups: ['callers'] }))).toEqual(['F-EMOTION-OTHER'])
    expect(triggeredFlagIds(a({ q9: 'no', q9groups: ['employees'] }))).toEqual([])
  })

  it('decisions in Annex III areas: the high-risk flag', () => {
    expect(triggeredFlagIds(a({ q8: 'yes' }))).toEqual(['F-HIGH-RISK'])
  })

  it('users talk to AI and are not told: the transparency flag; told or unanswered: none', () => {
    expect(triggeredFlagIds(a({ q6: 'yes', q6told: 'no' }))).toEqual(['F-TRANSPARENCY'])
    expect(triggeredFlagIds(a({ q6: 'yes', q6told: 'yes' }))).toEqual([])
    expect(triggeredFlagIds(a({ q6: 'yes' }))).toEqual([])
  })

  it('no AI literacy training: the Art. 4 flag', () => {
    for (const none of ['none', 'None.', ' no ', 'N/A'])
      expect(triggeredFlagIds(a({ q5: none }))).toEqual(['F-LITERACY'])
    expect(triggeredFlagIds(a({ q5: '' }))).toEqual([])
    expect(triggeredFlagIds(a({ q5: 'None of our staff yet, planned for 2027' }))).toEqual([])
  })

  it('every flag shows a verified date with source and last-verified date', () => {
    const all = a({
      q5: 'none',
      q6: 'yes',
      q6told: 'no',
      q8: 'yes',
      q9: 'yes',
      q9groups: ['employees'],
    })
    const shown = screeningFlags(all, aiQuestions.flags, dates.dates)
    expect(shown.map((f) => f.id)).toEqual([
      'F-EMOTION-WORK',
      'F-HIGH-RISK',
      'F-TRANSPARENCY',
      'F-LITERACY',
    ])
    for (const f of shown) {
      expect(f.date?.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(f.date?.source).toMatch(/^https:\/\//)
    }
  })

  it('hides a date that is not verified', () => {
    const unverified = dates.dates.map((d) => ({ ...d, lastVerified: null }))
    const shown = screeningFlags(a({ q8: 'yes' }), aiQuestions.flags, unverified)
    expect(shown[0]?.date).toBeNull()
    expect(verifiedDates(unverified)).toEqual([])
  })
})

describe('AI Act facts (SPRINT2 task 8 corrections)', () => {
  const date = (id: string) => dates.dates.find((d) => d.id === id)
  it('carries the corrected dates, each with a source and last-verified date', () => {
    expect(date('D-PROHIBITIONS')?.date).toBe('2025-02-02')
    expect(date('D-LITERACY')?.date).toBe('2025-02-02')
    expect(date('D-TRANSPARENCY')?.date).toBe('2026-08-02')
    expect(date('D-ART50-2-EXISTING')?.date).toBe('2026-12-02')
    expect(date('D-HIGH-RISK-ANNEX-III')?.date).toBe('2027-12-02')
    expect(date('D-HIGH-RISK-ANNEX-I')?.date).toBe('2028-08-02')
    for (const d of dates.dates) expect(d.lastVerified).not.toBeNull()
  })

  it('uses the omnibus wording for Art. 4 and covers education in Art. 5(1)(f)', () => {
    const flag = (id: string) => aiQuestions.flags.find((f) => f.id === id)?.text ?? ''
    expect(flag('F-LITERACY')).toContain('support the development of AI literacy')
    expect(flag('F-EMOTION-WORK')).toMatch(/workplace or in education/)
    expect(flag('F-EMOTION-WORK')).toContain('medical or safety reasons')
  })

  it('flag, date and disclosure copy uses no banned words and gives no verdict', () => {
    const full = a({
      q2: 'Support chatbot, provider X',
      q3: 'no',
      q4: 'always',
      q5: 'Annual course',
      q6: 'yes',
      q6told: 'yes',
      q7: 'yes',
      q8: 'yes',
      q9: 'yes',
      q9groups: ['callers'],
      q10: 'yes',
    })
    const texts = [
      ...aiQuestions.flags.map((f) => f.text),
      ...dates.dates.map((d) => d.label),
      buildDisclosure(full),
      buildDisclosure(a({ q1: 'no' })),
    ]
    for (const s of texts) {
      for (const w of BANNED) expect(s).not.toMatch(w)
      expect(s).not.toMatch(/\b(is|are) (high-risk|prohibited AI|not high-risk)\b/i)
    }
  })
})

describe('AI use disclosure (SPEC 10.4)', () => {
  it('is empty until question 1 is answered, and short when AI is not used', () => {
    expect(buildDisclosure(EMPTY_ANSWERS)).toBe('')
    expect(buildDisclosure(a({ q1: 'no' }))).toBe(
      'We do not use AI systems in our service or internal operations.',
    )
  })

  it('states only what the user answered', () => {
    const text = buildDisclosure(
      a({ q2: 'Chatbot, provider X\n\nTranscription, provider Y', q3: 'no', q4: 'always' }),
    )
    expect(text).toContain('Chatbot, provider X; Transcription, provider Y')
    expect(text).toContain('not used to train')
    expect(text).toContain('A person reviews AI output')
    expect(text).not.toMatch(/inventory|literacy|synthetic/)
  })
})
