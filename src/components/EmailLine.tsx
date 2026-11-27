import { useState } from 'react'
import { AUTHOR } from '../app/config.ts'
import { t } from '../i18n/t.ts'

// The address as plain text with a copy button: mailto: links do nothing where no mail app is set up.
export function EmailLine() {
  const [copied, setCopied] = useState(false)
  if (!AUTHOR.email) return null
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px]">
      <span className="text-[var(--muted)]">{t('contact.emailLabel')}</span>
      <span className="font-medium select-all">{AUTHOR.email}</span>
      <button
        type="button"
        className="btn-link"
        onClick={() => {
          void navigator.clipboard?.writeText(AUTHOR.email).then(() => setCopied(true))
        }}
      >
        {copied ? t('contact.copied') : t('contact.copy')}
      </button>
      <span role="status" className="sr-only">
        {copied ? t('contact.copied') : ''}
      </span>
    </p>
  )
}
