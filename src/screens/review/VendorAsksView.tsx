import { useState } from 'react'
import { art28, consistency } from '../../data/load.ts'
import { t } from '../../i18n/t.ts'
import type { Analysis } from '../../app/types.ts'

type Ask = { key: string; ref: string; text: string }

/** Client mode gaps tab (SPEC 11.2): questions to send the vendor, from the rules' suggestedAsk. */
export function vendorAsks(analysis: Analysis): { answers: Ask[]; contract: Ask[] } {
  const byRule = new Map<string, string[]>()
  for (const f of analysis.consistency) {
    if (f.reviewed === 'rejected') continue
    byRule.set(f.ruleId, [...(byRule.get(f.ruleId) ?? []), f.qid])
  }
  const answers = consistency.rules.flatMap((r) => {
    const qids = byRule.get(r.id)
    return qids ? [{ key: r.id, ref: [...new Set(qids)].join(', '), text: r.suggestedAsk }] : []
  })
  const contract = analysis.findings
    .filter((f) => f.status === 'NOT_FOUND' && f.reviewed !== 'rejected')
    .flatMap((f) => art28.rules.filter((r) => r.id === f.ruleId))
    .map((r) => ({
      key: r.id,
      ref: r.article === 'n/a' ? r.title : r.article,
      text: r.suggestedAsk,
    }))
  return { answers, contract }
}

function AskList({ title, asks }: { title: string; asks: Ask[] }) {
  return (
    <section>
      <h2 className="text-[18px] font-semibold">{title}</h2>
      {asks.length ? (
        <ol className="mt-2 flex list-decimal flex-col gap-2 pl-6">
          {asks.map((a) => (
            <li key={a.key}>
              {a.text} <span className="font-mono text-[13px] text-[var(--muted)]">({a.ref})</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[var(--muted)]">{t('gaps.none')}</p>
      )}
    </section>
  )
}

export function VendorAsksView({ analysis }: { analysis: Analysis }) {
  const [copied, setCopied] = useState(false)
  const { answers, contract } = vendorAsks(analysis)
  const text = [...answers, ...contract].map((a, i) => `${i + 1}. ${a.text}`).join('\n')
  return (
    <div className="flex flex-col gap-6">
      <p className="text-[14px] text-[var(--muted)]">{t('vendor.asks.intro')}</p>
      <AskList title={t('vendor.asks.contradictions')} asks={answers} />
      <AskList title={t('vendor.asks.contract')} asks={contract} />
      <div>
        <button
          type="button"
          className="btn-secondary"
          disabled={text === ''}
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
