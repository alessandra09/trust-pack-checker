import { describe, expect, it } from 'vitest'
import { verifyQuote } from '../../src/core/llm/verifyQuote.ts'

const chunk =
  'The Processor shall notify the Controller without undue delay after becoming aware of a Personal Data Breach.'

describe('verifyQuote', () => {
  it('accepts an exact quote', () => {
    expect(verifyQuote('notify the Controller without undue delay', chunk)).toBe(true)
  })

  it('ignores case and repeated whitespace', () => {
    expect(verifyQuote('NOTIFY   the controller\nwithout undue delay', chunk)).toBe(true)
  })

  it('rejects a paraphrase', () => {
    expect(verifyQuote('notify the Controller within 24 hours', chunk)).toBe(false)
  })

  it('rejects quotes shorter than 12 characters', () => {
    expect(verifyQuote('Processor', chunk)).toBe(false)
  })

  it('rejects quotes longer than 400 characters', () => {
    const long = 'a'.repeat(401)
    expect(verifyQuote(long, long)).toBe(false)
  })

  it('handles non-breaking spaces', () => {
    expect(verifyQuote('without undue delay', chunk)).toBe(true)
  })

  it('strips soft hyphens', () => {
    expect(
      verifyQuote(
        'becoming aware of a Personal Data Breach',
        'becom­ing aware of a Per­sonal Data Breach',
      ),
    ).toBe(true)
  })

  it('folds ligatures via NFKC', () => {
    expect(verifyQuote('the processor shall notify', 'The Processor shall notiﬁy')).toBe(false)
    expect(verifyQuote('technical and official measures', 'technical and oﬃcial measures')).toBe(
      true,
    )
  })

  it('treats smart and straight quotes alike', () => {
    expect(
      verifyQuote('the "Sub-processor" list', 'See the “Sub‑processor” list in Annex 3.'),
    ).toBe(true)
  })

  it('ignores bullet characters', () => {
    expect(verifyQuote('encryption at rest', '• encryption at rest')).toBe(true)
  })

  it('does not match across a missing word', () => {
    expect(verifyQuote('notify the Controller after becoming aware', chunk)).toBe(false)
  })
})
