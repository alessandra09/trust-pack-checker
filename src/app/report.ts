import type { Evidence, Status } from '../core/types.ts'
import { PROMPT_VERSION } from '../core/llm/prompts.ts'
import { art28, consistency } from '../data/load.ts'
import { t, tf, type MessageKey } from '../i18n/t.ts'
import { TOOL_VERSION } from './config.ts'
import type { Analysis, Mode } from './types.ts'

// Self-contained printable HTML report (SPRINT2 task 3). Document text is untrusted, so every value is
// escaped, the file carries no script and makes no requests. Only verified quotes are printed as quotes.

export type ReportInput = {
  analysis: Analysis
  mode: Mode
  documents: string[]
  date: string
  /** Sample report only: banner text and a link back to the site. */
  sample?: { backHref: string }
}

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  )
const tx = (k: MessageKey) => esc(t(k))
const ORDER: Status[] = ['FOUND', 'PARTIAL', 'NOT_FOUND', 'CONFLICT', 'NEEDS_HUMAN']
const chip = (s: Status) => `<span class="chip ${s}">${esc(t(`status.${s}` as MessageKey))}</span>`
const ruleTitle = (id: string) => art28.rules.find((r) => r.id === id)?.title ?? id
const check = (id: string) => consistency.rules.find((r) => r.id === id)

/** Prints a quote only when verifyQuote confirmed it; otherwise nothing. */
export function quote(e: Evidence | undefined): string {
  if (!e?.verified) return ''
  const page = e.page > 0 ? `, ${tx('report.page')} ${e.page}` : ''
  return `<blockquote>“${esc(e.quote)}”<cite>${esc(e.docName)}${page}</cite></blockquote>`
}

function counts(statuses: Status[]): string {
  const items = ORDER.map((s) => [s, statuses.filter((x) => x === s).length] as const)
    .filter(([, n]) => n > 0)
    .map(([s, n]) => `<li>${chip(s)} ${n}</li>`)
  return `<ul class="counts">${items.join('')}</ul>`
}

function vendorSection(a: Analysis): string {
  if (a.consistency.length === 0) return `<p>${tx('vendor.none')}</p>`
  return a.consistency
    .map(
      (f) => `<article>
<h3>${esc(check(f.ruleId)?.title ?? f.ruleId)} ${chip(f.status)}</h3>
<p class="diff">${esc(tf(`vendor.kind.${f.kind}` as MessageKey, f.detail))}</p>
<div class="pair"><div><h4>${tx('vendor.answer')}</h4>${quote(f.answer)}</div>
<div><h4>${tx('vendor.contract')}</h4>${f.contract.map(quote).join('') || `<p class="muted">${tx('report.noContractQuote')}</p>`}</div></div>
</article>`,
    )
    .join('\n')
}

function rulesSection(a: Analysis): string {
  const rows = a.findings.map((f) => {
    const ev = f.status === 'FOUND' || f.status === 'PARTIAL' ? f.evidence.map(quote).join('') : ''
    const ask =
      f.status !== 'FOUND' && f.suggestedAsk
        ? `<p class="ask"><strong>${tx('vendor.ask')}:</strong> ${esc(f.suggestedAsk)}</p>`
        : ''
    return `<tr><td>${esc(ruleTitle(f.ruleId))}</td><td>${chip(f.status)}</td><td>${ev}${ask}</td></tr>`
  })
  return `<table><thead><tr><th>${tx('report.col.element')}</th><th>${tx('report.col.result')}</th><th>${tx('report.col.evidence')}</th></tr></thead><tbody>${rows.join('\n')}</tbody></table>`
}

function answersSection(a: Analysis): string {
  const rows = a.questions.flatMap((q) => {
    const ans = a.answers[q.qid]
    if (!ans) return []
    const draft = ans.draft ? `<p>${esc(ans.draft)}</p>` : ''
    return [
      `<tr><td>${esc(q.text)}</td><td>${chip(ans.status)}</td><td>${draft}${ans.evidence.map(quote).join('')}</td></tr>`,
    ]
  })
  return `<table><thead><tr><th>${tx('report.answers.col.question')}</th><th>${tx('report.col.result')}</th><th>${tx('report.answers.col.answer')}</th></tr></thead><tbody>${rows.join('\n')}</tbody></table>`
}

function gapsSection(a: Analysis): string {
  const gaps = a.findings.filter((f) => f.status === 'NOT_FOUND')
  if (gaps.length === 0) return `<p>${tx('report.gapsNone')}</p>`
  return `<ul>${gaps.map((f) => `<li>${esc(ruleTitle(f.ruleId))}</li>`).join('')}</ul>`
}

function asksSection(a: Analysis): string {
  const asks = [
    ...a.consistency.flatMap((f) => check(f.ruleId)?.suggestedAsk ?? []),
    ...a.findings.filter((f) => f.status !== 'FOUND').flatMap((f) => f.suggestedAsk ?? []),
  ]
  return `<ol>${[...new Set(asks)].map((q) => `<li>${esc(q)}</li>`).join('')}</ol>`
}

export function buildReport({ analysis: a, mode, documents, date, sample }: ReportInput): string {
  const vendor = mode === 'client'
  const all = [
    ...a.findings.map((f) => f.status),
    ...a.consistency.map((f) => f.status),
    ...Object.values(a.answers).map((x) => x.status),
  ]
  const section = (title: string, body: string) => `<section><h2>${title}</h2>${body}</section>`
  const parts = [
    section(tx('report.summaryTitle'), counts(all)),
    vendor
      ? section(
          tx('report.vendorTitle'),
          `<p class="muted">${tx('vendor.checks')}</p>${vendorSection(a)}`,
        )
      : '',
    section(tx('report.rulesTitle'), rulesSection(a)),
    section(tx('report.gapsTitle'), gapsSection(a)),
    vendor ? section(tx('report.asksTitle'), asksSection(a)) : '',
    !vendor && a.questions.length > 0 ? section(tx('report.answersTitle'), answersSection(a)) : '',
    section(tx('notChecked.title'), `<p>${tx('notChecked.body')}</p>`),
  ]
  const banner = sample
    ? `<p class="banner">${tx('report.sampleBanner')} <a href="${esc(sample.backHref)}">${tx('report.back')}</a></p>`
    : ''
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
<title>${tx('report.title')}</title>
<style>${STYLE}</style></head><body>
${banner}
<header><h1>${tx('report.title')}</h1>
<p class="muted">${tx('report.date')}: ${esc(date)} · ${tx('report.mode')}: ${tx(vendor ? 'report.mode.client' : 'report.mode.company')}</p>
<p class="muted">${tx('report.documents')}: ${documents.map(esc).join(', ')}</p>
<p class="muted">${esc(tf('report.version', { tool: TOOL_VERSION, prompt: PROMPT_VERSION }))}</p>
<p class="note">${tx('report.disclaimer')} ${tx('report.method')}</p></header>
${parts.filter(Boolean).join('\n')}
<footer class="muted">${tx('report.disclaimer')}</footer>
</body></html>
`
}

const STYLE = `body{font:14px/1.5 system-ui,sans-serif;color:#1d1d1f;max-width:900px;margin:24px auto;padding:0 20px}
h1{font-size:24px;margin:0 0 4px}h2{font-size:18px;margin:28px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
h3{font-size:15px;margin:16px 0 4px}h4{font-size:12px;text-transform:uppercase;color:#555;margin:4px 0}
header p{margin:2px 0}.muted{color:#555}.note{background:#f5f5f7;padding:8px 12px;border-radius:8px;margin-top:8px}
.banner{background:#fff3d6;border:1px solid #e6c36a;padding:8px 12px;border-radius:8px;font-weight:500}
table{width:100%;border-collapse:collapse}th,td{text-align:left;vertical-align:top;padding:6px 8px;border-bottom:1px solid #eee}
th{font-size:12px;color:#555}td:first-child{width:30%}td:nth-child(2){width:16%;white-space:nowrap}
blockquote{margin:2px 0;padding:4px 8px;border-left:3px solid #999;background:#fafafa}
cite{display:block;font-size:12px;color:#555;font-style:normal}
.chip{display:inline-block;font-size:12px;padding:1px 8px;border-radius:10px;background:#eee;font-weight:500}
.FOUND{background:#e3f4e8}.PARTIAL{background:#fff3d6}.NOT_FOUND,.CONFLICT{background:#fde4e1}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.diff{font-weight:500}
.counts{list-style:none;padding:0;display:flex;gap:16px;flex-wrap:wrap}.ask{margin:4px 0;font-size:13px}
article{border-bottom:1px solid #eee;padding-bottom:8px}footer{margin-top:32px;font-size:12px}
@media print{body{margin:0;max-width:none}.banner a{display:none}article,tr,blockquote{break-inside:avoid}h2{break-after:avoid}}`
