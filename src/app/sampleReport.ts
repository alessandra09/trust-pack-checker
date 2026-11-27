import { csvToTable } from '../core/ingest/sheet.ts'
import { makeDoc } from '../core/ingest/text.ts'
import { detectTable } from '../core/qa/detect.ts'
import { analyzeClient } from './analyzeClient.ts'
import { buildReport } from './report.ts'

// The sample pilot report on the landing page: the tool's own output on the synthetic Pack D vendor sample.
// public/sample-report/index.html is generated from this (npm run sample-report); a unit test keeps them equal.
export const SAMPLE_REPORT_DATE = '2026-11-27'
const DPA = 'Harbourline DPA (sample)'
const ANSWERS = 'Harbourline answers (sample).csv'

export function sampleReport(dpaText: string, answersCsv: string): string {
  const table = csvToTable('questionnaire', ANSWERS, answersCsv)
  const analysis = analyzeClient({
    dpa: makeDoc('dpa', DPA, 'dpa', [dpaText]),
    table,
    mapping: detectTable(table),
    answersName: ANSWERS,
  })
  return buildReport({
    analysis,
    mode: 'client',
    documents: [DPA, ANSWERS],
    date: SAMPLE_REPORT_DATE,
    sample: { backHref: '../' },
  })
}
