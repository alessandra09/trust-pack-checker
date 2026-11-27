import { AUTHOR } from '../app/config.ts'
import { t } from '../i18n/t.ts'
import { href, PAGE_PATH, SAMPLE_REPORT_PATH } from '../pages/paths.ts'
import { EmailLine } from './EmailLine.tsx'

// Offer of a free manual review by the author; the request form lives on the pilot page.
export function PilotOffer() {
  if (!AUTHOR.email) return null
  return (
    <section id="pilot" className="tile glass flex-col gap-4" aria-labelledby="pilot-title">
      <div className="flex max-w-3xl flex-col gap-2">
        <span className="kicker">{t('pilot.kicker')}</span>
        <h2 id="pilot-title" className="text-[22px] font-semibold tracking-tight">
          {t('pilot.title')}
        </h2>
        <p>{t('pilot.body')}</p>
        <p className="text-[14px]">{t('pilot.privacy')}</p>
        <p className="text-[14px] text-[var(--muted)]">
          {t('pilot.note')} {t('pilot.response')}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <a href={AUTHOR.pilotForm || href(PAGE_PATH.pilot)} className="btn-secondary">
          {t('pilot.formCta')}
        </a>
        {AUTHOR.pilot ? (
          <a href={AUTHOR.pilot} className="btn-secondary">
            {t('pilot.cta')}
          </a>
        ) : null}
        <a href={href(SAMPLE_REPORT_PATH)} className="btn-link">
          {t('pilot.sample')}
        </a>
      </div>
      <p className="text-[13px] text-[var(--muted)]">{t('pilot.sampleNote')}</p>
      <EmailLine />
    </section>
  )
}
