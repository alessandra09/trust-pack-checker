import { useState } from 'react'
import { confirmBySelection } from '../../core/rules/engine.ts'
import { art28 } from '../../data/load.ts'
import { t } from '../../i18n/t.ts'
import { StatusChip } from '../../components/StatusChip.tsx'
import { chunkById } from '../../app/analyze.ts'
import type { Action } from '../../app/store.ts'
import type { Analysis } from '../../app/types.ts'
import { Passage, readSelection } from './Passage.tsx'
import { ReviewActions } from './ReviewActions.tsx'

export function RulePanel({
  analysis,
  id,
  dispatch,
}: {
  analysis: Analysis
  id: string
  dispatch: (a: Action) => void
}) {
  const f = analysis.findings.find((x) => x.id === id)
  const rule = art28.rules.find((r) => r.id === f?.ruleId)
  const [selError, setSelError] = useState(false)
  if (!f || !rule) return null
  const satisfies = () => {
    const sel = readSelection()
    const chunk = sel ? chunkById(analysis, sel.chunkId) : undefined
    const next =
      sel && chunk
        ? confirmBySelection(f, chunk, sel.text, analysis.docNames[chunk.docId] ?? chunk.docId)
        : f
    if (next.status !== 'FOUND') return setSelError(true)
    setSelError(false)
    dispatch({ type: 'evidence', id, status: 'FOUND', evidence: next.evidence })
  }
  const verified = f.evidence.filter((e) => e.verified)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[14px] text-[var(--muted)]">{rule.article}</span>
        <StatusChip status={f.status} />
        {rule.class === 'practice' ? (
          <span className="text-[14px] text-[var(--muted)]">{t('evidence.goodPractice')}</span>
        ) : null}
      </div>
      <h2 className="text-[18px] font-semibold">{rule.title}</h2>
      <dl className="flex flex-col gap-2 text-[14px]">
        <dt className="font-semibold">{t('evidence.requirement')}</dt>
        <dd>{rule.requirement}</dd>
        <dt className="font-semibold">{t('evidence.whyItMatters')}</dt>
        <dd>{rule.whyItMatters}</dd>
        <dt className="font-semibold">{t('evidence.ask')}</dt>
        <dd>{rule.suggestedAsk}</dd>
      </dl>
      {f.incorporatedByReference ? (
        <p className="text-[14px] text-[var(--partial-fg)]">{t('evidence.incorporated')}</p>
      ) : null}
      <ReviewActions
        id={id}
        reviewed={f.reviewed}
        followUp={!!f.followUp}
        draft={undefined}
        dispatch={dispatch}
      />
      {verified.map((e) => {
        const c = chunkById(analysis, e.chunkId)
        return c ? (
          <Passage
            key={e.chunkId}
            chunk={c}
            docName={e.docName}
            query={rule.hints.join(' ')}
            quote={e.quote}
          />
        ) : null
      })}
      {f.status !== 'FOUND' && f.candidates.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="font-semibold">{t('evidence.passages')}</h3>
          <p className="text-[14px] text-[var(--muted)]">{t('evidence.passagesHelp')}</p>
          {f.candidates.map((c) => (
            <Passage
              key={c.chunk.id}
              chunk={c.chunk}
              docName={analysis.docNames[c.chunk.docId] ?? c.chunk.docId}
              query={rule.hints.join(' ')}
            />
          ))}
          <div>
            <button type="button" className="btn-secondary" onClick={satisfies}>
              {t('evidence.satisfiesRule')}
            </button>
            {selError ? (
              <p role="alert" className="mt-1 text-[14px] text-[var(--conflict-fg)]">
                {t('evidence.selectionInvalid')}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
      {f.status === 'NOT_FOUND' ? (
        <p className="text-[14px] text-[var(--muted)]">{t('evidence.noPassages')}</p>
      ) : null}
    </div>
  )
}
