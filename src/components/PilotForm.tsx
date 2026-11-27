import { useId, useState } from 'react'
import { AUTHOR } from '../app/config.ts'
import { t, tf } from '../i18n/t.ts'
import { EmailLine } from './EmailLine.tsx'

// Builds the pilot request as an email; nothing is sent or stored by this page (CSP form-action 'none').
export const PILOT_TYPES = ['consultant', 'company', 'procurement', 'other'] as const
export type PilotType = (typeof PILOT_TYPES)[number]
export type PilotRequest = {
  name: string
  company: string
  role: string
  type: PilotType
  what: string
}

export function pilotBody(r: PilotRequest): string {
  return tf('pilot.form.body', {
    name: r.name.trim(),
    company: r.company.trim(),
    role: r.role.trim(),
    type: t(`pilot.form.type.${r.type}`),
    what: r.what.trim(),
  })
}

export function pilotMail(body: string): string {
  return `mailto:${AUTHOR.email}?subject=${encodeURIComponent(t('pilot.form.subject'))}&body=${encodeURIComponent(body)}`
}

const EMPTY: PilotRequest = { name: '', company: '', role: '', type: 'consultant', what: '' }

export function PilotForm() {
  const id = useId()
  const [req, setReq] = useState<PilotRequest>(EMPTY)
  const [consent, setConsent] = useState(false)
  const [body, setBody] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const set = (k: keyof PilotRequest) => (e: { target: { value: string } }) =>
    setReq({ ...req, [k]: e.target.value })

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
      aria-label={t('page.pilot.formTitle')}
      onSubmit={(e) => {
        e.preventDefault()
        setBody(pilotBody(req))
      }}
    >
      <label className="field" htmlFor={`${id}-name`}>
        {t('pilot.form.name')}
        <input
          id={`${id}-name`}
          required
          autoComplete="name"
          value={req.name}
          onChange={set('name')}
        />
      </label>
      <label className="field" htmlFor={`${id}-company`}>
        {t('pilot.form.company')}
        <input
          id={`${id}-company`}
          required
          autoComplete="organization"
          value={req.company}
          onChange={set('company')}
        />
      </label>
      <label className="field" htmlFor={`${id}-role`}>
        {t('pilot.form.role')}
        <input
          id={`${id}-role`}
          autoComplete="organization-title"
          value={req.role}
          onChange={set('role')}
        />
      </label>
      <label className="field" htmlFor={`${id}-type`}>
        {t('pilot.form.type')}
        <select id={`${id}-type`} value={req.type} onChange={set('type')}>
          {PILOT_TYPES.map((v) => (
            <option key={v} value={v}>
              {t(`pilot.form.type.${v}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="field sm:col-span-2" htmlFor={`${id}-what`}>
        {t('pilot.form.what')}
        <textarea id={`${id}-what`} required rows={3} value={req.what} onChange={set('what')} />
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
