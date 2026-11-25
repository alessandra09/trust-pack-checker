import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { verifyQuote } from '../../src/core/llm/verifyQuote.ts'
import en from '../../src/i18n/en.json'

// The landing page shows a sample quote as "Found in text": it must really be in the sample DPA.
describe('landing example', () => {
  it('quotes the synthetic sample DPA verbatim', () => {
    const dpa = readFileSync('eval/packs/pack-c/docs/dpa.md', 'utf8')
    expect(verifyQuote(en['bento.evidence.quote'], dpa)).toBe(true)
  })
})
