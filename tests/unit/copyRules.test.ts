import { describe, expect, it } from 'vitest'
import en from '../../src/i18n/en.json'

// SPEC 11.5: banned words in UI copy.
const BANNED = [
  /\bcompliant\b/i,
  /\bcertified\b/i,
  /\bsafe\b/i,
  /\bguaranteed\b/i,
  /\bapproved\b/i,
  /AI-powered legal review/i,
]

describe('UI copy rules', () => {
  for (const [key, text] of Object.entries(en)) {
    it(`"${key}" uses no banned words`, () => {
      for (const word of BANNED) expect(text).not.toMatch(word)
    })
  }

  it('keeps the required disclaimers', () => {
    expect(en['footer.disclaimer']).toBe('Draft for human review. Not legal advice.')
    expect(en['footer.rulesNotReviewed']).toBe('Rules not yet reviewed by a lawyer.')
  })
})
