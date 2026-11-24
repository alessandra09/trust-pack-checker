// Gold-set evaluation (SPEC 13.2). M0: discovers packs and enforces the manifest rule.
// Metrics and gates are added in M1-M3 as the engine is built. Exits non-zero on any gate failure.
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const PACKS_DIR = 'eval/packs'

type GateResult = { name: string; passed: boolean; detail: string }

function listPacks(): string[] {
  if (!existsSync(PACKS_DIR)) return []
  return readdirSync(PACKS_DIR).filter((n) => statSync(join(PACKS_DIR, n)).isDirectory())
}

const packs = listPacks()
const gates: GateResult[] = [
  {
    name: 'Every pack has SYNTHETIC.md',
    passed: packs.every((p) => existsSync(join(PACKS_DIR, p, 'SYNTHETIC.md'))),
    detail: `${packs.length} pack(s)`,
  },
]

console.log(`Trust Pack Checker eval, mode: ${process.env.ANTHROPIC_API_KEY ? 'ai' : 'no-ai'}`)
console.log(`Packs: ${packs.length === 0 ? 'none yet' : packs.join(', ')}`)
for (const g of gates) console.log(`${g.passed ? 'PASS' : 'FAIL'}  ${g.name} (${g.detail})`)

if (gates.some((g) => !g.passed)) process.exit(1)
