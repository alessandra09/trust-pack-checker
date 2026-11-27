import { AUTHOR } from '../app/config.ts'
import { t } from '../i18n/t.ts'
import { href, PAGE_PATH, SAMPLE_REPORT_PATH } from '../pages/paths.ts'
import { EmailLine } from './EmailLine.tsx'

// One section for the free pilot, for companies and DPO consultants alike (DESIGN2 4.7):
// one primary button, everything else secondary. The request form lives on the pilot page.
export function PilotOffer() {
  if (!AUTHOR.email) return null
  return (
    <section id="pilot" className="flex flex-col gap-6" aria-labelledby="pilot-title">
      <div className="flex max-w-[640px] flex-col gap-3">
        <span className="kicker">{t('pilot.kicker')}</span>
        <h2 id="pilot-title" className="h2">
          {t('pilot.title')}
        </h2>
        <p className="text-[17px] leading-relaxed">{t('pilot.body')}</p>
        <p className="text-[14px]">{t('pilot.privacy')}</p>
        <p className="text-[14px] text-[var(--muted)]">
          {t('pilot.note')} {t('pilot.response')}
        </p>
      </div>
      <div className="flex max-w-[640px] flex-col gap-2 border-l-2 border-[var(--border-strong)] pl-4">
        <h3 className="text-[18px] font-semibold">{t('consult.title')}</h3>
        <p className="text-[var(--muted)]">{t('consult.body')}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <a href={AUTHOR.pilotForm || href(PAGE_PATH.pilot)} className="btn-primary btn-hero">
          {t('pilot.formCta')}
        </a>
        <a href={href(SAMPLE_REPORT_PATH)} className="btn-link">
          {t('pilot.sample')}
        </a>
        {AUTHOR.pilot ? (
          <a href={AUTHOR.pilot} className="btn-link">
            {t('pilot.cta')}
          </a>
        ) : null}
        {AUTHOR.contact ? (
          <a
            href={AUTHOR.contact}
            className="btn-link"
            {...(AUTHOR.contact.startsWith('http')
              ? { target: '_blank', rel: 'noreferrer noopener' }
              : {})}
          >
            {t('about.feedback')}
          </a>
        ) : null}
      </div>
      <p className="text-[13px] text-[var(--muted)]">{t('pilot.sampleNote')}</p>
      <EmailLine />
    </section>
  )
}
