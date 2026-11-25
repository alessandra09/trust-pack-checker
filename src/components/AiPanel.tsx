import { useId } from 'react'
import { t } from '../i18n/t.ts'

type Props = {
  enabled: boolean
  onEnabled: (on: boolean) => void
  apiKey: string
  onKey: (key: string) => void
  remember: boolean
  onRemember: (on: boolean) => void
}

// Optional AI step (SPEC 12.1). Off by default; no-AI mode stays fully usable.
export function AiPanel({ enabled, onEnabled, apiKey, onKey, remember, onRemember }: Props) {
  const ids = { title: useId(), key: useId(), warn: useId() }
  return (
    <section className="panel p-5" aria-labelledby={ids.title}>
      <h2 id={ids.title} className="font-semibold">
        {t('ai.title')}
      </h2>
      <p className="mt-1 text-[14px] text-[var(--muted)]">{t('ai.body')}</p>
      <label className="mt-3 flex items-center gap-2">
        <input type="checkbox" checked={enabled} onChange={(e) => onEnabled(e.target.checked)} />
        {t('ai.enable')}
      </label>
      {enabled ? (
        <div className="mt-3 grid gap-3">
          <label htmlFor={ids.key} className="field">
            {t('ai.key')}
            <input
              id={ids.key}
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={apiKey}
              onChange={(e) => onKey(e.target.value.trim())}
            />
          </label>
          <label className="flex items-center gap-2 text-[14px]">
            <input
              type="checkbox"
              checked={remember}
              aria-describedby={ids.warn}
              onChange={(e) => onRemember(e.target.checked)}
            />
            {t('ai.remember')}
          </label>
          <p id={ids.warn} className="text-[14px] text-[var(--muted)]">
            {t('ai.rememberWarning')}
          </p>
        </div>
      ) : null}
    </section>
  )
}
