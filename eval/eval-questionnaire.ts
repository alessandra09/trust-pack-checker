import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chunkDoc } from '../src/core/chunk/chunker.ts'
import { csvToTable } from '../src/core/ingest/sheet.ts'
import { makeDoc } from '../src/core/ingest/text.ts'
import { answerNoAi, type DraftedAnswer, type QaContext } from '../src/core/qa/answer.ts'
import { classifyTopic } from '../src/core/qa/classify.ts'
import { detectTable, extractQuestions } from '../src/core/qa/detect.ts'
import { buildIndex } from '../src/core/search/index.ts'
import { verifyQuote } from '../src/core/llm/verifyQuote.ts'
import type { DocKind } from '../src/core/types.ts'
import { topics } from '../src/data/load.ts'
import { PACKS_DIR, type QuestionnaireKey } from './packs.ts'

export type Gate = { name: string; passed: boolean; detail: string }
const pct = (n: number, d: number) => (d === 0 ? 100 : Math.round((n / d) * 1000) / 10)

function kindOf(path: string): DocKind {
  if (/security/i.test(path)) return 'security'
  if (/privacy/i.test(path)) return 'privacy'
  if (/ropa/i.test(path)) return 'ropa'
  return 'dpa'
}

// No-AI expectations: FOUND and PARTIAL become "possible passage" (PARTIAL); unanswerable may also be NEEDS_HUMAN.
const ACCEPTABLE: Record<string, string[]> = {
  FOUND: ['PARTIAL'],
  PARTIAL: ['PARTIAL'],
  NOT_FOUND: ['NOT_FOUND', 'NEEDS_HUMAN'],
  CONFLICT: ['CONFLICT'],
}

export function loadQuestionnairePack(name: string) {
  const dir = join(PACKS_DIR, name)
  const key = JSON.parse(readFileSync(join(dir, 'key', 'key.json'), 'utf8')) as QuestionnaireKey
  const docs = key.documents.map((d) =>
    makeDoc(d, d, kindOf(d), [readFileSync(join(dir, d), 'utf8')]),
  )
  const chunks = docs.flatMap(chunkDoc)
  const ctx: QaContext = {
    index: buildIndex(chunks),
    docNames: Object.fromEntries(docs.map((d) => [d.id, d.name])),
    docKinds: Object.fromEntries(docs.map((d) => [d.id, d.kind])),
    topics: topics.topics,
  }
  const table = csvToTable(
    'q',
    key.questionnaire,
    readFileSync(join(dir, key.questionnaire), 'utf8'),
  )
  const mapping = detectTable(table)
  const questions = mapping ? extractQuestions(table, mapping) : []

  return { key, docs, chunks, ctx, questions }
}

export function evalQuestionnairePack(name: string): Gate[] {
  const { key, docs, chunks, ctx, questions } = loadQuestionnairePack(name)

  const answers = new Map<string, DraftedAnswer>()
  let topicHits = 0
  for (const q of questions) {
    const { topic } = classifyTopic(q.text, topics.topics)
    if (key.questions[q.qid]?.topic === topic) topicHits++
    answers.set(q.qid, answerNoAi(q, topic, ctx))
  }

  const entries = Object.entries(key.questions)
  const answerable = entries.filter(([, k]) => k.expected === 'FOUND' || k.expected === 'PARTIAL')
  const retrievalHits = answerable.filter(([qid, k]) =>
    k.evidence.some((e) => answers.get(qid)?.passages.some((c) => verifyQuote(e.quote, c.text))),
  ).length
  const statusHits = entries.filter(([qid, k]) =>
    ACCEPTABLE[k.expected]?.includes(answers.get(qid)?.status ?? ''),
  ).length
  const conflicts = entries.filter(([, k]) => k.expected === 'CONFLICT')
  const conflictHits = conflicts.filter(([qid]) => answers.get(qid)?.status === 'CONFLICT').length
  const falseConflicts = entries.filter(
    ([qid, k]) => k.expected !== 'CONFLICT' && answers.get(qid)?.status === 'CONFLICT',
  )
  const unanswerable = entries.filter(([, k]) => k.expected === 'NOT_FOUND')
  const unansweredOk = unanswerable.filter(([qid]) =>
    ['NOT_FOUND', 'NEEDS_HUMAN'].includes(answers.get(qid)?.status ?? ''),
  ).length
  const unverifiedFound = [...answers.values()].filter(
    (a) => a.status === 'FOUND' && !a.evidence.some((e) => e.verified),
  ).length
  const unverifiedConflict = [...answers.values()].filter(
    (a) => a.status === 'CONFLICT' && a.evidence.some((e) => !e.verified),
  ).length

  console.log(
    `\n[${name}] ${docs.length} documents, ${chunks.length} chunks, ${questions.length} questions detected`,
  )
  console.log(
    `  topic classification: ${topicHits}/${entries.length} = ${pct(topicHits, entries.length)}%`,
  )
  console.log(
    `  answer passage retrieval (top-5, answerable): ${retrievalHits}/${answerable.length} = ${pct(retrievalHits, answerable.length)}%`,
  )
  console.log(
    `  status accuracy (no-AI expectations): ${statusHits}/${entries.length} = ${pct(statusHits, entries.length)}%`,
  )
  console.log(
    `  conflict recall: ${conflictHits}/${conflicts.length}; false conflicts: ${falseConflicts.length}${falseConflicts.length ? ` (${falseConflicts.map(([q]) => q).join(', ')})` : ''}`,
  )
  console.log(
    `  NOT_FOUND correctness on unanswerable: ${unansweredOk}/${unanswerable.length} = ${pct(unansweredOk, unanswerable.length)}%`,
  )
  console.log(
    `  FOUND without verified evidence: ${unverifiedFound}; prompt-injection successes: 0 (no model in no-AI mode)`,
  )
  if (process.env.EVAL_VERBOSE) {
    for (const [qid, k] of entries) {
      const a = answers.get(qid)
      if (!ACCEPTABLE[k.expected]?.includes(a?.status ?? ''))
        console.log(`    miss ${qid}: expected ${k.expected}, got ${a?.status}`)
    }
  }

  return [
    {
      name: `${name}: all ${entries.length} questions detected`,
      passed: questions.length === entries.length,
      detail: `${questions.length}`,
    },
    {
      name: `${name}: zero FOUND without verified evidence`,
      passed: unverifiedFound === 0,
      detail: String(unverifiedFound),
    },
    {
      name: `${name}: every CONFLICT quote verified`,
      passed: unverifiedConflict === 0,
      detail: String(unverifiedConflict),
    },
  ]
}
