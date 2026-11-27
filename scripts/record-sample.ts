// npm run record-sample: records one AI run on the synthetic Pack C sample for the landing demo.
// Needs ANTHROPIC_API_KEY in this shell (never in chat, never committed). Writes src/data/ai-sample.json.
import { readFileSync, writeFileSync } from 'node:fs'
import { draftWithAi } from '../src/app/aiRun.ts'
import { analyzeCompany } from '../src/app/analyze.ts'
import { toRecording } from '../src/app/recordedSample.ts'
import { csvToTable } from '../src/core/ingest/csv.ts'
import { makeDoc } from '../src/core/ingest/text.ts'
import { createAnthropicProvider } from '../src/core/llm/anthropic.ts'
import { PILOT_MODELS } from '../src/core/llm/models.ts'
import { PROMPT_VERSION } from '../src/core/llm/prompts.ts'
import { detectTable } from '../src/core/qa/detect.ts'

const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
if (!apiKey) {
  process.stderr.write('AI evaluation pending: ANTHROPIC_API_KEY is not set, nothing recorded.\n')
  process.exit(2)
}
const model = process.argv[2] ?? PILOT_MODELS[0] ?? 'claude-haiku-5-5'
const dir = 'eval/packs/pack-c'
const read = (f: string) => readFileSync(`${dir}/${f}`, 'utf8')
// Same ids and names as the in-app sample (src/app/sample.ts), so chunk ids match on load.
const docs = [
  makeDoc('dpa', 'Northwind DPA (sample)', 'dpa', [read('docs/dpa.md')]),
  makeDoc('security', 'Northwind security policy (sample)', 'security', [
    read('docs/security-policy.md'),
  ]),
  makeDoc('privacy', 'Northwind privacy notice (sample)', 'privacy', [
    read('docs/privacy-policy.md'),
  ]),
]
const table = csvToTable(
  'questionnaire',
  'Customer questionnaire (sample).csv',
  read('questionnaire.csv'),
)
const analysis = analyzeCompany({ docs, table, mapping: detectTable(table) })
const run = await draftWithAi(analysis, docs, createAnthropicProvider({ apiKey, model }), {
  signal: new AbortController().signal,
  onProgress: (done, total) => process.stdout.write(`\r${done}/${total}`),
})
const rec = toRecording(run.analysis, {
  date: new Date().toISOString().slice(0, 10),
  model,
  promptVersion: PROMPT_VERSION,
})
writeFileSync('src/data/ai-sample.json', `${JSON.stringify(rec, null, 2)}\n`)
process.stdout.write(
  `\nRecorded ${Object.keys(rec.answers).length} answers, ${run.failed} failed calls.\n`,
)
