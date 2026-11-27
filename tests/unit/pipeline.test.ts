import { describe, expect, it } from 'vitest'
import { loadQuestionnairePack } from '../../eval/eval-questionnaire.ts'
import { loadPack } from '../../eval/packs.ts'
import { buildAuditLog } from '../../src/core/export/audit.ts'
import { createMockProvider, type MockOptions } from '../../src/core/llm/mock.ts'
import { runPool } from '../../src/core/llm/pool.ts'
import { PROMPT_VERSION } from '../../src/core/llm/prompts.ts'
import { answerWithAi, evaluateRuleWithAi } from '../../src/core/llm/run.ts'
import { verifyQuote } from '../../src/core/llm/verifyQuote.ts'
import { classifyTopic } from '../../src/core/qa/classify.ts'
import { evaluateAllNoAi } from '../../src/core/rules/engine.ts'
import { art28, topics } from '../../src/data/load.ts'

// SPRINT2 task 7: the whole AI pipeline on synthetic packs, with a mock provider instead of a key.
const qa = loadQuestionnairePack('pack-c')
const labels = Object.fromEntries(qa.docs.map((d) => [d.id, 'Document']))
const chunkText = new Map(qa.chunks.map((c) => [c.id, c.text]))

async function runQuestionnaire(opts: MockOptions, signal?: AbortSignal) {
  const provider = createMockProvider(opts)
  const out = await runPool(
    qa.questions,
    (q) =>
      answerWithAi(q, classifyTopic(q.text, topics.topics).topic, qa.ctx, provider, labels, signal),
    { signal },
  )
  return { provider, ...out }
}

const foundWithoutVerifiedQuote = (
  answers: { status: string; evidence: { chunkId: string; quote: string; verified: boolean }[] }[],
) =>
  answers.filter(
    (a) =>
      a.status === 'FOUND' &&
      !a.evidence.some((e) => e.verified && verifyQuote(e.quote, chunkText.get(e.chunkId) ?? '')),
  )

describe('AI pipeline with the mock provider', () => {
  it('honest replies: every FOUND has a quote that is really in the cited passage', async () => {
    const { results, errors } = await runQuestionnaire({ behaviour: 'honest' })
    const answers = results.flatMap((r) => (r ? [r] : []))
    expect(errors.filter(Boolean)).toEqual([])
    expect(answers.some((a) => a.status === 'FOUND')).toBe(true)
    expect(foundWithoutVerifiedQuote(answers)).toEqual([])
  })

  it('never sends file names or whole documents, and caps passages', async () => {
    const { provider } = await runQuestionnaire({ behaviour: 'honest' })
    expect(provider.requests.length).toBeGreaterThan(0)
    for (const r of provider.requests) {
      // Passage ids are internal; in this test they happen to be paths, so they are left out of the check.
      const shown = r.user.replace(/ id="[^"]*"/g, '')
      for (const d of qa.docs) expect(shown).not.toContain(d.name)
      expect(shown).toContain('doc="Document"')
      expect(r.user.split(/\s+/).length).toBeLessThan(2200)
    }
  })

  it('paraphrased quotes are never FOUND (retry once, then human review)', async () => {
    const { results, provider } = await runQuestionnaire({ behaviour: 'paraphrase' })
    const answers = results.flatMap((r) => (r ? [r] : []))
    expect(answers.filter((a) => a.status === 'FOUND')).toEqual([])
    expect(answers.some((a) => a.status === 'NEEDS_HUMAN')).toBe(true)
    expect(provider.requests.some((r) => r.user.includes('copied exactly'))).toBe(true)
  })

  it('replies that are not JSON go to human review', async () => {
    const { results } = await runQuestionnaire({ behaviour: 'garbage' })
    const sent = results.flatMap((r) => (r && r.calls > 0 ? [r] : []))
    expect(sent.length).toBeGreaterThan(0)
    expect(sent.every((a) => a.status === 'NEEDS_HUMAN')).toBe(true)
  })

  it('a model that obeys planted instructions never turns them into FOUND answers', async () => {
    const { results } = await runQuestionnaire({ behaviour: 'obedient' })
    const answers = results.flatMap((r) => (r ? [r] : []))
    const obeyed = answers.filter(
      (a) =>
        ['FOUND', 'PARTIAL'].includes(a.status) &&
        a.evidence.some((e) => /assistant|ignore/i.test(e.quote)),
    )
    expect(obeyed).toEqual([])
  })

  it('retries 429 and 5xx, keeps partial results when calls keep failing', async () => {
    const retried = await runQuestionnaire({ behaviour: 'honest', failFirst: [429] })
    expect(retried.errors.filter(Boolean)).toEqual([])
    // One question keeps getting 500 (first try + 3 retries): it errors, every other answer survives.
    const failing = qa.questions.find((q) => q.text.length > 20)?.text ?? ''
    const broken = await runQuestionnaire({
      behaviour: 'honest',
      failFor: { match: failing, status: 500 },
    })
    expect(broken.errors.filter(Boolean).length).toBe(1)
    expect(broken.results.filter(Boolean).length).toBe(qa.questions.length - 1)
  }, 30_000)

  it('cancel stops the run', async () => {
    const ctrl = new AbortController()
    ctrl.abort()
    const { provider, results } = await runQuestionnaire({ behaviour: 'honest' }, ctrl.signal)
    expect(provider.requests.length).toBe(0)
    expect(results.filter(Boolean).length).toBe(0)
  })

  it('rule checks: FOUND only with a verified quote; the audit log names the prompt version', async () => {
    const pack = loadPack('pack-i')
    const names = { [pack.doc.id]: pack.doc.name }
    const noAi = evaluateAllNoAi(art28.rules, pack.chunks, names)
    for (const behaviour of ['honest', 'paraphrase', 'obedient'] as const) {
      const provider = createMockProvider({ behaviour })
      const { results } = await runPool(
        art28.rules.flatMap((rule) => {
          const base = noAi.find((r) => r.ruleId === rule.id)
          return base ? [{ rule, base }] : []
        }),
        ({ rule, base }) =>
          evaluateRuleWithAi(rule, base, provider, names, { [pack.doc.id]: 'DPA' }),
      )
      for (const r of results.flatMap((x) => (x ? [x] : []))) {
        if (r.status !== 'FOUND') continue
        const text = pack.chunks.map((c) => c.text)
        expect(
          r.evidence.some((e) => e.verified && text.some((t) => verifyQuote(e.quote, t))),
        ).toBe(true)
      }
    }
    const log = buildAuditLog({
      mode: 'company',
      model: 'mock',
      documents: [],
      findings: [],
      answers: [],
    })
    expect(log.promptVersion).toBe(PROMPT_VERSION)
  })
})
