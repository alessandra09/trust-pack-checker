import { describe, expect, it } from 'vitest'
import { ingestDocument, ingestPasted, ingestTable } from '../../src/core/ingest/index.ts'
import { IngestError, LIMITS } from '../../src/core/ingest/errors.ts'
import { dehyphenate } from '../../src/core/ingest/text.ts'
import { htmlToStructuredText } from '../../src/core/ingest/html.ts'
import { fixture, nodeAdapters } from '../helpers/nodeAdapters.ts'

async function errorCode(p: Promise<unknown>): Promise<string> {
  try {
    await p
    return 'no error'
  } catch (e) {
    return e instanceof IngestError ? e.code : `unexpected: ${String(e)}`
  }
}

describe('ingestDocument', () => {
  it('reads a text PDF page by page', async () => {
    const r = await ingestDocument(
      'b',
      'pack-b-dpa.pdf',
      'dpa',
      fixture('pack-b-dpa.pdf'),
      nodeAdapters,
    )
    if (r.type !== 'doc') throw new Error('expected doc')
    expect(r.doc.pages.length).toBeGreaterThanOrEqual(2)
    expect(r.doc.text).toContain('within a reasonable time')
    expect(r.warnings).toEqual([])
  })

  it('blocks scanned PDFs', async () => {
    expect(
      await errorCode(
        ingestDocument('s', 'scanned.pdf', 'dpa', fixture('scanned.pdf'), nodeAdapters),
      ),
    ).toBe('scanned_pdf')
  })

  it('reports password-protected PDFs', async () => {
    expect(
      await errorCode(
        ingestDocument('p', 'password.pdf', 'dpa', fixture('password.pdf'), nodeAdapters),
      ),
    ).toBe('password')
  })

  it('reports corrupted PDFs', async () => {
    expect(
      await errorCode(
        ingestDocument('c', 'corrupt.pdf', 'dpa', fixture('corrupt.pdf'), nodeAdapters),
      ),
    ).toBe('corrupt')
  })

  it('reads DOCX with headings, lists and tables', async () => {
    const r = await ingestDocument(
      'a',
      'pack-a-dpa.docx',
      'dpa',
      fixture('pack-a-dpa.docx'),
      nodeAdapters,
    )
    expect(r.doc.text).toMatch(/^#+ DATA PROCESSING AGREEMENT/m)
    expect(r.doc.text).toMatch(/^#+ 6\. Sub-processors$/m)
    expect(r.doc.text).toContain('- Daily encrypted backups stored in a second EEA region.')
    expect(r.doc.text).toContain('Skyline Hosting B.V. | Cloud hosting | Netherlands')
  })

  it('reads TXT', async () => {
    const r = await ingestDocument(
      't',
      'privacy-policy.txt',
      'privacy',
      fixture('privacy-policy.txt'),
      nodeAdapters,
    )
    expect(r.doc.pages).toHaveLength(1)
    expect(r.doc.text).toContain('twenty-four months')
  })

  it('rejects unsupported types and oversized files', async () => {
    expect(
      await errorCode(ingestDocument('x', 'notes.rtf', 'dpa', new Uint8Array([1]), nodeAdapters)),
    ).toBe('unsupported_type')
    const huge = { byteLength: LIMITS.maxBytes + 1 } as Uint8Array
    expect(await errorCode(ingestDocument('x', 'big.pdf', 'dpa', huge, nodeAdapters))).toBe(
      'too_large',
    )
  })

  it('warns when text does not look English', () => {
    const german =
      'Der Auftragsverarbeiter verarbeitet die personenbezogenen Daten nur auf dokumentierte Weisung des Verantwortlichen. '.repeat(
        5,
      )
    expect(ingestPasted('g', 'pasted', 'dpa', german).warnings).toEqual(['not_english'])
  })
})

describe('ingestTable', () => {
  it('reads XLSX sheets, hidden rows and merged section rows', async () => {
    const r = await ingestTable('q', 'questionnaire.xlsx', fixture('questionnaire.xlsx'))
    const sheet = r.table.sheets[0]
    expect(r.table.sheets.map((s) => s.name)).toEqual(['Security', 'Instructions'])
    expect(sheet?.rows[0]?.cells.slice(0, 3)).toEqual(['ID', 'Question', 'Answer'])
    expect(sheet?.rows.find((row) => row.cells[0] === 'A4')?.hidden).toBe(true)
    expect(sheet?.rows.find((row) => row.cells[1] === 'Section A: Data protection')).toBeDefined()
  })

  it('reads CSV with quoted commas', async () => {
    const r = await ingestTable('c', 'questionnaire.csv', fixture('questionnaire.csv'))
    expect(r.table.sheets[0]?.rows[1]?.cells[1]).toBe(
      'Do you notify customers of breaches, and how fast?',
    )
  })

  it('enforces the row limit', async () => {
    const csv = new TextEncoder().encode(
      Array.from({ length: LIMITS.maxRows + 1 }, (_, i) => `Q${i},Question ${i}?`).join('\n'),
    )
    expect(await errorCode(ingestTable('c', 'big.csv', csv))).toBe('too_many_rows')
  })
})

describe('text helpers', () => {
  it('joins words hyphenated at line ends', () => {
    expect(dehyphenate('the process-\ning of data')).toBe('the processing of data')
    expect(dehyphenate('Article 28-\n3')).toBe('Article 28-\n3')
  })

  it('turns mammoth HTML into structured text', () => {
    const html =
      '<h2>4. Security</h2><p>Text &amp; more</p><ul><li>One</li></ul><table><tr><td>A</td><td>B</td></tr></table>'
    expect(htmlToStructuredText(html)).toBe('## 4. Security\n\nText & more\n\n- One\n\nA | B')
  })
})
