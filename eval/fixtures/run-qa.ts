import { readFileSync, writeFileSync } from 'node:fs'
import { chromium, type Page } from '@playwright/test'
import ExcelJS from 'exceljs'
import { analyzeClient } from '../../src/app/analyzeClient.ts'
import { chunkDoc } from '../../src/core/chunk/chunker.ts'
import { csvToTable } from '../../src/core/ingest/sheet.ts'
import { makeDoc } from '../../src/core/ingest/text.ts'
import { detectTable } from '../../src/core/qa/detect.ts'
import { evaluateAllNoAi } from '../../src/core/rules/engine.ts'
import { art28 } from '../../src/data/load.ts'
import en from '../../src/i18n/en.json'

// SPRINT2 task 4: runs every QA fixture through the real UI (built site + vite preview) and writes
// docs/qa/results.json and one screenshot per scenario. Usage: npx tsx eval/fixtures/run-qa.ts [baseUrl]
const BASE = process.argv[2] ?? 'http://localhost:4173/'
const OUT = 'eval/fixtures/out/'
const counts = Object.fromEntries(
  readFileSync(`${OUT}counts.txt`, 'utf8')
    .split('\n')
    .map((l) => l.split('=') as [string, string]),
)

type Scenario = {
  id: string
  mode: 'company' | 'client'
  dpa?: string
  table?: string
  expect: string
  check: (page: Page) => Promise<string | null>
}
type Result = {
  id: string
  files: string
  expect: string
  actual: string
  pass: boolean
  seconds: number
}

/** Statuses the core engine gives the .md version of a DPA: what the UI should show for other formats. */
function baseline(md: string) {
  const doc = makeDoc('dpa', 'x', 'dpa', [readFileSync(`${OUT}${md}`, 'utf8')])
  const r = evaluateAllNoAi(art28.rules, chunkDoc(doc), { dpa: 'x' })
  return { notFound: r.filter((f) => f.status === 'NOT_FOUND').length, total: r.length }
}

async function legend(page: Page, status: string): Promise<number> {
  const text =
    (await page
      .getByText(new RegExp(`^${status} \\d+$`))
      .first()
      .textContent()) ?? ''
  return Number(/(\d+)$/.exec(text)?.[1] ?? NaN)
}

function dpaScenario(file: string, md: string, note = ''): Scenario {
  const b = baseline(md)
  return {
    id: file.replace(/^edge-/, 'dpa-').replace(/\.\w+$/, '') + '-' + file.split('.').pop(),
    mode: 'company',
    dpa: file,
    expect: `${b.notFound} of ${b.total} Art. 28 elements not found, same as the .md text${note}`,
    check: async (page) => {
      const nf = await legend(page, en['status.NOT_FOUND'])
      return nf === b.notFound ? null : `UI shows ${nf} not found`
    },
  }
}

const vendorBaseline = () => {
  const table = csvToTable('q', 'a.csv', readFileSync('eval/packs/pack-d/answers.csv', 'utf8'))
  return analyzeClient({
    dpa: makeDoc('dpa', 'd', 'dpa', [readFileSync('eval/packs/pack-d/docs/dpa.md', 'utf8')]),
    table,
    mapping: detectTable(table),
    answersName: 'a',
  }).consistency.length
}

function questionnaireScenario(file: string, questions: number): Scenario {
  return {
    id: file.replace(/\.\w+$/, '') + '-' + file.split('.').pop(),
    mode: 'company',
    dpa: 'dpa-complete.md',
    table: file,
    expect: `${questions} questions found; export keeps every original cell outside the answer column`,
    check: async (page) => {
      const listed = await page.locator('[data-item-id]').count()
      return listed > 0 ? null : 'no review items'
    },
  }
}

function edge(
  file: string,
  key: keyof typeof en,
  mode: 'company' | 'client' = 'company',
): Scenario {
  return {
    id: file.replace(/\.\w+$/, ''),
    mode,
    dpa: file.endsWith('.csv') ? undefined : file,
    table: file.endsWith('.csv') ? file : undefined,
    expect: `message: "${en[key]}"`,
    check: async () => null,
  }
}

const VENDOR = vendorBaseline()
const SCENARIOS: Scenario[] = [
  dpaScenario('dpa-complete.md', 'dpa-complete.md'),
  dpaScenario('dpa-complete.txt', 'dpa-complete.md'),
  dpaScenario('dpa-complete.pdf', 'dpa-complete.md'),
  dpaScenario('dpa-complete.docx', 'dpa-complete.md'),
  dpaScenario('dpa-defects.pdf', 'dpa-defects.md', ' (confidentiality and deletion removed)'),
  dpaScenario('dpa-defects.docx', 'dpa-defects.md', ' (confidentiality and deletion removed)'),
  dpaScenario('dpa-by-reference.docx', 'dpa-by-reference.md'),
  dpaScenario('dpa-decoy-audit.pdf', 'dpa-decoy-audit.md'),
  dpaScenario('dpa-non-english.docx', 'dpa-non-english.md'),
  dpaScenario('edge-300-pages.pdf', 'dpa-complete.md', ' (300 pages, at the limit)'),
  questionnaireScenario('questionnaire-20.xlsx', Number(counts['questionnaire-20.xlsx'])),
  questionnaireScenario('questionnaire-60.xlsx', Number(counts['questionnaire-60.xlsx'])),
  questionnaireScenario('questionnaire-500.xlsx', Number(counts['questionnaire-500.xlsx'])),
  questionnaireScenario('questionnaire-60-comma.csv', 60),
  questionnaireScenario('questionnaire-60-semicolon.csv', 60),
  questionnaireScenario('questionnaire-1999.csv', 1999),
  {
    id: 'vendor-docx-xlsx',
    mode: 'client',
    dpa: 'vendor-dpa.docx',
    table: 'vendor-answers.xlsx',
    expect: `${VENDOR} contradictions, as on the .md and .csv sample`,
    check: async (page) => {
      const n = await page
        .getByRole('list', { name: 'Answers vs DPA' })
        .getByRole('listitem')
        .count()
      return n === VENDOR ? null : `UI shows ${n}`
    },
  },
  {
    id: 'vendor-pdf-xlsx',
    mode: 'client',
    dpa: 'vendor-dpa.pdf',
    table: 'vendor-answers.xlsx',
    expect: `${VENDOR} contradictions, as on the .md and .csv sample`,
    check: async (page) => {
      const n = await page
        .getByRole('list', { name: 'Answers vs DPA' })
        .getByRole('listitem')
        .count()
      return n === VENDOR ? null : `UI shows ${n}`
    },
  },
  edge('edge-scanned.pdf', 'ingest.error.scanned_pdf'),
  edge('edge-password.pdf', 'ingest.error.password'),
  edge('edge-corrupt.docx', 'ingest.error.corrupt'),
  edge('edge-empty.pdf', 'ingest.error.empty'),
  edge('edge-301-pages.pdf', 'ingest.error.too_many_pages'),
  edge('edge-26mb.txt', 'ingest.error.too_large'),
  edge('edge-old.doc', 'ingest.error.unsupported_type'),
  edge('edge-file.pages', 'ingest.error.unsupported_type'),
  edge('questionnaire-2000.csv', 'ingest.error.too_many_rows'),
]

async function cellsUnchanged(original: string, exported: string, answerCol: number | null) {
  const a = new ExcelJS.Workbook()
  const b = new ExcelJS.Workbook()
  await a.xlsx.readFile(original)
  await b.xlsx.readFile(exported)
  let diffs = 0
  a.eachSheet((ws) => {
    const other = b.getWorksheet(ws.name)
    ws.eachRow({ includeEmpty: true }, (row, r) =>
      row.eachCell({ includeEmpty: true }, (cell, c) => {
        if (c === answerCol) return
        if (JSON.stringify(cell.value) !== JSON.stringify(other?.getCell(r, c).value)) diffs++
      }),
    )
  })
  return diffs
}

async function run(page: Page, s: Scenario): Promise<Result> {
  const start = Date.now()
  const files = [s.dpa, s.table].filter(Boolean).join(' + ')
  const done = (actual: string, pass: boolean): Result => ({
    id: s.id,
    files,
    expect: s.expect,
    actual,
    pass,
    seconds: Math.round((Date.now() - start) / 100) / 10,
  })
  await page.goto(BASE)
  await page
    .getByRole('button', {
      name: s.mode === 'client' ? /I'm reviewing a vendor/ : /I'm answering a questionnaire/,
    })
    .click()
  const inputs = page.locator('input[type="file"]')
  if (s.dpa) await inputs.nth(0).setInputFiles(`${OUT}${s.dpa}`)
  if (s.table) await inputs.nth(s.mode === 'client' ? 1 : 4).setInputFiles(`${OUT}${s.table}`)
  if (s.mode === 'company' && s.table && !s.dpa)
    await inputs.nth(0).setInputFiles(`${OUT}dpa-complete.md`)
  if (s.id.startsWith('edge') || s.id === 'questionnaire-2000') {
    const msg = s.expect.slice(10, -1)
    const ok = await page
      .getByText(msg, { exact: false })
      .first()
      .waitFor({ timeout: 30000 })
      .then(() => true)
      .catch(() => false)
    await page.screenshot({ path: `docs/qa/${s.id}.png` })
    return done(ok ? 'message shown, no crash' : 'expected message not shown', ok)
  }
  if (s.table) {
    const found = page.getByText(/\d+ questions found/)
    await found.waitFor({ timeout: 30000 })
    const text = (await found.textContent()) ?? ''
    const n = Number(/(\d+)/.exec(text)?.[1])
    const want = Number(/^(\d+)/.exec(s.expect)?.[1] ?? n)
    if (s.mode === 'company' && n !== want) {
      await page.screenshot({ path: `docs/qa/${s.id}.png` })
      return done(`${n} questions found`, false)
    }
  }
  await page.getByRole('button', { name: 'Check documents' }).click()
  await page.getByRole('tablist').waitFor({ timeout: 120000 })
  const problem = await s.check(page)
  await page.screenshot({ path: `docs/qa/${s.id}.png` })
  const notes: string[] = []
  // HTML report must download and reopen.
  const openMenu = () =>
    page.locator('details.menu').evaluate((d) => ((d as HTMLDetailsElement).open = true))
  await openMenu()
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Report (HTML, printable)' }).click(),
  ])
  const report = `${OUT}report-${s.id}.html`
  await dl.saveAs(report)
  const html = readFileSync(report, 'utf8')
  if (!html.includes('Trust Pack Checker report')) notes.push('report did not reopen')
  // XLSX export keeps the original cells.
  if (s.mode === 'company' && s.table) {
    await openMenu()
    const [x] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Filled questionnaire/ }).click(),
    ])
    const out = `${OUT}export-${s.id}.xlsx`
    await x.saveAs(out)
    if (s.table.endsWith('.xlsx')) {
      const diffs = await cellsUnchanged(`${OUT}${s.table}`, out, 4)
      if (diffs > 0) notes.push(`${diffs} original cells changed in the export`)
      else notes.push('export: original cells unchanged')
      const filled = new ExcelJS.Workbook()
      await filled.xlsx.readFile(out)
      // Results go into new columns after the original ones; count rows with a status.
      const ws = filled.getWorksheet('Questions')
      let statusCol = 0
      ws?.eachRow((row) =>
        row.eachCell((c, i) => {
          if (c.value === 'Status') statusCol = i
        }),
      )
      let written = 0
      if (statusCol)
        ws?.getColumn(statusCol).eachCell((c) => (c.value && c.value !== 'Status' ? written++ : 0))
      notes.push(`${written} rows got a status in new columns`)
    } else notes.push('export: XLSX copy created from CSV')
  }
  const actual = [problem ?? 'as expected', ...notes].join('; ')
  return done(actual, problem === null && !notes.some((n) => /cells changed|did not/.test(n)))
}

async function main() {
  const exec = process.env.PW_CHROMIUM_PATH
  const browser = await chromium.launch(exec ? { executablePath: exec } : {})
  const results: Result[] = []
  for (const s of SCENARIOS) {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      acceptDownloads: true,
      reducedMotion: 'reduce',
    })
    const page = await ctx.newPage()
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    try {
      const r = await run(page, s)
      if (errors.length) {
        r.actual += `; page error: ${errors[0]}`
        r.pass = false
      }
      results.push(r)
    } catch (e) {
      await page.screenshot({ path: `docs/qa/${s.id}.png` }).catch(() => undefined)
      results.push({
        id: s.id,
        files: [s.dpa, s.table].filter(Boolean).join(' + '),
        expect: s.expect,
        actual: `crash or timeout: ${(e as Error).message.split('\n')[0]}`,
        pass: false,
        seconds: 0,
      })
    }
    process.stdout.write(
      `${results.at(-1)?.pass ? 'PASS' : 'FAIL'} ${s.id}: ${results.at(-1)?.actual}\n`,
    )
    await ctx.close()
  }
  await browser.close()
  writeFileSync('docs/qa/results.json', `${JSON.stringify(results, null, 2)}\n`)
}

void main()
