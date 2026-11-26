import { AUTHOR } from '../app/config.ts'
import { t } from '../i18n/t.ts'

// Offer of a free manual review by the author. Hidden when no pilot address is set in config.ts.
export function PilotOffer() {
  if (!AUTHOR.pilot) return null
  return (
    <section
      className="tile glass flex-col gap-4 md:flex-row md:items-center md:justify-between"
      aria-labelledby="pilot-title"
    >
      <div className="flex max-w-3xl flex-col gap-2">
        <span className="kicker">{t('pilot.kicker')}</span>
        <h2 id="pilot-title" className="text-[22px] font-semibold tracking-tight">
          {t('pilot.title')}
        </h2>
        <p>{t('pilot.body')}</p>
        <p className="text-[14px] text-[var(--muted)]">{t('pilot.note')}</p>
      </div>
      <a href={AUTHOR.pilot} className="btn-primary shrink-0">
        {t('pilot.cta')}
      </a>
    </section>
  )
}
