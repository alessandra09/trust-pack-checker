import { t } from '../i18n/t.ts'
import type { Mode } from '../app/types.ts'
import { Icon } from '../components/Icon.tsx'
import { StatusChip } from '../components/StatusChip.tsx'
import { art28 } from '../data/load.ts'
import { BuiltBy } from '../components/BuiltBy.tsx'
import { ConsultantOffer } from '../components/ConsultantOffer.tsx'
import { EvalResults, resultsSummary } from '../components/EvalResults.tsx'
import { HowTested } from '../components/HowTested.tsx'
import { PilotOffer } from '../components/PilotOffer.tsx'

// Landing: hero over a slow gradient mesh, then a bento grid of modes and what the tool does.
export function ModeScreen({
  onMode,
  onSample,
}: {
  onMode: (m: Mode) => void
  onSample: (m: Mode) => void
}) {
  return (
    <div className="relative isolate">
      <div className="mesh" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 pt-16 pb-20 md:pt-28">
        <div className="flex flex-col items-start gap-6">
          <span className="eyebrow glass enter">
            <span className="pulse-dot" aria-hidden="true" />
            {t('privacy.note')}
          </span>
          <h1 className="display text-gradient enter max-w-4xl">{t('hero.headline')}</h1>
          <p className="enter-2 max-w-2xl text-[18px] leading-relaxed text-[var(--muted)] md:text-[20px]">
            {t('hero.subline')}
          </p>
          <p className="enter-2 max-w-2xl text-[16px] font-medium">{t('hero.audience')}</p>
          <p className="enter-2 max-w-2xl text-[15px] text-[var(--muted)]">
            {resultsSummary()}{' '}
            <a href="#results" className="btn-link">
              {t('results.summaryLink')}
            </a>
          </p>
          <div className="enter-2 flex flex-wrap items-center gap-x-5 gap-y-3 pt-2">
            <button
              type="button"
              className="btn-primary btn-hero"
              onClick={() => onSample('company')}
            >
              <Icon name="sparkle" size={18} />
              {t('mode.sample')}
            </button>

            <button type="button" className="btn-link" onClick={() => onSample('client')}>
              {t('mode.client.sample')}
            </button>
            <p className="max-w-xs text-[14px] text-[var(--muted)]">{t('mode.sampleNote')}</p>
          </div>
        </div>

        <section className="enter-3 flex flex-col gap-4" aria-labelledby="mode-title">
          <h2 id="mode-title" className="kicker">
            {t('mode.title')}
          </h2>
          <div className="bento">
            <button
              type="button"
              className="tile tile-interactive glass span-3"
              onClick={() => onMode('company')}
            >
              <span className="card-icon">
                <Icon name="answer" />
              </span>
              <span className="text-[22px] font-semibold tracking-tight">
                {t('mode.company.title')}
              </span>
              <span className="text-[var(--muted)]">{t('mode.company.body')}</span>
              <span className="tile-arrow">
                {t('mode.start')} <span aria-hidden="true">→</span>
              </span>
            </button>
            <button
              type="button"
              className="tile tile-interactive glass span-3"
              onClick={() => onMode('client')}
            >
              <span className="card-icon">
                <Icon name="review" />
              </span>
              <span className="text-[22px] font-semibold tracking-tight">
                {t('mode.client.title')}
              </span>
              <span className="text-[var(--muted)]">{t('mode.client.body')}</span>
              <span className="tile-arrow">
                {t('mode.start')} <span aria-hidden="true">→</span>
              </span>
            </button>

            <article className="tile glass span-4 rows-2">
              <span className="kicker">{t('bento.evidence.example')}</span>
              <h3 className="text-[22px] font-semibold tracking-tight">
                {t('bento.evidence.title')}
              </h3>
              <p className="max-w-xl text-[var(--muted)]">{t('bento.evidence.body')}</p>
              <figure className="evidence-card mt-3 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{t('bento.evidence.question')}</span>
                  <StatusChip status="FOUND" />
                </div>
                <blockquote className="quote leading-relaxed">
                  “<mark className="quote-hl">{t('bento.evidence.quote')}</mark>”
                </blockquote>
                <figcaption className="text-[14px] text-[var(--muted)]">
                  {t('bento.evidence.source')}
                </figcaption>
              </figure>
            </article>
            <article className="tile glass span-2">
              <span className="card-icon">
                <Icon name="lock" />
              </span>
              <h3 className="text-[18px] font-semibold">{t('bento.local.title')}</h3>
              <p className="text-[14px] text-[var(--muted)]">{t('bento.local.body')}</p>
            </article>
            <article className="tile glass span-2">
              <span className="text-[40px] leading-none font-semibold tracking-tight tabular-nums">
                {art28.rules.length}
              </span>
              <h3 className="text-[18px] font-semibold">{t('bento.rules.title')}</h3>
              <p className="text-[14px] text-[var(--muted)]">{t('bento.rules.body')}</p>
            </article>
            <article className="tile glass span-6 md:flex-row md:items-center md:gap-6">
              <span className="card-icon">
                <Icon name="upload" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-[18px] font-semibold">{t('bento.export.title')}</h3>
                <p className="text-[14px] text-[var(--muted)]">{t('bento.export.body')}</p>
              </div>
            </article>
          </div>
        </section>
        <PilotOffer />
        <ConsultantOffer />
        <EvalResults />
        <HowTested />
        <BuiltBy />
      </div>
    </div>
  )
}
