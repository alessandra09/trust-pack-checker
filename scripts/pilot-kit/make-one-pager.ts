import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import summary from '../../src/data/eval-summary.json'
import { AUTHOR } from '../../src/app/config.ts'
import { SITE_URL } from '../../src/pages/paths.ts'

// Writes docs/pilot-kit/09_one_pager.html (self-contained) and .pdf.
// Needs a running preview of the built site: npm run build && npx vite preview --port 4173
const BASE = process.argv[2] ?? 'http://localhost:4173/'
const exec = process.env.PW_CHROMIUM_PATH

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const score = (id: string) => {
  const m = summary.noAi.find((x) => x.id === id && x.group === 'new')
  if (!m) return '?'
  const n = m.packs === 1 ? 'one pack' : `${m.packs} packs`
  return `${m.value}/${m.total} <small>(${n}, small sample)</small>`
}

async function main() {
  const browser = await chromium.launch(exec ? { executablePath: exec } : {})
  const page = await browser.newPage({
    viewport: { width: 1280, height: 820 },
    deviceScaleFactor: 2,
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(BASE)
  await page.getByRole('button', { name: 'Or try the vendor sample' }).click()
  await page.getByText("Vendor's answer").first().waitFor()
  const shot = await page.screenshot({ type: 'jpeg', quality: 80 })
  const img = `data:image/jpeg;base64,${shot.toString('base64')}`

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Trust Pack Checker for DPO consultants</title>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">
<style>
@page{size:A4;margin:14mm}body{font:12.5px/1.5 system-ui,sans-serif;color:#1d1d1f;max-width:780px;margin:0 auto}
h1{font-size:26px;margin:0 0 4px}h2{font-size:15px;margin:16px 0 6px}.muted{color:#555}
img{width:100%;border:1px solid #ddd;border-radius:8px}ul{padding-left:18px;margin:4px 0}
.nums{display:flex;gap:12px}.nums div{flex:1;background:#f5f5f7;border-radius:8px;padding:8px 10px}
.nums b{display:block;font-size:22px}.cta{background:#eef0ff;border-radius:8px;padding:10px 12px;margin-top:12px}
footer{margin-top:12px;font-size:11px;color:#555}
</style></head><body>
<h1>A faster first pass on a DPA</h1>
<p class="muted">Trust Pack Checker, for DPO consultants and privacy firms who review processor agreements for clients.</p>
<h2>What it does</h2>
<ul>
<li>Checks a DPA against the GDPR Article 28 elements in its rule list.</li>
<li>Shows the exact quote and page behind every finding, or says "not found in text".</li>
<li>Compares a vendor's questionnaire answers with its DPA: breach notice periods, sub-processors, EU/EEA location claims, audit rights, AI training.</li>
<li>Drafts questions to send the other side.</li>
<li>Runs in the browser: documents stay on your machine.</li>
</ul>
<img src="${img}" alt="Review screen on the synthetic vendor sample: a vendor answer and the DPA clause it contradicts, each with its quote.">
<h2>Early results on synthetic packs the checks had not seen</h2>
<div class="nums">
<div><b>${score('missing')}</b>missing clauses found</div>
<div><b>${score('vendor')}</b>vendor contradictions found</div>
<div><b>${score('vendorClean')}</b>clean vendor answers left alone</div>
</div>
<p class="muted">Small synthetic samples, checked without AI (measured ${esc(summary.measured)}). Every miss is published on the site.</p>
<div class="cta"><b>Free pilot:</b> send one anonymised DPA and get a short report within 3 working days, in exchange for 15 minutes of feedback. Personal data and confidential commercial terms removed first; I delete the file after the review.<br>
${esc(SITE_URL)}pilot/ · ${esc(AUTHOR.email)}</div>
<footer>Completeness check and draft, not legal advice. Rules not yet reviewed by a lawyer. Built by ${esc(AUTHOR.name)}.</footer>
</body></html>
`
  writeFileSync('docs/pilot-kit/09_one_pager.html', html)
  const pdf = await browser.newPage()
  await pdf.setContent(readFileSync('docs/pilot-kit/09_one_pager.html', 'utf8'))
  await pdf.pdf({ path: 'docs/pilot-kit/09_one_pager.pdf', format: 'A4', printBackground: true })
  await browser.close()
}

void main()
