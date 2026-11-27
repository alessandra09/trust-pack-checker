import { AUTHOR } from '../app/config.ts'
import { t } from '../i18n/t.ts'
import { EmailLine } from './EmailLine.tsx'

// For DPO consultants and privacy firms, the likeliest paying users. No price yet (owner's decision).
export function ConsultantOffer() {
  if (!AUTHOR.email) return null
  const mail = `mailto:${AUTHOR.email}?subject=${encodeURIComponent(t('consult.title'))}`
  return (
    <section className="tile glass flex-col gap-3" aria-labelledby="consult-title">
      <span className="kicker">{t('consult.kicker')}</span>
      <h2 id="consult-title" className="text-[22px] font-semibold tracking-tight">
        {t('consult.title')}
      </h2>
      <p className="max-w-3xl">{t('consult.body')}</p>
      <div>
        <a href={mail} className="btn-secondary">
          {t('consult.cta')}
        </a>
      </div>
      <EmailLine />
    </section>
  )
}
