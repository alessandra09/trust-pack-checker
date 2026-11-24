import { describe, expect, it } from 'vitest'
import { csvToTable } from '../../src/core/ingest/sheet.ts'
import { makeDoc } from '../../src/core/ingest/text.ts'
import { chunkDoc } from '../../src/core/chunk/chunker.ts'
import { classifyTopic, OTHER_TOPIC } from '../../src/core/qa/classify.ts'
import { asksAboutTime, findDurationConflict } from '../../src/core/qa/conflicts.ts'
import { detectTable, extractQuestions } from '../../src/core/qa/detect.ts'
import { scanDurations } from '../../src/core/rules/durations.ts'
import { confirmBySelection, evaluateRuleNoAi } from '../../src/core/rules/engine.ts'
import { art28, topics } from '../../src/data/load.ts'

describe('scanDurations', () => {
  it.each([
    ['within forty-eight (48) hours', 48],
    ['within 24 hours', 24],
    ["thirty (30) days' notice", 720],
    ['retained for twelve months', 8760],
    ['tested every year', 8760],
    ['reviewed every quarter', 2190],
    ['within five (5) business days', 120],
  ])('%s -> %i hours', (text, hours) => {
    expect(scanDurations(text).durations[0]?.hours).toBe(hours)
  })

  it('treats vague wording as non-numeric', () => {
    const scan = scanDurations('notify without undue delay')
    expect(scan.durations).toEqual([])
    expect(scan.vague).toEqual(['without undue delay'])
  })

  it('ignores version numbers and key sizes', () => {
    expect(scanDurations('TLS 1.2 and AES-256').durations).toEqual([])
  })
})

describe('questionnaire detection', () => {
  const csv = [
    'Ref,Control question,Response,Notes',
    ',Section 1: Security,,',
    'S1,Do you encrypt customer data at rest?,,',
    'S2,Describe your incident response process.,Yes,',
    'S3,How long are logs retained?,,',
  ].join('\n')
  const table = csvToTable('t', 'q.csv', csv)

  it('finds the question, answer and id columns and the header row', () => {
    expect(detectTable(table)).toEqual({
      sheet: 'CSV',
      headerRow: 1,
      questionCol: 1,
      answerCol: 2,
      idCol: 0,
    })
  })

  it('extracts questions with sections and keeps existing answers', () => {
    const m = detectTable(table)
    if (!m) throw new Error('no mapping')
    const qs = extractQuestions(table, m)
    expect(qs.map((q) => q.qid)).toEqual(['S1', 'S2', 'S3'])
    expect(qs[0]?.section).toBe('Section 1: Security')
    expect(qs[1]?.existingAnswer).toBe('Yes')
  })
})

describe('classifyTopic', () => {
  it('uses keyword rules', () => {
    expect(classifyTopic('Is data encrypted at rest?', topics.topics).topic).toBe('T11')
    expect(classifyTopic('Do you hold ISO 27001?', topics.topics).topic).toBe('T16')
  })
  it('falls back to Other', () => {
    expect(classifyTopic('What is your favourite colour?', topics.topics).topic).toBe(OTHER_TOPIC)
  })
})

describe('findDurationConflict', () => {
  const dpa = makeDoc('dpa', 'DPA', 'dpa', [
    '1. Breach\nNorthwind shall notify the Customer of a personal data breach within forty-eight (48) hours.',
  ])
  const sec = makeDoc('sec', 'Security policy', 'security', [
    '7. Incidents\nWe notify customers of a personal data breach within twenty-four (24) hours.',
  ])
  const chunks = [...chunkDoc(dpa), ...chunkDoc(sec)]
  const names = { dpa: 'DPA', sec: 'Security policy' }

  it('flags two documents with different numbers and verifies both quotes', () => {
    const ev = findDurationConflict(
      'Within how many hours do you notify a personal data breach?',
      chunks,
      names,
    )
    expect(ev?.map((e) => e.docName).sort()).toEqual(['DPA', 'Security policy'])
    expect(ev?.every((e) => e.verified)).toBe(true)
  })

  it('does not flag questions that do not ask about time', () => {
    expect(asksAboutTime('Do you notify customers of breaches?')).toBe(false)
    expect(
      findDurationConflict('Do you notify customers of a personal data breach?', chunks, names),
    ).toBeNull()
  })
})

describe('rule engine without AI', () => {
  const rule = art28.rules.find((r) => r.id === 'A28-3-h')
  if (!rule) throw new Error('rule missing')
  const doc = makeDoc('d', 'DPA', 'dpa', [
    '11. Audits\nThe processor shall allow for and contribute to audits, including inspections, conducted by the controller or an auditor it mandates.',
  ])
  const chunks = chunkDoc(doc)

  it('never returns FOUND on a hint match alone', () => {
    expect(evaluateRuleNoAi(rule, chunks, { d: 'DPA' }).status).toBe('PARTIAL')
  })

  it('returns NOT_FOUND with the rule severity when nothing matches', () => {
    const r = evaluateRuleNoAi(
      rule,
      chunkDoc(
        makeDoc('e', 'DPA', 'dpa', [
          '1. Fees\nFees are payable monthly in advance by the customer.',
        ]),
      ),
      {},
    )
    expect(r.status).toBe('NOT_FOUND')
    expect(r.severity).toBe('HIGH')
  })

  it('confirms by user selection only when the quote is verbatim', () => {
    const r = evaluateRuleNoAi(rule, chunks, { d: 'DPA' })
    const chunk = chunks[0]
    if (!chunk) throw new Error('no chunk')
    expect(confirmBySelection(r, chunk, 'allow for and contribute to audits', 'DPA').status).toBe(
      'FOUND',
    )
    expect(confirmBySelection(r, chunk, 'allows unlimited audits at any time', 'DPA').status).toBe(
      'PARTIAL',
    )
  })

  it('notes incorporation by reference', () => {
    const c = chunkDoc(
      makeDoc('i', 'DPA', 'dpa', [
        '5. Security\nThe processor takes all measures required pursuant to Article 32, set out in Annex 2, which is incorporated by reference.',
      ]),
    )
    const sec = art28.rules.find((x) => x.id === 'A28-3-c')
    if (!sec) throw new Error('rule missing')
    expect(evaluateRuleNoAi(sec, c, {}).incorporatedByReference).toBe(true)
  })
})
