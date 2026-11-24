import { describe, expect, it } from 'vitest'
import { chunkDoc } from '../../src/core/chunk/chunker.ts'
import { makeDoc } from '../../src/core/ingest/text.ts'
import {
  buildLibraryMatcher,
  exportLibrary,
  importLibrary,
  type LibraryEntry,
} from '../../src/core/library/library.ts'

const entry: LibraryEntry = {
  question: 'Is customer data encrypted at rest? Which algorithm do you use?',
  topic: 'T11',
  answer: 'We encrypt customer data at rest with AES-256.',
  quote: 'encrypted using AES-256',
  sourceDocument: 'Security policy',
  dateApproved: '2026-11-20',
  reviewer: 'OH',
}
const chunks = chunkDoc(
  makeDoc('s', 'sec', 'security', [
    '3. Encryption\nCustomer data at rest is encrypted using AES-256.',
  ]),
)

describe('library', () => {
  it('round-trips through JSON and rejects malformed files', () => {
    expect(importLibrary(exportLibrary([entry]))?.entries).toEqual([entry])
    expect(importLibrary('{"format":"other"}')).toBeNull()
    expect(importLibrary('not json')).toBeNull()
  })

  it('suggests an earlier answer for the same question and topic', () => {
    const match = buildLibraryMatcher([entry])
    const s = match(
      'Do you encrypt customer data at rest, and with which algorithm?',
      'T11',
      chunks,
    )
    expect(s?.entry.answer).toBe(entry.answer)
    expect(s?.stillSupported).toBe(true)
  })

  it('does not match a different topic or an unrelated question', () => {
    const match = buildLibraryMatcher([entry])
    expect(match('Do you encrypt customer data at rest?', 'T12', chunks)).toBeNull()
    expect(match('Who is your data protection officer?', 'T11', chunks)).toBeNull()
  })

  it('marks the answer as possibly outdated when current documents no longer contain the quote', () => {
    const match = buildLibraryMatcher([entry])
    const changed = chunkDoc(
      makeDoc('s', 'sec', 'security', [
        '3. Encryption\nCustomer data at rest is encrypted using ChaCha20.',
      ]),
    )
    expect(
      match('Is customer data encrypted at rest? Which algorithm?', 'T11', changed)?.stillSupported,
    ).toBe(false)
  })
})
