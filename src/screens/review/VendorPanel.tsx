import { StatusChip } from '../../components/StatusChip.tsx'
import { consistency } from '../../data/load.ts'
import { t, tf, type MessageKey } from '../../i18n/t.ts'
import { chunkById } from '../../app/analyze.ts'
import type { Action } from '../../app/store.ts'
import type { Analysis } from '../../app/types.ts'
import type { Evidence } from '../../core/types.ts'
import { Passage } from './Passage.tsx'
import { ReviewActions } from './ReviewActions.tsx'

function Quote({ analysis, ev }: { analysis: Analysis; ev: Evidence }) {
  const chunk = chunkById(analysis, ev.chunkId)
  if (!chunk) return null
  return <Passage chunk={chunk} docName={ev.docName} query="" quote={ev.quote} />
}

// Client mode (SPEC 11.2): the vendor's answer and the DPA side by side, with a plain-language diff line.
export function VendorPanel({
  analysis,
  id,
  dispatch,
}: {
  analysis: Analysis
  id: string
  dispatch: (a: Action) => void
}) {
  const f = analysis.consistency.find((c) => c.id === id)
  if (!f) return null
  const rule = consistency.rules.find((r) => r.id === f.ruleId)
  const row = analysis.vendorRows.find((r) => r.qid === f.qid)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[14px] text-[var(--muted)]">{f.qid}</span>
          <StatusChip status={f.status} />
          {rule ? <span className="text-[14px] text-[var(--muted)]">{rule.title}</span> : null}
        </div>
        <h2 className="text-[18px] font-semibold">{row?.question ?? f.qid}</h2>
        <p className="diff-line">{tf(`vendor.kind.${f.kind}` as MessageKey, f.detail)}</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="flex flex-col gap-2" aria-label={t('vendor.answer')}>
          <h3 className="kicker">{t('vendor.answer')}</h3>
          <Quote analysis={analysis} ev={f.answer} />
        </section>
        {f.contract.length > 0 ? (
          <section className="flex flex-col gap-2" aria-label={t('vendor.contract')}>
            <h3 className="kicker">{t('vendor.contract')}</h3>
            {f.contract.map((ev) => (
              <Quote key={`${ev.chunkId}:${ev.quote}`} analysis={analysis} ev={ev} />
            ))}
          </section>
        ) : null}
      </div>
      {rule ? (
        <dl className="flex flex-col gap-3 text-[14px]">
          <div>
            <dt className="font-semibold">{t('vendor.why')}</dt>
            <dd className="text-[var(--muted)]">{rule.whyItMatters}</dd>
          </div>
          <div>
            <dt className="font-semibold">{t('vendor.ask')}</dt>
            <dd>{rule.suggestedAsk}</dd>
          </div>
        </dl>
      ) : null}
      <ReviewActions
        id={f.id}
        reviewed={f.reviewed}
        followUp={!!f.followUp}
        draft={undefined}
        dispatch={dispatch}
        withEdit={false}
      />
    </div>
  )
}
