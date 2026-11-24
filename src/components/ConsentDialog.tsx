import { useEffect, useRef } from 'react'
import { CONFIRM_ABOVE_CALLS, type CostEstimate } from '../core/llm/cost.ts'
import { t } from '../i18n/t.ts'

type Props = { estimate: CostEstimate; onSend: () => void; onNoAi: () => void }

const usd = (n: number) => (n < 0.01 ? '< $0.01' : `$${n.toFixed(2)}`)

// Consent before the first call (SPEC 12.1): provider, what is sent, policy link, equal-weight "Use without AI".
export function ConsentDialog({ estimate, onSend, onNoAi }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onNoAi()
      }}
      aria-labelledby="consent-title"
      className="dialog max-w-lg"
    >
      <h2 id="consent-title" className="text-[18px] font-semibold">
        {t('consent.title')}
      </h2>
      <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-[14px]">
        <li>{t('consent.provider')}</li>
        <li>{t('consent.sent')}</li>
        <li>{t('consent.notSent')}</li>
      </ul>
      <p className="mt-3 text-[14px]">
        <a
          href="https://www.anthropic.com/legal/privacy"
          target="_blank"
          rel="noreferrer noopener"
          className="underline"
        >
          {t('consent.policy')}
        </a>
      </p>
      <p className="mt-3 text-[14px]" data-testid="consent-estimate">
        {t('consent.estimate')}: {estimate.calls} {t('consent.calls')}, {usd(estimate.lowUsd)}
        {' – '}
        {usd(estimate.highUsd)}
      </p>
      {estimate.calls > CONFIRM_ABOVE_CALLS ? (
        <p className="mt-2 text-[14px] font-semibold" role="alert">
          {t('consent.many')}
        </p>
      ) : null}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button type="button" className="btn-secondary" onClick={onNoAi}>
          {t('consent.noAi')}
        </button>
        <button type="button" className="btn-secondary" onClick={onSend}>
          {t('consent.send')}
        </button>
      </div>
    </dialog>
  )
}
