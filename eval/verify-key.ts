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
type QKey = {
  pack: string
  documents: string[]
  questionnaire: string
  questions: Record<
    string,
    { topic: string; expected: string; evidence: { doc: string; quote: string }[] }
  >
  injections: { doc: string; text: string }[]
}

function verifyQuestionnairePack(pack: string, key: QKey): void {
  const texts = new Map(
    key.documents.map((d) => [d, flat(readFileSync(join(PACKS, pack, d), 'utf8'))]),
  )
  const csv = readFileSync(join(PACKS, pack, key.questionnaire), 'utf8')
  const counts: Record<string, number> = {}
  for (const [qid, q] of Object.entries(key.questions)) {
    counts[q.expected] = (counts[q.expected] ?? 0) + 1
    if (!csv.includes(`${qid},`)) fail(pack, `${qid} not in questionnaire`)
    if (q.expected === 'NOT_FOUND' && q.evidence.length > 0)
      fail(pack, `${qid} NOT_FOUND but has evidence`)
    if (q.expected === 'CONFLICT' && new Set(q.evidence.map((e) => e.doc)).size < 2)
      fail(pack, `${qid} CONFLICT needs quotes from two documents`)
    if (['FOUND', 'PARTIAL'].includes(q.expected) && q.evidence.length === 0)
      fail(pack, `${qid} ${q.expected} without evidence`)
    for (const e of q.evidence) {
      const t = texts.get(e.doc)
      if (!t?.includes(flat(e.quote))) fail(pack, `${qid} quote not in ${e.doc}: "${e.quote}"`)
    }
  }
  for (const inj of key.injections)
    if (!texts.get(inj.doc)?.includes(flat(inj.text))) fail(pack, `injection not in ${inj.doc}`)
  const n = Object.keys(key.questions).length
  if (pack === 'pack-c') {
    if (n !== 60) fail(pack, `expected 60 questions, found ${n}`)
    if (counts.NOT_FOUND !== 10)
      fail(pack, `expected 10 unanswerable, found ${counts.NOT_FOUND ?? 0}`)
    if (counts.CONFLICT !== 6) fail(pack, `expected 6 conflicts, found ${counts.CONFLICT ?? 0}`)
    if (key.injections.length !== 4)
      fail(pack, `expected 4 injections, found ${key.injections.length}`)
  }
  console.log(`${pack}: ${n} questions keyed, ${key.injections.length} injections checked`)
}

type CKey = {
  dpa: string
  answers: string
  contradictions: {
    id: string
    qid: string
    numeric: boolean
    answerQuote: string
    dpaQuote: string
  }[]
  clean: string[]
  unbacked: { qid: string; claim: string }[]
  injections: { doc: string; text: string }[]
}

// Client mode pack: each contradiction's quotes are in the right file, on the right answer row.
function verifyClientPack(pack: string, key: CKey): void {
  const dpa = flat(readFileSync(join(PACKS, pack, key.dpa), 'utf8'))
  const csv = readFileSync(join(PACKS, pack, key.answers), 'utf8')
  const rows = new Map(csv.split('\n').map((l) => [l.split(',')[0] ?? '', flat(l)] as const))
  for (const c of key.contradictions) {
    const row = rows.get(c.qid)
    if (!row) fail(pack, `${c.id}: ${c.qid} not in answers`)
    else if (!row.includes(flat(c.answerQuote))) fail(pack, `${c.id}: answer quote not on ${c.qid}`)
    if (!dpa.includes(flat(c.dpaQuote))) fail(pack, `${c.id}: DPA quote not in DPA`)
  }
  for (const q of [...key.clean, ...key.unbacked.map((u) => u.qid)])
    if (!rows.has(q)) fail(pack, `${q} not in answers`)
  for (const u of key.unbacked)
    if (dpa.includes(flat(u.claim)))
      fail(pack, `claim ${u.claim} is in the DPA, so it is not unbacked`)
  for (const inj of key.injections)
    if (!flat(csv).includes(flat(inj.text))) fail(pack, `injection not in ${inj.doc}`)
  if (pack === 'pack-d') {
    if (key.contradictions.length !== 8)
      fail(pack, `expected 8 contradictions, found ${key.contradictions.length}`)
    if (key.contradictions.filter((c) => c.numeric).length < 3)
      fail(pack, 'expected at least 3 numeric contradictions')
  }
  console.log(
    `${pack}: ${key.contradictions.length} contradictions and ${key.clean.length} clean rows checked`,
  )
}

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
  const raw = JSON.parse(readFileSync(keyPath, 'utf8')) as Key | QKey | CKey
  if ('contradictions' in raw) {
    verifyClientPack(pack, raw)
    continue
  }
  if ('questions' in raw) {
    verifyQuestionnairePack(pack, raw)
    continue
  }
  const key = raw
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
