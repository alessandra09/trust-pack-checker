import summary from '../data/eval-summary.json'
import { t, type MessageKey } from '../i18n/t.ts'

// Measured numbers from `npm run eval`; the eval fails if these differ from what it measures.
// Held-out ("new") packs come first as the headline; packs used to build the checks are labelled apart.
const GROUPS = [
  { id: 'new', title: 'results.group.new', note: 'results.group.newNote' },
  { id: 'training', title: 'results.group.training', note: 'results.group.trainingNote' },
] as const

export function EvalResults() {
  return (
    <section className="flex flex-col gap-6" aria-labelledby="results-title">
      <div className="flex flex-col gap-1">
        <span className="kicker">{t('results.kicker')}</span>
        <h2 id="results-title" className="text-[24px] font-semibold tracking-tight">
          {t('results.title')}
        </h2>
        <p className="text-[14px] text-[var(--muted)]">
          {t('results.note')} {summary.measured}.
        </p>
      </div>
      {GROUPS.map((g) => (
        <div key={g.id} className="flex flex-col gap-3">
          <div>
            <h3 className="text-[18px] font-semibold">{t(g.title)}</h3>
            <p className="text-[14px] text-[var(--muted)]">{t(g.note)}</p>
          </div>
          <dl
            className={`grid gap-4 sm:grid-cols-2 ${g.id === 'new' ? 'lg:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-6'}`}
          >
            {summary.noAi
              .filter((m) => m.group === g.id)
              .map((m) => (
                <div key={m.id} className={`tile glass ${g.id === 'training' ? 'opacity-90' : ''}`}>
                  <dt className="text-[14px] text-[var(--muted)]">
                    {t(`results.${m.id}` as MessageKey)}
                  </dt>
                  <dd
                    className={`order-first leading-none font-semibold tracking-tight tabular-nums ${g.id === 'new' ? 'text-[36px]' : 'text-[26px]'}`}
                  >
                    {m.value}
                    <span className="text-[18px] font-normal text-[var(--muted)]">
                      {' '}
                      / {m.total}
                    </span>
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      ))}
      {summary.ai === null ? (
        <p className="text-[14px] text-[var(--muted)]">{t('results.aiPending')}</p>
      ) : null}
    </section>
  )
}
