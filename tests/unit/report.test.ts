import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { analyzeCompany } from '../../src/app/analyze.ts'
import { buildReport } from '../../src/app/report.ts'
import { sampleReport } from '../../src/app/sampleReport.ts'
import type { Analysis } from '../../src/app/types.ts'
import { makeDoc } from '../../src/core/ingest/text.ts'
import { csvToTable } from '../../src/core/ingest/sheet.ts'
import { detectTable } from '../../src/core/qa/detect.ts'

const read = (p: string) => readFileSync(p, 'utf8')
const dpa = read('eval/packs/pack-d/docs/dpa.md')
const csv = read('eval/packs/pack-d/answers.csv')

function companyAnalysis(): Analysis {
  const docs = [
    makeDoc('dpa', 'DPA', 'dpa', [read('eval/packs/pack-c/docs/dpa.md')]),
    makeDoc('security', 'Security policy', 'security', [
      read('eval/packs/pack-c/docs/security-policy.md'),
    ]),
    makeDoc('privacy', 'Privacy notice', 'privacy', [
      read('eval/packs/pack-c/docs/privacy-policy.md'),
    ]),
  ]
  const table = csvToTable('q', 'q.csv', read('eval/packs/pack-c/questionnaire.csv'))
  return analyzeCompany({ docs, table, mapping: detectTable(table) })
}

const unescape = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
const quotesIn = (html: string) =>
  [...html.matchAll(/<blockquote>“([\s\S]*?)”<cite>/g)].map((m) => unescape(m[1] ?? ''))

function verifiedQuotes(a: Analysis): Set<string> {
  const ev = [
    ...a.findings.flatMap((f) => f.evidence),
    ...Object.values(a.answers).flatMap((x) => x.evidence),
    ...a.consistency.flatMap((f) => [f.answer, ...f.contract]),
  ]
  return new Set(ev.filter((e) => e.verified).map((e) => e.quote))
}

describe('HTML report', () => {
  it('public/sample-report/index.html matches the tool output on the vendor sample', () => {
    expect(read('public/sample-report/index.html')).toBe(sampleReport(dpa, csv))
  })

  it('has the sections, versions, banner and disclaimer', () => {
    const html = sampleReport(dpa, csv)
    for (const s of [
      'Sample on fictional documents',
      'Mode: Vendor review',
      'Tool version',
      'prompt version',
      'Questions to send the other side',
      'What this tool did not check',
      'Draft for human review. Not legal advice. Rules not yet reviewed by a lawyer.',
    ])
      expect(html).toContain(s)
  })

  it('prints only verified quotes and shows every FOUND answer with its quote (company mode)', () => {
    const a = companyAnalysis()
    const html = buildReport({
      analysis: a,
      mode: 'company',
      documents: ['DPA'],
      date: '2026-11-27',
    })
    const ok = verifiedQuotes(a)
    const printed = quotesIn(html)
    expect(printed.length).toBeGreaterThan(0)
    for (const q of printed) expect(ok.has(q), q).toBe(true)
    for (const ans of Object.values(a.answers).filter((x) => x.status === 'FOUND')) {
      const ev = ans.evidence.find((e) => e.verified)
      expect(ev).toBeDefined()
      expect(printed).toContain(ev?.quote)
    }
  })

  it('drops a quote that failed verification', () => {
    const a = companyAnalysis()
    const first = Object.values(a.answers)[0]
    if (!first) throw new Error('no answers')
    first.evidence = [
      { chunkId: 'x', docName: 'DPA', page: 1, quote: 'UNVERIFIED-QUOTE', verified: false },
    ]
    const html = buildReport({
      analysis: a,
      mode: 'company',
      documents: ['DPA'],
      date: '2026-11-27',
    })
    expect(html).not.toContain('UNVERIFIED-QUOTE')
  })

  it('escapes document text and carries no script or external reference', () => {
    const html = sampleReport(
      dpa,
      `${csv}\nV99,"Do you use sub-processors?","<script>alert(1)</script> Brightpath Analytics Inc."`,
    )
    expect(html).not.toMatch(/<script/i)
    expect(html).not.toMatch(/\b(src|href)="https?:/i)
    expect(html).toContain('&lt;script&gt;')
  })

  it('never says compliant, certified or safe in its own wording', () => {
    const own = sampleReport(dpa, csv).replace(/<blockquote>[\s\S]*?<\/blockquote>/g, '')
    expect(own).not.toMatch(/\b(compliant|certified|safe)\b/i)
  })
})
