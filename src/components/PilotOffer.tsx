import { useState } from 'react'
import { AUTHOR } from '../app/config.ts'
import { t } from '../i18n/t.ts'
import { EmailLine } from './EmailLine.tsx'
import { PilotForm } from './PilotForm.tsx'

// Offer of a free manual review by the author. Hidden when no pilot address is set in config.ts.
export function PilotOffer() {
  const [open, setOpen] = useState(false)
  if (!AUTHOR.pilot && !AUTHOR.email) return null
  const sample = `${import.meta.env.BASE_URL}sample-report.html`
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
        {AUTHOR.pilotForm ? (
          <a
            href={AUTHOR.pilotForm}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-primary"
          >
            {t('pilot.formCta')}
          </a>
        ) : (
          <button
            type="button"
            className="btn-primary"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {t('pilot.formCta')}
          </button>
        )}
        {AUTHOR.pilot ? (
          <a href={AUTHOR.pilot} className="btn-secondary">
            {t('pilot.cta')}
          </a>
        ) : null}
        <a href={sample} target="_blank" rel="noopener" className="btn-link">
          {t('pilot.sample')}
        </a>
      </div>
      <p className="text-[13px] text-[var(--muted)]">{t('pilot.sampleNote')}</p>
      <EmailLine />
      {open && !AUTHOR.pilotForm ? <PilotForm /> : null}
    </section>
  )
}
