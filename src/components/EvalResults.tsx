import summary from '../data/eval-summary.json'
import { t, type MessageKey } from '../i18n/t.ts'

// Measured numbers from `npm run eval`; the eval fails if these differ from what it measures.
// "decoys" counts mistakes, so lower is better and it is shown as value / total like the rest.
export function EvalResults() {
  return (
    <section className="flex flex-col gap-4" aria-labelledby="results-title">
      <div className="flex flex-col gap-1">
        <span className="kicker">{t('results.kicker')}</span>
        <h2 id="results-title" className="text-[24px] font-semibold tracking-tight">
          {t('results.title')}
        </h2>
        <p className="text-[14px] text-[var(--muted)]">
          {t('results.note')} {summary.measured}.
        </p>
      </div>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summary.noAi.map((m) => (
          <div key={m.id} className="tile glass">
            <dt className="text-[14px] text-[var(--muted)]">
              {t(`results.${m.id}` as MessageKey)}
            </dt>
            <dd className="order-first text-[36px] leading-none font-semibold tracking-tight tabular-nums">
              {m.value}
              <span className="text-[20px] font-normal text-[var(--muted)]"> / {m.total}</span>
            </dd>
          </div>
        ))}
      </dl>
      {summary.ai === null ? (
        <p className="text-[14px] text-[var(--muted)]">{t('results.aiPending')}</p>
      ) : null}
    </section>
  )
}
