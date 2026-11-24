import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { chunkDoc, MAX_WORDS } from '../../src/core/chunk/chunker.ts'
import { ingestDocument } from '../../src/core/ingest/index.ts'
import { makeDoc } from '../../src/core/ingest/text.ts'
import type { Doc } from '../../src/core/types.ts'
import { fixture, nodeAdapters } from '../helpers/nodeAdapters.ts'

const words = (s: string) => (s.match(/\S+/g) ?? []).length
const md = (name: string, path: string): Doc =>
  makeDoc(name, path, 'dpa', [readFileSync(path, 'utf8')])

async function fixtureDocs(): Promise<Doc[]> {
  const load = async (name: string, kind: 'dpa' | 'privacy') =>
    (await ingestDocument(name, name, kind, fixture(name), nodeAdapters)).doc
  return [
    md('pack-a.md', 'eval/packs/pack-a/docs/dpa.md'),
    md('pack-b.md', 'eval/packs/pack-b/docs/dpa.md'),
    await load('pack-a-dpa.docx', 'dpa'),
    await load('pack-b-dpa.pdf', 'dpa'),
    await load('privacy-policy.txt', 'privacy'),
  ]
}

describe('chunkDoc on 5 fixture documents', async () => {
  const docs = await fixtureDocs()
  for (const doc of docs) {
    describe(doc.name, () => {
      const chunks = chunkDoc(doc)
      it('produces chunks whose offsets match the text', () => {
        expect(chunks.length).toBeGreaterThan(2)
        for (const c of chunks) expect(doc.text.slice(c.start, c.end)).toBe(c.text)
      })
      it('keeps chunks within the word limit and in order', () => {
        for (const c of chunks) expect(words(c.text)).toBeLessThanOrEqual(MAX_WORDS)
        for (let i = 1; i < chunks.length; i++)
          expect(chunks[i]!.start).toBeGreaterThanOrEqual(chunks[i - 1]!.end)
      })
      it('assigns valid page numbers', () => {
        for (const c of chunks) expect(c.page).toBeGreaterThanOrEqual(1)
        for (const c of chunks) expect(c.page).toBeLessThanOrEqual(doc.pages.length)
      })
    })
  }

  it('tags annex chunks and gives them their annex heading', () => {
    const chunks = chunkDoc(docs[0]!)
    const annex3 = chunks.find((c) => c.heading?.startsWith('Annex 3'))
    expect(annex3?.annex).toBe(true)
    expect(annex3?.text).toContain('Skyline Hosting B.V.')
    expect(chunks.find((c) => c.text.includes('3.1 Northwind shall process'))?.annex).toBe(false)
  })

  it('keeps each clause under its own section heading', () => {
    const chunks = chunkDoc(docs[0]!)
    expect(chunks.find((c) => c.text.includes('2.1 The Customer is the controller'))?.heading).toBe(
      '2. Roles and scope',
    )
    expect(chunks.find((c) => c.text.includes('12.1 Northwind shall not use'))?.heading).toBe(
      '12. Use of data for artificial intelligence',
    )
  })

  it('places PDF chunks on the right page', () => {
    const pdf = docs[3]!
    const chunks = chunkDoc(pdf)
    const last = chunks[chunks.length - 1]!
    expect(last.page).toBe(pdf.pages.length)
    expect(pdf.pages[last.page - 1]!.text).toContain(last.text.slice(0, 30))
  })

  it('splits long sections at sentence boundaries', () => {
    const long = `1. Long clause\n${'The processor shall keep records of processing. '.repeat(80)}`
    const chunks = chunkDoc(makeDoc('l', 'long.txt', 'dpa', [long]))
    expect(chunks.length).toBeGreaterThan(1)
    for (const c of chunks) expect(c.text.trim().endsWith('.')).toBe(true)
  })
})
