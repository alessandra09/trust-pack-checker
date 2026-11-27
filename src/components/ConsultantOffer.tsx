import { t } from '../i18n/t.ts'
import { href, PAGE_PATH } from '../pages/paths.ts'

// For DPO consultants and privacy firms, the likeliest paying users. No price yet (owner's decision).
export function ConsultantOffer() {
  return (
    <section className="tile glass flex-col gap-3" aria-labelledby="consult-title">
      <span className="kicker">{t('consult.kicker')}</span>
      <h2 id="consult-title" className="text-[22px] font-semibold tracking-tight">
        {t('consult.title')}
      </h2>
      <p className="max-w-3xl">{t('consult.body')}</p>
      <div>
        <a href={href(PAGE_PATH.pilot)} className="btn-secondary">
          {t('consult.cta')}
        </a>
      </div>
    </section>
  )
}
