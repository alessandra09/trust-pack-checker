import { t } from '../i18n/t.ts'
import type { Mode } from '../app/types.ts'
import { Icon } from '../components/Icon.tsx'

export function ModeScreen({
  onMode,
  onSample,
}: {
  onMode: (m: Mode) => void
  onSample: () => void
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16 md:py-24">
      <div className="hero-glow flex flex-col gap-5">
        <span className="eyebrow enter">
          <Icon name="lock" size={14} />
          {t('privacy.note')}
        </span>
        <h1 className="enter max-w-3xl text-[32px] leading-[1.1] font-semibold tracking-tight md:text-[48px]">
          {t('hero.headline')}
        </h1>
        <p className="enter-2 max-w-2xl text-[18px] leading-relaxed text-[var(--muted)]">
          {t('hero.subline')}
        </p>
        <div className="enter-2 flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
          <button type="button" className="btn-primary" onClick={onSample}>
            <Icon name="sparkle" size={18} />
            {t('mode.sample')}
          </button>
          <p className="text-[14px] text-[var(--muted)]">{t('mode.sampleNote')}</p>
        </div>
      </div>
      <section className="enter-3 flex flex-col gap-4" aria-labelledby="mode-title">
        <h2
          id="mode-title"
          className="text-[14px] font-semibold tracking-wide text-[var(--muted)] uppercase"
        >
          {t('mode.title')}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <button type="button" className="card-button" onClick={() => onMode('company')}>
            <span className="card-icon">
              <Icon name="answer" />
            </span>
            <span className="text-[18px] font-semibold">{t('mode.company.title')}</span>
            <span className="text-[var(--muted)]">{t('mode.company.body')}</span>
          </button>
          <button type="button" className="card-button" disabled aria-describedby="client-soon">
            <span className="card-icon">
              <Icon name="review" />
            </span>
            <span className="text-[18px] font-semibold">{t('mode.client.title')}</span>
            <span className="text-[var(--muted)]">{t('mode.client.body')}</span>
            <span id="client-soon" className="text-[14px] text-[var(--muted)]">
              {t('mode.client.soon')}
            </span>
          </button>
        </div>
      </section>
    </div>
  )
}
