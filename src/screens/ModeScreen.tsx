import { t } from '../i18n/t.ts'
import type { Mode } from '../app/types.ts'

export function ModeScreen({
  onMode,
  onSample,
}: {
  onMode: (m: Mode) => void
  onSample: () => void
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-[32px] leading-tight font-semibold">{t('hero.headline')}</h1>
        <p className="max-w-2xl text-[18px] text-[var(--muted)]">{t('hero.subline')}</p>
      </div>
      <h2 className="sr-only">{t('mode.title')}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <button type="button" className="card-button" onClick={() => onMode('company')}>
          <span className="text-[18px] font-semibold">{t('mode.company.title')}</span>
          <span className="text-[var(--muted)]">{t('mode.company.body')}</span>
        </button>
        <button type="button" className="card-button" disabled aria-describedby="client-soon">
          <span className="text-[18px] font-semibold">{t('mode.client.title')}</span>
          <span className="text-[var(--muted)]">{t('mode.client.body')}</span>
          <span id="client-soon" className="text-[14px] text-[var(--muted)]">
            {t('mode.client.soon')}
          </span>
        </button>
      </div>
      <div className="flex flex-col items-start gap-1">
        <button type="button" className="btn-primary" onClick={onSample}>
          {t('mode.sample')}
        </button>
        <p className="text-[14px] text-[var(--muted)]">{t('mode.sampleNote')}</p>
      </div>
      <p className="text-[14px] text-[var(--muted)]">{t('privacy.note')}</p>
    </div>
  )
}
