import summary from '../data/eval-summary.json'
import { t, tf, type MessageKey } from '../i18n/t.ts'
import { HowTested } from './HowTested.tsx'

// Measured numbers from `npm run eval`; the eval fails if these differ from what it measures.
// Held-out ("new") packs come first as the headline; packs used to build the checks are labelled apart.
const GROUPS = [
  { id: 'new', title: 'results.group.new', note: 'results.group.newNote' },
  { id: 'training', title: 'results.group.training', note: 'results.group.trainingNote' },
] as const

const headline = (id: string) => summary.noAi.find((x) => x.id === id && x.group === 'new')
const score = (id: string) => {
  const m = headline(id)
  return m ? `${m.value}/${m.total}` : '?'
}
/** Sample size next to every number, so "3 of 3" is never read as a general rate. */
export const packsLabel = (n: number | undefined) =>
  n === 1 ? t('results.packsOne') : tf('results.packsMany', { n: String(n ?? '?') })

/** The headline in one sentence: held-out ("new") packs only. */
export function resultsSummary(): string {
  return tf('results.summary', {
    missing: score('missing'),
    missingPacks: packsLabel(headline('missing')?.packs),
    vendor: score('vendor'),
    vendorPacks: packsLabel(headline('vendor')?.packs),
    clean: score('vendorClean'),
    cleanPacks: packsLabel(headline('vendorClean')?.packs),
  })
}

export function EvalResults() {
  return (
    <section id="how-it-was-tested" className="flex flex-col gap-6" aria-labelledby="results-title">
      <div className="flex flex-col gap-1">
        <span className="kicker">{t('results.kicker')}</span>
        <h2 id="results-title" className="h2">
          {t('results.title')}
        </h2>
        <p className="text-[14px] text-[var(--muted)]">
          {t('results.note')} {summary.measured}.
        </p>
      </div>
      <p className="max-w-[720px] text-[20px] leading-snug font-medium">{resultsSummary()}</p>
      <p className="max-w-[720px] text-[15px] text-[var(--muted)]">{t('results.vendorContext')}</p>
      <details>
        <summary className="btn-link cursor-pointer">{t('results.details')}</summary>
        <div className="mt-4 flex flex-col gap-6">
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
                    <div
                      key={m.id}
                      className={`tile glass ${g.id === 'training' ? 'opacity-90' : ''}`}
                    >
                      <dt className="text-[14px] text-[var(--muted)]">
                        {t(`results.${m.id}` as MessageKey)}
                        <span className="block text-[13px]">{packsLabel(m.packs)}</span>
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
          <HowTested />
        </div>
      </details>
      {summary.ai === null ? (
        <p className="text-[14px] text-[var(--muted)]">{t('results.aiPending')}</p>
      ) : null}
    </section>
  )
}
