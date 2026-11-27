import summary from '../data/eval-summary.json'
import { t, type MessageKey } from '../i18n/t.ts'

// Every miss the eval measured, by name, with the reason. The eval fails if this list drifts.
export function HowTested() {
  return (
    <section id="tested" className="tile glass gap-5" aria-labelledby="tested-title">
      <div className="flex flex-col gap-1">
        <span className="kicker">{t('tested.kicker')}</span>
        <h2 id="tested-title" className="text-[22px] font-semibold tracking-tight">
          {t('tested.title')}
        </h2>
        <p className="max-w-3xl text-[14px] text-[var(--muted)]">{t('tested.intro')}</p>
      </div>
      <details>
        <summary className="btn-link cursor-pointer">{t('tested.details')}</summary>
        <div className="mt-4 grid gap-6 lg:grid-cols-[2fr_3fr]">
          <div>
            <h3 className="font-semibold">{t('tested.packs')}</h3>
            <ul className="mt-2 flex flex-col gap-1.5 text-[14px]">
              {summary.packs.map((p) => (
                <li key={p.id}>
                  <span className="font-mono text-[13px]">{p.id}</span>
                  {p.heldOut ? (
                    <span className="ml-2 rounded-full border border-[var(--border)] px-2 text-[12px]">
                      {t('tested.heldOut')}
                    </span>
                  ) : null}{' '}
                  <span className="text-[var(--muted)]">{p.about}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">{t('tested.misses')}</h3>
            <dl className="mt-2 flex flex-col gap-3 text-[14px]">
              {summary.noAi.map((m) => (
                <div key={m.id}>
                  <dt className="font-medium">
                    <span className="text-[var(--muted)]">
                      {t(m.group === 'new' ? 'results.group.new' : 'results.group.training')}
                      {' · '}
                    </span>
                    {t(`results.${m.id}` as MessageKey)}:{' '}
                    <span className="tabular-nums">
                      {m.value} / {m.total}
                    </span>
                  </dt>
                  {m.missed.length ? (
                    <dd>
                      <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-[var(--muted)]">
                        {m.missed.map((x) => (
                          <li key={x.ref}>
                            <span className="font-mono text-[12px]">{x.ref}</span> {x.why}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  ) : (
                    <dd className="text-[var(--muted)]">{t('tested.noMisses')}</dd>
                  )}
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="font-semibold">{t('tested.history')}</h3>
          <ol className="mt-2 flex flex-col gap-2 text-[14px]">
            {summary.history.map((h) => (
              <li key={h.version}>
                <span className="font-mono text-[13px]">{h.version}</span>{' '}
                <span className="text-[var(--muted)]">({h.date})</span> {h.text}
              </li>
            ))}
          </ol>
        </div>
      </details>
    </section>
  )
}
