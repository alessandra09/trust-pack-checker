import { useState } from 'react'
import { art28 } from '../../data/load.ts'
import { t } from '../../i18n/t.ts'
import type { Analysis } from '../../app/types.ts'

export function GapsView({ analysis }: { analysis: Analysis }) {
  const [copied, setCopied] = useState(false)
  const questions = analysis.questions.filter(
    (q) => analysis.answers[q.qid]?.status === 'NOT_FOUND',
  )
  const missing = analysis.findings
    .filter((f) => f.status === 'NOT_FOUND')
    .flatMap((f) => art28.rules.filter((r) => r.id === f.ruleId))
  const text = [
    ...questions.map((q) => `${q.qid}: ${q.text}`),
    ...missing.map((r) => `${r.article} ${r.title}`),
  ].join('\n')
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-[18px] font-semibold">{t('gaps.questions')}</h2>
        {questions.length ? (
          <ul className="mt-2 list-disc pl-6">
            {questions.map((q) => (
              <li key={q.qid}>
                <span className="font-mono text-[14px]">{q.qid}</span> {q.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[var(--muted)]">{t('gaps.none')}</p>
        )}
      </section>
      <section>
        <h2 className="text-[18px] font-semibold">{t('gaps.rules')}</h2>
        {missing.length ? (
          <ul className="mt-2 list-disc pl-6">
            {missing.map((r) => (
              <li key={r.id}>
                <span className="font-mono text-[14px]">{r.article}</span> {r.title}
                {r.class === 'practice' ? (
                  <span className="text-[14px] text-[var(--muted)]">
                    {' '}
                    · {t('evidence.goodPractice')}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[var(--muted)]">{t('gaps.none')}</p>
        )}
      </section>
      <div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            void navigator.clipboard.writeText(text)
            setCopied(true)
          }}
        >
          {copied ? t('action.copied') : t('action.copy')}
        </button>
      </div>
    </div>
  )
}
