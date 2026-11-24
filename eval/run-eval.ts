// Gold-set evaluation (SPEC 13.2). Prints metrics and exits non-zero when a gate fails.
// M1: retrieval of the right passage for each Art. 28 rule. Rule statuses and answers arrive in M2.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { art28 } from '../src/data/load.ts'
import { findRuleCandidates } from '../src/core/rules/candidates.ts'
import { verifyQuote } from '../src/core/llm/verifyQuote.ts'
import { PACKS_DIR, listPacks, loadPack, type LoadedPack } from './packs.ts'

type Gate = { name: string; passed: boolean; detail: string }
const gates: Gate[] = []
const pct = (n: number, d: number) => (d === 0 ? 100 : Math.round((n / d) * 1000) / 10)

function retrieval(pack: LoadedPack) {
  const misses: string[] = []
  let total = 0
  for (const rule of art28.rules) {
    const k = pack.key.rules[rule.id]
    if (!k?.quote) continue
    total++
    const quote = k.quote
    const hit = findRuleCandidates(rule, pack.chunks).some((c) => verifyQuote(quote, c.chunk.text))
    if (!hit) misses.push(rule.id)
  }
  return { total, hits: total - misses.length, misses }
}

// Preview of the no-AI missing-clause metric (gated from M2): a missing clause should have no candidate passage.
function missingClauseSignal(pack: LoadedPack) {
  const missing = pack.key.defects.filter((d) => d.type === 'missing')
  const detected = missing.filter((d) => {
    const rule = art28.rules.find((r) => r.id === d.ruleId)
    return rule !== undefined && findRuleCandidates(rule, pack.chunks).length === 0
  })
  return { total: missing.length, detected: detected.length }
}

const packs = listPacks()
console.log(`Trust Pack Checker eval, mode: no-ai, packs: ${packs.join(', ') || 'none'}`)
gates.push({
  name: 'Every pack has SYNTHETIC.md',
  passed: packs.every((p) => existsSync(join(PACKS_DIR, p, 'SYNTHETIC.md'))),
  detail: `${packs.length} pack(s)`,
})

for (const name of packs) {
  const pack = loadPack(name)
  const r = retrieval(pack)
  const rate = pct(r.hits, r.total)
  console.log(`\n[${name}] ${pack.chunks.length} chunks`)
  console.log(
    `  rule passage retrieval (top-3): ${r.hits}/${r.total} = ${rate}%${r.misses.length ? `  missed: ${r.misses.join(', ')}` : ''}`,
  )
  gates.push({
    name: `${name}: rule passage retrieval >= 90%`,
    passed: rate >= 90,
    detail: `${rate}%`,
  })
  const m = missingClauseSignal(pack)
  if (m.total > 0)
    console.log(
      `  missing-clause defects with no candidate (preview, gated in M2): ${m.detected}/${m.total}`,
    )
}

console.log('')
for (const g of gates) console.log(`${g.passed ? 'PASS' : 'FAIL'}  ${g.name} (${g.detail})`)
if (gates.some((g) => !g.passed)) process.exit(1)
