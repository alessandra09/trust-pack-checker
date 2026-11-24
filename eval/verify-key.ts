// Independent benchmark check (SPEC 13.2): re-reads packs and keys and confirms that every keyed quote
// and every planted defect is really in the text. Uses only plain string checks, not app code,
// so a bug in the app cannot make the benchmark agree with itself.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const PACKS = 'eval/packs'
const RULES = JSON.parse(readFileSync('src/data/art28.rules.json', 'utf8')) as {
  rules: { id: string; class: string }[]
}
const ruleIds = new Set(RULES.rules.map((r) => r.id))
const coreIds = RULES.rules.filter((r) => r.class === 'core').map((r) => r.id)

type KeyRule = { expected: string; quote?: string; conflictQuote?: string; defect?: string }
type Defect = {
  id: string
  type: string
  ruleId: string
  mustContain: string[]
  mustNotContain: string[]
}
type Key = { pack: string; document: string; rules: Record<string, KeyRule>; defects: Defect[] }

const flat = (s: string) => s.replace(/\s+/g, ' ').toLowerCase()
const problems: string[] = []
const fail = (pack: string, msg: string) => problems.push(`${pack}: ${msg}`)

const packs = readdirSync(PACKS, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
for (const pack of packs) {
  const keyPath = join(PACKS, pack, 'key', 'key.json')
  if (!existsSync(keyPath)) {
    fail(pack, 'key/key.json missing')
    continue
  }
  const key = JSON.parse(readFileSync(keyPath, 'utf8')) as Key
  const text = flat(readFileSync(join(PACKS, pack, key.document), 'utf8'))

  for (const id of coreIds)
    if (!(id in key.rules)) fail(pack, `core rule ${id} has no expected result`)
  for (const [id, r] of Object.entries(key.rules)) {
    if (!ruleIds.has(id)) fail(pack, `unknown rule ${id}`)
    if (['FOUND', 'PARTIAL', 'CONFLICT'].includes(r.expected) && !r.quote)
      fail(pack, `${id} expects ${r.expected} but has no quote`)
    if (r.quote && !text.includes(flat(r.quote)))
      fail(pack, `${id} quote not in text: "${r.quote}"`)
    if (r.conflictQuote && !text.includes(flat(r.conflictQuote)))
      fail(pack, `${id} conflict quote not in text`)
    if (r.defect && !key.defects.some((d) => d.id === r.defect))
      fail(pack, `${id} points to unknown defect ${r.defect}`)
  }
  for (const d of key.defects) {
    if (!ruleIds.has(d.ruleId)) fail(pack, `${d.id} unknown rule ${d.ruleId}`)
    for (const s of d.mustContain)
      if (!text.includes(flat(s))) fail(pack, `${d.id} expected text missing: "${s}"`)
    for (const s of d.mustNotContain)
      if (text.includes(flat(s))) fail(pack, `${d.id} forbidden text present: "${s}"`)
  }
  console.log(
    `${pack}: ${Object.keys(key.rules).length} rules keyed, ${key.defects.length} defects checked`,
  )
}

const packB = packs.includes('pack-b')
  ? (JSON.parse(readFileSync(join(PACKS, 'pack-b/key/key.json'), 'utf8')) as Key)
  : null
if (packB && packB.defects.length !== 12)
  problems.push(`pack-b: expected 12 defects, found ${packB.defects.length}`)

if (problems.length > 0) {
  console.error('verify-key FAILED:\n' + problems.map((p) => `  - ${p}`).join('\n'))
  process.exit(1)
}
console.log('verify-key: ok')
