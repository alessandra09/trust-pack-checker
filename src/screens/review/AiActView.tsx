import { useState } from 'react'
import { buildDisclosure } from '../../core/aiact/disclosure.ts'
import {
  screeningFlags,
  verifiedDates,
  type AiAnswers,
  type EmotionGroup,
} from '../../core/aiact/flags.ts'
import { aiQuestions, dates } from '../../data/load.ts'
import { t, tf } from '../../i18n/t.ts'

// SPEC 10 / SPRINT2 task 8: AI use declaration form, five screening flags, key dates. No verdict, ever.
const q = (id: string) => aiQuestions.questions.find((x) => x.id === id)?.text ?? id
const GROUPS: EmotionGroup[] = ['customers', 'callers', 'employees', 'students']
const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

type Props = { answers: AiAnswers; onChange: (a: AiAnswers) => void }

function Choice<K extends keyof AiAnswers>({
  name,
  legend,
  options,
  answers,
  onChange,
}: Props & { name: K; legend: string; options: string[] }) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-[14px] font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-4">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-1 text-[14px]">
            <input
              type="radio"
              name={name}
              checked={answers[name] === o}
              onChange={() => onChange({ ...answers, [name]: o })}
            />
            {t(`aiact.option.${o}` as Parameters<typeof t>[0])}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function AiActView({ answers, onChange }: Props) {
  const [copied, setCopied] = useState(false)
  const flags = screeningFlags(answers, aiQuestions.flags, dates.dates)
  const text = buildDisclosure(answers)
  const yn = ['yes', 'no']
  const p = { answers, onChange }
  return (
    <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
      <form
        className="flex flex-col gap-5"
        aria-label={t('aiact.formTitle')}
        onSubmit={(e) => e.preventDefault()}
      >
        <div>
          <h2 className="text-[18px] font-semibold">{t('aiact.formTitle')}</h2>
          <p className="text-[14px] text-[var(--muted)]">{t('aiact.intro')}</p>
        </div>
        <Choice {...p} name="q1" legend={q('Q1')} options={yn} />
        <label className="flex flex-col gap-1 text-[14px] font-medium">
          {q('Q2')}
          <textarea
            className="input min-h-20 font-normal"
            value={answers.q2}
            placeholder={t('aiact.q2Placeholder')}
            onChange={(e) => onChange({ ...answers, q2: e.target.value })}
          />
        </label>
        <Choice {...p} name="q3" legend={q('Q3')} options={['yes', 'no', 'unknown']} />
        <Choice {...p} name="q4" legend={q('Q4')} options={['always', 'sometimes', 'never']} />
        <label className="flex flex-col gap-1 text-[14px] font-medium">
          {q('Q5')}
          <input
            className="input font-normal"
            value={answers.q5}
            onChange={(e) => onChange({ ...answers, q5: e.target.value })}
          />
        </label>
        <Choice {...p} name="q6" legend={q('Q6')} options={yn} />
        {answers.q6 === 'yes' ? (
          <Choice {...p} name="q6told" legend={t('aiact.q6told')} options={yn} />
        ) : null}
        <Choice {...p} name="q7" legend={q('Q7')} options={yn} />
        <Choice {...p} name="q8" legend={q('Q8')} options={yn} />
        <Choice {...p} name="q9" legend={q('Q9')} options={yn} />
        {answers.q9 === 'yes' ? (
          <fieldset className="flex flex-col gap-1">
            <legend className="text-[14px] font-medium">{t('aiact.q9groups')}</legend>
            <div className="flex flex-wrap gap-4">
              {GROUPS.map((g) => (
                <label key={g} className="flex items-center gap-1 text-[14px]">
                  <input
                    type="checkbox"
                    checked={answers.q9groups.includes(g)}
                    onChange={(e) =>
                      onChange({
                        ...answers,
                        q9groups: e.target.checked
                          ? [...answers.q9groups, g]
                          : answers.q9groups.filter((x) => x !== g),
                      })
                    }
                  />
                  {t(`aiact.group.${g}`)}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        <Choice {...p} name="q10" legend={q('Q10')} options={yn} />
      </form>

      <div className="flex flex-col gap-6">
        <section aria-labelledby="aiact-flags">
          <h2 id="aiact-flags" className="text-[18px] font-semibold">
            {t('aiact.flagsTitle')}
          </h2>
          <p className="text-[14px] text-[var(--muted)]">{t('aiact.noVerdict')}</p>
          {flags.length ? (
            <ul className="mt-2 flex flex-col gap-3">
              {flags.map((f) => (
                <li
                  key={f.id}
                  data-flag={f.id}
                  className="rounded-[10px] border border-[var(--border)] p-3 text-[14px]"
                >
                  <p>{f.text}</p>
                  {f.date ? (
                    <p className="mt-1 text-[var(--muted)]">
                      {f.date.label}: {fmt(f.date.date)} ·{' '}
                      <a href={f.date.source} target="_blank" rel="noreferrer">
                        {t('aiact.source')}
                      </a>{' '}
                      · {tf('aiact.lastVerified', { date: fmt(f.date.lastVerified ?? '') })}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[14px]">{t('aiact.noFlags')}</p>
          )}
        </section>
        <section aria-labelledby="aiact-disclosure">
          <h2 id="aiact-disclosure" className="text-[18px] font-semibold">
            {t('aiact.disclosureTitle')}
          </h2>
          {text ? (
            <>
              <p
                className="mt-2 rounded-[10px] bg-[var(--surface-2)] p-3 text-[14px]"
                data-testid="ai-disclosure"
              >
                {text}
              </p>
              <button
                type="button"
                className="btn-secondary mt-2"
                onClick={() => {
                  void navigator.clipboard.writeText(text)
                  setCopied(true)
                }}
              >
                {copied ? t('action.copied') : t('action.copy')}
              </button>
            </>
          ) : (
            <p className="mt-2 text-[14px] text-[var(--muted)]">{t('aiact.disclosureEmpty')}</p>
          )}
        </section>
        <section aria-labelledby="aiact-dates">
          <h2 id="aiact-dates" className="text-[18px] font-semibold">
            {t('aiact.datesTitle')}
          </h2>
          <ul className="mt-2 flex flex-col gap-2 text-[14px]">
            {verifiedDates(dates.dates).map((d) => (
              <li key={d.id}>
                <span className="font-medium tabular-nums">{fmt(d.date)}</span> {d.label}.{' '}
                <a href={d.source} target="_blank" rel="noreferrer">
                  {t('aiact.source')}
                </a>{' '}
                <span className="text-[var(--muted)]">
                  · {tf('aiact.lastVerified', { date: fmt(d.lastVerified ?? '') })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
