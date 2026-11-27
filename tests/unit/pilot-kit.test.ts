import { existsSync, readdirSync, readFileSync } from 'node:fs'
import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'

const DIR = 'docs/pilot-kit'

describe('pilot kit', () => {
  it('has every file the sprint asks for', () => {
    for (const f of [
      '01_reply_to_interested.md',
      '02_pilot_checklist.md',
      '03_report_template.md',
      '04_feedback_questions.md',
      '05_followup_messages.md',
      '06_consultant_outreach.md',
      '07_founder_outreach.md',
      '08_pilot_tracker.xlsx',
      '09_one_pager.html',
      '09_one_pager.pdf',
    ])
      expect(existsSync(`${DIR}/${f}`), f).toBe(true)
  })

  it('uses none of the forbidden words', () => {
    for (const f of readdirSync(DIR).filter((n) => /\.(md|html)$/.test(n)))
      expect(readFileSync(`${DIR}/${f}`, 'utf8'), f).not.toMatch(
        /\b(compliant|certified|safe|guaranteed)\b/i,
      )
  })

  it('tracker opens, has dropdowns, example rows and summary formulas', async () => {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(`${DIR}/08_pilot_tracker.xlsx`)
    const tracker = wb.getWorksheet('Tracker')
    const summary = wb.getWorksheet('Summary')
    expect(tracker?.getCell('O2').dataValidation.type).toBe('list')
    expect(String(tracker?.getCell('B2').value)).toContain('EXAMPLE')
    const b2 = summary?.getCell('B2').value as { formula: string; result: number }
    expect(b2.formula).toContain('COUNTA(Tracker!B2:B500)')
    expect(b2.result).toBe(3)
  })
})
