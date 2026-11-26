// Gold-set evaluation (SPEC 13.2). Prints metrics and exits non-zero when a gate fails.
// Covers rule passage retrieval and no-AI rule statuses; questionnaire answers (Pack C) follow.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { art28 } from '../src/data/load.ts'
import { findRuleCandidates } from '../src/core/rules/candidates.ts'
import { evaluateAllNoAi, type RuleResult } from '../src/core/rules/engine.ts'
import { verifyQuote } from '../src/core/llm/verifyQuote.ts'
import { PACKS_DIR, isQuestionnairePack, listPacks, loadPack, type LoadedPack } from './packs.ts'
import { evalQuestionnairePack } from './eval-questionnaire.ts'
import { evalClientPack, isClientPack } from './eval-client.ts'
import { publishedMismatches, record } from './published.ts'

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

// No-AI rule statuses (SPEC 13.2). A missing-clause defect is detected only when its rule is NOT_FOUND.
function ruleGates(pack: LoadedPack) {
  const results = evaluateAllNoAi(art28.rules, pack.chunks, { [pack.doc.id]: pack.doc.name })
  const byId = new Map<string, RuleResult>(results.map((r) => [r.ruleId, r]))
  const unverifiedFound = results.filter(
    (r) => r.status === 'FOUND' && !r.evidence.some((e) => e.verified),
  ).length
  const missing = pack.key.defects.filter((d) => d.type === 'missing')
  const detectedList = missing.filter((d) => byId.get(d.ruleId)?.status === 'NOT_FOUND')
  const detected = detectedList.length
  const missedMissing = missing.filter((d) => !detectedList.includes(d)).map((d) => d.ruleId)
  const presentCore = art28.rules.filter((r) => r.class === 'core' && pack.key.rules[r.id]?.quote)
  const falseAlarms = presentCore
    .filter((r) => byId.get(r.id)?.status === 'NOT_FOUND')
    .map((r) => r.id)
  const decoys = pack.key.defects.filter((d) => d.type === 'decoy')
  const fooled = decoys.filter((d) => byId.get(d.ruleId)?.status !== 'NOT_FOUND')
  const decoyFooled = fooled.length
  return {
    unverifiedFound,
    missing: missing.length,
    detected,
    falseAlarms,
    presentCore: presentCore.length,
    decoys: decoys.length,
    decoyFooled,
    missedMissing,
    fooledRules: fooled.map((d) => d.ruleId),
  }
}

const packs = listPacks()
console.log(`Trust Pack Checker eval, mode: no-ai, packs: ${packs.join(', ') || 'none'}`)
gates.push({
  name: 'Every pack has SYNTHETIC.md',
  passed: packs.every((p) => existsSync(join(PACKS_DIR, p, 'SYNTHETIC.md'))),
  detail: `${packs.length} pack(s)`,
})

for (const name of packs) {
  if (isClientPack(name)) {
    gates.push(...evalClientPack(name))
    continue
  }
  if (isQuestionnairePack(name)) {
    gates.push(...evalQuestionnairePack(name))
    continue
  }
  const pack = loadPack(name)
  // Held-out packs were written after the engine and are not tuned against: measured and published, not gated.
  const gated = !pack.key.holdout
  const r = retrieval(pack)
  const rate = pct(r.hits, r.total)
  console.log(`\n[${name}] ${pack.chunks.length} chunks`)
  console.log(
    `  rule passage retrieval (top-3): ${r.hits}/${r.total} = ${rate}%${r.misses.length ? `  missed: ${r.misses.join(', ')}` : ''}`,
  )
  gates.push({
    name: `${name}: rule passage retrieval >= 90%${gated ? '' : ' (held out, not gated)'}`,
    passed: !gated || rate >= 90,
    detail: `${rate}%`,
  })
  const g = ruleGates(pack)
  record(
    'missing',
    g.detected,
    g.missing,
    g.missedMissing.map((id) => `${name} ${id}`),
  )
  record(
    'decoys',
    g.decoyFooled,
    g.decoys,
    g.fooledRules.map((id) => `${name} ${id}`),
  )
  console.log(`  FOUND without verified evidence: ${g.unverifiedFound}`)
  gates.push({
    name: `${name}: zero FOUND without verified evidence`,
    passed: g.unverifiedFound === 0,
    detail: String(g.unverifiedFound),
  })
  const fa = g.falseAlarms
  console.log(
    `  core rules present but reported NOT_FOUND: ${fa.length}/${g.presentCore}${fa.length ? `  ${fa.join(', ')}` : ''}`,
  )
  gates.push({
    name: `${name}: no false NOT_FOUND on present core rules${gated ? '' : ' (held out, not gated)'}`,
    passed: !gated || fa.length === 0,
    detail: `${fa.length}`,
  })
  if (g.missing > 0) {
    const recall = pct(g.detected, g.missing)
    console.log(`  no-AI recall of missing-clause defects: ${g.detected}/${g.missing} = ${recall}%`)
    gates.push({
      name: `${name}: no-AI missing-clause recall >= 90%${gated ? '' : ' (held out, not gated)'}`,
      passed: !gated || recall >= 90,
      detail: `${recall}%`,
    })
  }
  if (g.decoys > 0) {
    console.log(`  decoys that satisfied a rule: ${g.decoyFooled}/${g.decoys}`)
    gates.push({
      name: `${name}: decoys do not satisfy rules${gated ? '' : ' (held out, not gated)'}`,
      passed: !gated || g.decoyFooled === 0,
      detail: `${g.decoyFooled}`,
    })
  }
}

const mismatches = publishedMismatches()
gates.push({
  name: 'Landing page numbers match this eval',
  passed: mismatches.length === 0,
  detail: mismatches.join('; ') || 'match',
})

console.log('')
for (const g of gates) console.log(`${g.passed ? 'PASS' : 'FAIL'}  ${g.name} (${g.detail})`)
if (gates.some((g) => !g.passed)) process.exit(1)
