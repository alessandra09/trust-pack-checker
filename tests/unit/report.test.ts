import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { sampleReport } from '../../src/app/sampleReport.ts'

const dpa = readFileSync('eval/packs/pack-d/docs/dpa.md', 'utf8')
const csv = readFileSync('eval/packs/pack-d/answers.csv', 'utf8')

describe('HTML report', () => {
  it('public/sample-report.html matches the tool output on the vendor sample', () => {
    expect(readFileSync('public/sample-report.html', 'utf8')).toBe(sampleReport(dpa, csv))
  })

  it('escapes document text and carries no script', () => {
    const html = sampleReport(
      dpa,
      `${csv}\nV99,"Do you use sub-processors?","<script>alert(1)</script> Brightpath Analytics Inc."`,
    )
    expect(html).not.toMatch(/<script/i)
    expect(html).toContain('&lt;script&gt;')
  })

  it('keeps the disclaimers and never says compliant, certified or safe', () => {
    const html = sampleReport(dpa, csv)
    expect(html).toContain('Not legal advice.')
    expect(html).toContain('Rules not yet reviewed by a lawyer.')
    // Quotes are the vendor's own words; the rule covers the report's own wording.
    const own = html.replace(/<blockquote>[\s\S]*?<\/blockquote>/g, '')
    expect(own).not.toMatch(/\b(compliant|certified|safe)\b/i)
  })
})
