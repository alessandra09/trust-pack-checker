import { t, tf } from '../i18n/t.ts'
import type { Mode } from '../app/types.ts'
import { AUTHOR } from '../app/config.ts'
import { Icon, type IconName } from '../components/Icon.tsx'
import { StatusChip } from '../components/StatusChip.tsx'
import { art28 } from '../data/load.ts'
import { EvalResults } from '../components/EvalResults.tsx'
import { PilotOffer } from '../components/PilotOffer.tsx'
import { href, PAGE_PATH } from '../pages/paths.ts'

// Landing (DESIGN2 section 4): hero with the quote card, proof strip, how it works, use cases,
// measured results, one pilot section. One primary button per screen.
const PROOF: { icon: IconName; text: () => string }[] = [
  { icon: 'lock', text: () => t('proof.local') },
  { icon: 'file', text: () => tf('proof.rules', { n: String(art28.rules.length) }) },
  { icon: 'check', text: () => t('proof.verbatim') },
]
const STEPS: { icon: IconName; n: 1 | 2 | 3 }[] = [
  { icon: 'upload', n: 1 },
  { icon: 'lock', n: 2 },
  { icon: 'check', n: 3 },
]

function QuoteCard() {
  return (
    <figure className="evidence-card enter-2 flex flex-col gap-4">
      <div className="doc-meta">
        <span>{t('bento.evidence.source')}</span>
        <span className="kicker">{t('bento.evidence.example')}</span>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="font-medium">{t('bento.evidence.question')}</span>
        <StatusChip status="FOUND" />
      </div>
      <blockquote className="quote">
        “<mark className="quote-hl">{t('bento.evidence.quote')}</mark>”
      </blockquote>
      <figcaption className="text-[14px] text-[var(--muted)]">
        {t('bento.evidence.body')}
      </figcaption>
    </figure>
  )
}

export function ModeScreen({
  onMode,
  onSample,
}: {
  onMode: (m: Mode) => void
  onSample: (m: Mode) => void
}) {
  return (
    <div className="flex flex-col">
      <section className="page-wrap pt-12 pb-16 md:pt-24 md:pb-24" aria-labelledby="hero-title">
        <div className="hero-grid">
          <div className="flex max-w-[640px] flex-col items-start gap-6">
            <h1 id="hero-title" className="display enter">
              {t('hero.headline')}
            </h1>
            <p className="lede enter">{t('hero.subline')}</p>
            <div className="enter-2 flex flex-wrap items-center gap-x-6 gap-y-3">
              <button
                type="button"
                className="btn-primary btn-hero"
                onClick={() => onSample('company')}
              >
                {t('mode.sample')}
              </button>
              <a href={AUTHOR.pilotForm || href(PAGE_PATH.pilot)} className="btn-link">
                {t('consult.cta')}
              </a>
            </div>
            <p className="enter-2 text-[14px] text-[var(--muted)]">{t('mode.sampleNote')}</p>
            <p className="enter-2 max-w-[560px] text-[15px] text-[var(--muted)]">
              {AUTHOR.linkedin ? (
                <a
                  href={AUTHOR.linkedin}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[var(--text)] underline decoration-[var(--border-strong)] underline-offset-4 hover:decoration-[var(--accent)]"
                >
                  {tf('hero.builtBy', { name: AUTHOR.name })}
                </a>
              ) : (
                tf('hero.builtBy', { name: AUTHOR.name })
              )}
            </p>
          </div>
          <QuoteCard />
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)] py-8">
        <ul className="page-wrap proof-strip">
          {PROOF.map((p) => (
            <li key={p.icon} className="proof">
              <span className="card-icon !mb-0">
                <Icon name={p.icon} />
              </span>
              {p.text()}
            </li>
          ))}
        </ul>
      </section>

      <section className="page-wrap py-[var(--section)]" aria-labelledby="steps-title">
        <h2 id="steps-title" className="h2 mb-10">
          {t('steps.title')}
        </h2>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.n} className="flex flex-col gap-2">
              <span className="card-icon">
                <Icon name={s.icon} />
              </span>
              <span className="step-num">{s.n}.</span>
              <h3 className="text-[18px] font-semibold">{t(`steps.${s.n}.title`)}</h3>
              <p className="max-w-[34ch] text-[var(--muted)]">{t(`steps.${s.n}.body`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section page-wrap" aria-labelledby="mode-title">
        <h2 id="mode-title" className="h2 mb-8">
          {t('mode.title')}
        </h2>
        <div className="bento">
          {(['company', 'client'] as const).map((m) => (
            <div key={m} className="tile glass gap-3">
              <span className="card-icon">
                <Icon name={m === 'company' ? 'answer' : 'review'} />
              </span>
              <h3 className="text-[20px] font-semibold tracking-tight">{t(`mode.${m}.title`)}</h3>
              <p className="text-[var(--muted)]">{t(`mode.${m}.body`)}</p>
              <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-3">
                <button
                  type="button"
                  className="btn-secondary"
                  aria-label={`${t('mode.start')}: ${t(`mode.${m}.title`)}`}
                  onClick={() => onMode(m)}
                >
                  {t('mode.start')} <span aria-hidden="true">→</span>
                </button>
                {m === 'client' ? (
                  <button type="button" className="btn-link" onClick={() => onSample('client')}>
                    {t('mode.client.sample')}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="section page-wrap">
        <EvalResults />
      </div>
      <div className="section page-wrap">
        <PilotOffer />
      </div>
    </div>
  )
}
