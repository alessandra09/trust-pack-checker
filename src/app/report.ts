import type { Evidence, Status } from '../core/types.ts'
import { art28, consistency } from '../data/load.ts'
import { t, tf, type MessageKey } from '../i18n/t.ts'
import type { Analysis, Mode } from './types.ts'

// One-page printable HTML report (pilot deliverable). Document text is untrusted, so every value is escaped
// and the file carries no script. Only verified quotes are printed as quotes.

export type ReportInput = {
  analysis: Analysis
  mode: Mode
  documents: string[]
  date: string
}

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  )

const status = (s: Status) => t(`status.${s}` as MessageKey)
const ruleTitle = (id: string) => art28.rules.find((r) => r.id === id)?.title ?? id
const checkTitle = (id: string) => consistency.rules.find((r) => r.id === id)?.title ?? id

function quote(e: Evidence | undefined): string {
  if (!e?.verified) return ''
  const page = e.page > 0 ? `, ${t('report.page')} ${e.page}` : ''
  return `<blockquote>“${esc(e.quote)}”<cite>${esc(e.docName)}${page}</cite></blockquote>`
}

function vendorSection(a: Analysis): string {
  if (a.consistency.length === 0) return `<p>${esc(t('vendor.none'))}</p>`
  return a.consistency
    .map((f) => {
      const rule = consistency.rules.find((r) => r.id === f.ruleId)
      return `<article>
<h3>${esc(checkTitle(f.ruleId))} <span class="chip ${f.status}">${esc(status(f.status))}</span></h3>
<p class="diff">${esc(tf(`vendor.kind.${f.kind}` as MessageKey, f.detail))}</p>
<div class="pair"><div><h4>${esc(t('vendor.answer'))}</h4>${quote(f.answer)}</div>
<div><h4>${esc(t('vendor.contract'))}</h4>${f.contract.map(quote).join('') || `<p class="muted">${esc(t('report.noContractQuote'))}</p>`}</div></div>
${rule ? `<p><strong>${esc(t('vendor.ask'))}:</strong> ${esc(rule.suggestedAsk)}</p>` : ''}
</article>`
    })
    .join('\n')
}

function rulesSection(a: Analysis): string {
  const rows = a.findings
    .map((f) => {
      const ev = f.status === 'FOUND' || f.status === 'PARTIAL' ? quote(f.evidence[0]) : ''
      const ask =
        f.status !== 'FOUND' && f.suggestedAsk
          ? `<p class="ask"><strong>${esc(t('vendor.ask'))}:</strong> ${esc(f.suggestedAsk)}</p>`
          : ''
      return `<tr><td>${esc(ruleTitle(f.ruleId))}</td><td><span class="chip ${f.status}">${esc(status(f.status))}</span></td><td>${ev}${ask}</td></tr>`
    })
    .join('\n')
  return `<table><thead><tr><th>${esc(t('report.col.element'))}</th><th>${esc(t('report.col.result'))}</th><th>${esc(t('report.col.evidence'))}</th></tr></thead><tbody>${rows}</tbody></table>`
}

function counts(statuses: Status[]): string {
  const order: Status[] = ['FOUND', 'PARTIAL', 'NOT_FOUND', 'CONFLICT', 'NEEDS_HUMAN']
  return order
    .map((s) => [s, statuses.filter((x) => x === s).length] as const)
    .filter(([, n]) => n > 0)
    .map(([s, n]) => `<li><span class="chip ${s}">${esc(status(s))}</span> ${n}</li>`)
    .join('')
}

export function buildReport({ analysis: a, mode, documents, date }: ReportInput): string {
  const vendor = mode === 'client'
  const answers = Object.values(a.answers).map((x) => x.status)
  const sections = [
    vendor
      ? `<section><h2>${esc(t('report.vendorTitle'))}</h2><p class="muted">${esc(t('vendor.checks'))}</p>${vendorSection(a)}</section>`
      : '',
    `<section><h2>${esc(t('report.rulesTitle'))}</h2><ul class="counts">${counts(a.findings.map((f) => f.status))}</ul>${rulesSection(a)}</section>`,
    !vendor && answers.length > 0
      ? `<section><h2>${esc(t('report.answersTitle'))}</h2><ul class="counts">${counts(answers)}</ul><p class="muted">${esc(t('report.answersNote'))}</p></section>`
      : '',
  ]
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
<title>${esc(t('report.title'))}</title>
<style>${STYLE}</style></head><body>
<header><h1>${esc(t('report.title'))}</h1>
<p class="muted">${esc(t('report.date'))}: ${esc(date)} · ${esc(t('report.documents'))}: ${documents.map(esc).join(', ')}</p>
<p class="note">${esc(t('footer.disclaimer'))} ${esc(t('footer.rulesNotReviewed'))} ${esc(t('report.method'))}</p></header>
${sections.join('\n')}
<footer class="muted">${esc(t('report.footer'))}</footer>
</body></html>
`
}

const STYLE = `body{font:14px/1.5 system-ui,sans-serif;color:#1d1d1f;max-width:900px;margin:24px auto;padding:0 20px}
h1{font-size:24px;margin:0 0 4px}h2{font-size:18px;margin:28px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
h3{font-size:15px;margin:16px 0 4px}h4{font-size:12px;text-transform:uppercase;color:#666;margin:4px 0}
.muted{color:#666}.note{background:#f5f5f7;padding:8px 12px;border-radius:8px}
table{width:100%;border-collapse:collapse}th,td{text-align:left;vertical-align:top;padding:6px 8px;border-bottom:1px solid #eee}
th{font-size:12px;color:#666}td:first-child{width:30%}td:nth-child(2){width:16%;white-space:nowrap}
blockquote{margin:2px 0;padding:4px 8px;border-left:3px solid #999;background:#fafafa}
cite{display:block;font-size:12px;color:#666;font-style:normal}
.chip{display:inline-block;font-size:12px;padding:1px 8px;border-radius:10px;background:#eee;font-weight:500}
.FOUND{background:#e3f4e8}.PARTIAL{background:#fff3d6}.NOT_FOUND,.CONFLICT{background:#fde4e1}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.diff{font-weight:500}
.counts{list-style:none;padding:0;display:flex;gap:16px;flex-wrap:wrap}.ask{margin:4px 0;font-size:13px}
article{border-bottom:1px solid #eee;padding-bottom:8px}footer{margin-top:32px;font-size:12px}
@media print{body{margin:0}article,tr{break-inside:avoid}}`
