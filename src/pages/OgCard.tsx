import { Icon } from '../components/Icon.tsx'
import { StatusChip } from '../components/StatusChip.tsx'
import { t } from '../i18n/t.ts'

// The 1200 x 630 social card (scripts/og.tsx renders it with the built CSS): headline plus the quote card.
export function OgCard() {
  return (
    <div className="relative isolate flex h-[630px] w-[1200px] items-center gap-12 overflow-hidden bg-[var(--bg)] px-16">
      <div className="mesh" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="flex w-[560px] flex-col gap-6">
        <span className="flex items-center gap-3 text-[26px] font-semibold tracking-tight">
          <span className="brand-mark">
            <Icon name="mark" size={18} />
          </span>
          {t('app.name')}
        </span>
        <h1 className="text-gradient text-[64px] leading-[1.02] font-semibold tracking-tight">
          {t('hero.headline')}
        </h1>
        <p className="text-[22px] text-[var(--muted)]">{t('hero.kicker')}</p>
      </div>
      <figure className="evidence-card flex w-[520px] flex-col gap-4 text-[20px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">{t('bento.evidence.question')}</span>
          <StatusChip status="FOUND" />
        </div>
        <blockquote className="quote leading-relaxed">
          “<mark className="quote-hl">{t('bento.evidence.quote')}</mark>”
        </blockquote>
        <figcaption className="text-[16px] text-[var(--muted)]">
          {t('bento.evidence.source')}
        </figcaption>
      </figure>
    </div>
  )
}
