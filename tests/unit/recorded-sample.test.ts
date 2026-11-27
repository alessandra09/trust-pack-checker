import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { draftWithAi } from '../../src/app/aiRun.ts'
import { analyzeCompany } from '../../src/app/analyze.ts'
import { RECORDED_LABEL, applyRecording, toRecording } from '../../src/app/recordedSample.ts'
import { csvToTable } from '../../src/core/ingest/csv.ts'
import { makeDoc } from '../../src/core/ingest/text.ts'
import { createMockProvider } from '../../src/core/llm/mock.ts'
import { detectTable } from '../../src/core/qa/detect.ts'

const dir = 'eval/packs/pack-c'
const read = (f: string) => readFileSync(`${dir}/${f}`, 'utf8')
const docs = [
  makeDoc('dpa', 'Northwind DPA (sample)', 'dpa', [read('docs/dpa.md')]),
  makeDoc('security', 'Northwind security policy (sample)', 'security', [
    read('docs/security-policy.md'),
  ]),
]
const table = csvToTable('questionnaire', 'q.csv', read('questionnaire.csv'))
const base = analyzeCompany({ docs, table, mapping: detectTable(table) })
const meta = { date: '2026-11-27', model: 'mock', promptVersion: 'test' }

async function recording() {
  const run = await draftWithAi(base, docs, createMockProvider(), {
    signal: new AbortController().signal,
    onProgress: () => undefined,
  })
  return { run, rec: toRecording(run.analysis, meta) }
}

describe('recorded AI sample', () => {
  it('is labelled as a recorded run and reproduces the run when every quote checks out', async () => {
    const { run, rec } = await recording()
    expect(rec.label).toBe(RECORDED_LABEL)
    expect(Object.keys(rec.answers).length).toBeGreaterThan(0)
    const applied = applyRecording(base, rec)
    for (const qid of Object.keys(rec.answers))
      expect(applied.answers[qid]?.status).toBe(run.analysis.answers[qid]?.status)
  })

  it('re-verifies every quote on load: an edited quote cannot stay found', async () => {
    const { rec } = await recording()
    const [qid, item] = Object.entries(rec.answers).find(([, x]) => x.status === 'FOUND') ?? []
    expect(qid && item).toBeTruthy()
    if (!qid || !item) return
    const tampered = {
      ...rec,
      answers: {
        ...rec.answers,
        [qid]: {
          ...item,
          evidence: item.evidence.map((e) => ({
            ...e,
            quote: `${e.quote} We are ISO 27001 certified.`,
          })),
        },
      },
    }
    const applied = applyRecording(base, tampered)
    expect(applied.answers[qid]?.status).toBe('NEEDS_HUMAN')
    expect(applied.answers[qid]?.evidence).toEqual([])
  })

  it('npm run record-sample without a key records nothing and says AI evaluation is pending', () => {
    let out = ''
    try {
      execFileSync(
        'npx',
        ['tsx', '--tsconfig', 'tsconfig.prerender.json', 'scripts/record-sample.ts'],
        {
          env: { ...process.env, ANTHROPIC_API_KEY: '' },
          stdio: 'pipe',
        },
      )
    } catch (err) {
      out = String((err as { stderr?: Buffer }).stderr ?? '')
    }
    expect(out).toContain('AI evaluation pending')
  }, 30_000)
})
