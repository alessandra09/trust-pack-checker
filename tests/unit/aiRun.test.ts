import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { analyzeCompany } from '../../src/app/analyze.ts'
import { draftWithAi, planCost } from '../../src/app/aiRun.ts'
import { csvToTable } from '../../src/core/ingest/sheet.ts'
import { makeDoc } from '../../src/core/ingest/text.ts'
import { LlmHttpError, type LLMProvider } from '../../src/core/llm/provider.ts'
import { detectTable } from '../../src/core/qa/detect.ts'

const dir = 'eval/packs/pack-c'
const docs = [
  makeDoc('dpa', 'dpa.md', 'dpa', [readFileSync(`${dir}/docs/dpa.md`, 'utf8')]),
  makeDoc('sec', 'security-policy.md', 'security', [
    readFileSync(`${dir}/docs/security-policy.md`, 'utf8'),
  ]),
]
const table = csvToTable('q', 'q.csv', readFileSync(`${dir}/questionnaire.csv`, 'utf8'))
const mapping = detectTable(table)
const analysis = analyzeCompany({ docs, table, mapping })

describe('AI run in the app', () => {
  it('estimates only the calls that would be sent', () => {
    const est = planCost(analysis, docs, 'claude-haiku-5-5')
    expect(est.calls).toBeGreaterThan(0)
    expect(est.calls).toBeLessThan(analysis.questions.length + analysis.findings.length)
    expect(est.highUsd).toBeGreaterThan(est.lowUsd)
  })

  it('stops after a rejected key and keeps the no-AI results', async () => {
    let calls = 0
    const provider: LLMProvider = {
      model: 'fake',
      complete: () => {
        calls++
        return Promise.reject(new LlmHttpError(401, 'bad key'))
      },
    }
    const res = await draftWithAi(analysis, docs, provider, {
      signal: new AbortController().signal,
      onProgress: () => undefined,
    })
    expect(res.authError).toBe(true)
    expect(calls).toBeLessThanOrEqual(3)
    expect(res.analysis.answers).toEqual(analysis.answers)
  })

  it('never sends file names to the model', async () => {
    const sent: string[] = []
    const provider: LLMProvider = {
      model: 'fake',
      complete: (req) => {
        sent.push(req.user)
        return Promise.resolve({
          text: '{}',
          model: 'fake',
          usage: { inputTokens: 1, outputTokens: 1 },
        })
      },
    }
    await draftWithAi(analysis, docs, provider, {
      signal: new AbortController().signal,
      onProgress: () => undefined,
    })
    expect(sent.length).toBeGreaterThan(0)
    expect(sent.some((s) => s.includes('security-policy.md') || s.includes('dpa.md'))).toBe(false)
  })
})
