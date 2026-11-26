// Client mode eval (SPEC 13.2, Pack D): planted contradictions between a vendor's answers and its DPA.
// The key is read only here; the engine never sees it.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chunkDoc } from '../src/core/chunk/chunker.ts'
import { vendorAnswers } from '../src/core/consistency/answers.ts'
import { checkConsistency } from '../src/core/consistency/engine.ts'
import type { ConsistencyFinding } from '../src/core/consistency/types.ts'
import { csvToTable } from '../src/core/ingest/sheet.ts'
import { makeDoc } from '../src/core/ingest/text.ts'
import { normalizeForQuote } from '../src/core/llm/verifyQuote.ts'
import { detectTable } from '../src/core/qa/detect.ts'
import { PACKS_DIR } from './packs.ts'
import { record } from './published.ts'

export type ClientKey = {
  pack: string
  mode: 'client'
  holdout?: boolean
  dpa: string
  answers: string
  contradictions: {
    id: string
    ruleId: string
    qid: string
    numeric: boolean
    expected: 'CONFLICT' | 'PARTIAL'
    answerQuote: string
    dpaQuote: string
  }[]
  clean: string[]
  unbacked: { qid: string; claim: string }[]
  injections: { doc: string; text: string }[]
}
type Gate = { name: string; passed: boolean; detail: string }

export function isClientPack(name: string): boolean {
  const key = JSON.parse(readFileSync(join(PACKS_DIR, name, 'key', 'key.json'), 'utf8')) as object
  return 'contradictions' in key
}

export function runClientPack(name: string): { key: ClientKey; findings: ConsistencyFinding[] } {
  const dir = join(PACKS_DIR, name)
  const key = JSON.parse(readFileSync(join(dir, 'key', 'key.json'), 'utf8')) as ClientKey
  const doc = makeDoc('dpa', 'Vendor DPA', 'dpa', [readFileSync(join(dir, key.dpa), 'utf8')])
  const table = csvToTable('answers', key.answers, readFileSync(join(dir, key.answers), 'utf8'))
  const mapping = detectTable(table)
  const answers = mapping ? vendorAnswers(table, mapping, 'answers') : []
  const findings = checkConsistency(answers, chunkDoc(doc), {
    dpa: 'Vendor DPA',
    answers: 'Vendor answers',
  })
  return { key, findings }
}

const has = (quote: string, part: string) =>
  normalizeForQuote(quote).includes(normalizeForQuote(part))
const pct = (n: number, d: number) => (d === 0 ? 100 : Math.round((n / d) * 1000) / 10)

export function evalClientPack(name: string): Gate[] {
  const { key, findings } = runClientPack(name)
  const detected = key.contradictions.filter((c) =>
    findings.some(
      (f) =>
        f.qid === c.qid &&
        f.ruleId === c.ruleId &&
        f.status === c.expected &&
        has(f.answer.quote, c.answerQuote) &&
        f.contract.some((e) => has(e.quote, c.dpaQuote)),
    ),
  )
  const missed = key.contradictions.filter((c) => !detected.includes(c)).map((c) => c.id)
  const numeric = key.contradictions.filter((c) => c.numeric)
  const numericHit = numeric.filter((c) => detected.includes(c)).length
  const falseFlags = findings.filter((f) => key.clean.includes(f.qid)).map((f) => f.id)
  const unbackedHit = key.unbacked.filter((u) =>
    findings.some(
      (f) => f.qid === u.qid && f.kind === 'claim-unbacked' && f.detail.claim === u.claim,
    ),
  ).length
  const unverified = findings.filter(
    (f) => !f.answer.verified || f.contract.some((e) => !e.verified),
  ).length

  // The headline vendor number counts only held-out packs; packs used to build the checks are reported apart.
  record(
    key.holdout ? 'vendor' : 'vendorBuilt',
    detected.length,
    key.contradictions.length,
    key.contradictions.filter((c) => !detected.includes(c)).map((c) => `${name} ${c.qid}`),
  )
  record(
    'vendorClean',
    key.clean.length -
      new Set(findings.filter((f) => key.clean.includes(f.qid)).map((f) => f.qid)).size,
    key.clean.length,
    [...new Set(findings.filter((f) => key.clean.includes(f.qid)).map((f) => `${name} ${f.qid}`))],
  )
  const gated = !key.holdout
  const note = gated ? '' : ' (held out, not gated)'
  console.log(`\n[${name}] client mode, ${findings.length} findings`)
  console.log(
    `  contradictions found: ${detected.length}/${key.contradictions.length} = ${pct(detected.length, key.contradictions.length)}%${missed.length ? `  missed: ${missed.join(', ')}` : ''}`,
  )
  console.log(`  numeric contradictions found: ${numericHit}/${numeric.length}`)
  console.log(
    `  findings on consistent rows: ${falseFlags.length}${falseFlags.length ? `  ${falseFlags.join(', ')}` : ''}`,
  )
  console.log(`  claims not in the contract found: ${unbackedHit}/${key.unbacked.length}`)
  return [
    {
      name: `${name}: numeric contradiction recall = 100%${note}`,
      passed: !gated || numericHit === numeric.length,
      detail: `${numericHit}/${numeric.length}`,
    },
    {
      name: `${name}: every finding quotes both sides verbatim`,
      passed: unverified === 0,
      detail: String(unverified),
    },
    {
      name: `${name}: no findings on consistent answers${note}`,
      passed: !gated || falseFlags.length === 0,
      detail: String(falseFlags.length),
    },
  ]
}
