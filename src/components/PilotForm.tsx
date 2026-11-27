import { useId, useState } from 'react'
import { AUTHOR } from '../app/config.ts'
import { t, tf } from '../i18n/t.ts'
import { EmailLine } from './EmailLine.tsx'

// Builds the pilot request as an email; nothing is sent or stored by this page (CSP form-action 'none').
const ROLES = ['company', 'consultant'] as const
const WHAT = ['dpa', 'questionnaire', 'vendor'] as const

export function pilotMail(body: string): string {
  return `mailto:${AUTHOR.email}?subject=${encodeURIComponent(t('pilot.form.subject'))}&body=${encodeURIComponent(body)}`
}

export function PilotForm() {
  const id = useId()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState<(typeof ROLES)[number]>('company')
  const [what, setWhat] = useState<(typeof WHAT)[number]>('dpa')
  const [deadline, setDeadline] = useState('')
  const [consent, setConsent] = useState(false)
  const [body, setBody] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  if (body !== null)
    return (
      <div className="flex flex-col gap-3" role="status">
        <p>{t('pilot.form.ready')}</p>
        <pre className="quote text-[13px] whitespace-pre-wrap">{body}</pre>
        <div className="flex flex-wrap gap-3">
          <a href={pilotMail(body)} className="btn-primary">
            {t('pilot.form.open')}
          </a>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void navigator.clipboard?.writeText(body).then(() => setCopied(true))}
          >
            {copied ? t('contact.copied') : t('pilot.form.copy')}
          </button>
        </div>
        <EmailLine />
      </div>
    )

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      aria-labelledby={`${id}-title`}
      onSubmit={(e) => {
        e.preventDefault()
        setBody(
          tf('pilot.form.body', {
            name: name.trim(),
            company: company.trim(),
            role: t(`pilot.form.role.${role}`),
            what: t(`pilot.form.what.${what}`),
            deadline: deadline.trim(),
          }),
        )
      }}
    >
      <h3 id={`${id}-title`} className="font-semibold sm:col-span-2">
        {t('pilot.formTitle')}
      </h3>
      <p className="text-[14px] text-[var(--muted)] sm:col-span-2">{t('pilot.formIntro')}</p>
      <label className="field">
        {t('pilot.form.name')}
        <input required value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="field">
        {t('pilot.form.company')}
        <input required value={company} onChange={(e) => setCompany(e.target.value)} />
      </label>
      <label className="field">
        {t('pilot.form.role')}
        <select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {t(`pilot.form.role.${r}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        {t('pilot.form.what')}
        <select value={what} onChange={(e) => setWhat(e.target.value as typeof what)}>
          {WHAT.map((w) => (
            <option key={w} value={w}>
              {t(`pilot.form.what.${w}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="field sm:col-span-2">
        {t('pilot.form.deadline')}
        <input value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </label>
      <label className="flex items-start gap-2 text-[14px] sm:col-span-2">
        <input
          type="checkbox"
          required
          className="mt-1"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        {t('pilot.form.consent')}
      </label>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary">
          {t('pilot.form.submit')}
        </button>
      </div>
    </form>
  )
}
