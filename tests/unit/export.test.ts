import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { exportXlsx, NEW_COLUMNS } from '../../src/core/export/xlsx.ts'
import { buildAuditLog } from '../../src/core/export/audit.ts'
import { ingestTable } from '../../src/core/ingest/index.ts'
import { detectTable, extractQuestions } from '../../src/core/qa/detect.ts'
import type { Answer } from '../../src/core/types.ts'
import { fixture } from '../helpers/nodeAdapters.ts'

async function reopen(bytes: Uint8Array) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  )
  return wb
}

describe('exportXlsx', async () => {
  const original = fixture('questionnaire.xlsx')
  const { table } = await ingestTable('q', 'questionnaire.xlsx', original)
  const mapping = detectTable(table)
  if (!mapping) throw new Error('no mapping')
  const questions = extractQuestions(table, mapping)
  const answers: Answer[] = questions.map((q, i) => ({
    qid: q.qid,
    status: i === 0 ? 'FOUND' : 'NOT_FOUND',
    draft: i === 0 ? 'We notify customers within 48 hours.' : undefined,
    evidence:
      i === 0
        ? [
            {
              chunkId: 'd:c1',
              docName: 'DPA',
              page: 3,
              quote: 'within forty-eight (48) hours',
              verified: true,
            },
          ]
        : [],
    source: 'llm',
    reviewed: i === 0 ? 'accepted' : 'pending',
  }))
  const out = await exportXlsx(
    original,
    questions.map((q, i) => ({ question: q, answer: answers[i]! })),
    mapping.headerRow,
  )
  const before = await reopen(original)
  const after = await reopen(out)

  it('leaves every original cell unchanged', () => {
    for (const wsBefore of before.worksheets) {
      const wsAfter = after.getWorksheet(wsBefore.name)!
      wsBefore.eachRow({ includeEmpty: true }, (row, r) => {
        row.eachCell({ includeEmpty: true }, (cell, c) => {
          expect(wsAfter.getRow(r).getCell(c).value).toEqual(cell.value)
        })
      })
    }
  })

  it('adds the five new columns to the right with values', () => {
    const ws = after.getWorksheet('Security')!
    const firstNew = before.getWorksheet('Security')!.actualColumnCount + 1
    expect(NEW_COLUMNS.map((_, i) => ws.getRow(1).getCell(firstNew + i).value)).toEqual([
      ...NEW_COLUMNS,
    ])
    const a1 = ws.getRow(questions[0]!.row)
    expect(a1.getCell(firstNew + 1).value).toBe('Found in text (accepted)')
    expect(a1.getCell(firstNew + 2).value).toBe('"within forty-eight (48) hours"')
    expect(a1.getCell(firstNew + 3).value).toBe('DPA, p. 3')
  })

  it('marks unreviewed answers as not reviewed', () => {
    const ws = after.getWorksheet('Security')!
    const firstNew = before.getWorksheet('Security')!.actualColumnCount + 1
    expect(ws.getRow(questions[1]!.row).getCell(firstNew + 1).value).toBe(
      'Not found in text (not reviewed)',
    )
  })

  it('keeps the other sheets and the hidden row', () => {
    expect(after.worksheets.map((w) => w.name)).toEqual(['Security', 'Instructions'])
    expect(after.getWorksheet('Security')!.getRow(6).hidden).toBe(true)
  })
})

describe('buildAuditLog', () => {
  it('records prompt version and disclaimer', () => {
    const log = buildAuditLog(
      { model: null, mode: 'company', documents: [], answers: [], findings: [] },
      new Date('2026-11-24T00:00:00Z'),
    )
    expect(log.promptVersion).toMatch(/answer-v\d/)
    expect(log.disclaimer).toBe('Draft for human review. Not legal advice.')
  })
})
