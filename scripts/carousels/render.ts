// npm run carousels: renders content/carousels/<name>/slide-XX.png (light), dark/slide-XX.png,
// <name>.pdf (LinkedIn document post), caption.md and alt-text.md. Fails on overflow or low contrast.
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { CAROUSELS, type Slide } from './content.ts'
import { THEMES, contrastProblems, type Theme } from './theme.ts'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function body(s: Slide, n: number, total: number): string {
  const foot = `<footer><span>Trust Pack Checker</span><span>${n} / ${total}</span></footer>`
  switch (s.kind) {
    case 'cover':
      return `<div class="slide cover"><div class="top"><p class="kicker">${esc(s.kicker)}</p><h1>${esc(s.title)}</h1><p class="kw">${esc(s.keyword)}</p></div><div class="photo" data-photo>Your photo here<br><small>about 40% of the slide</small></div>${foot}</div>`
    case 'list':
      return `<div class="slide"><h2>${esc(s.heading)}</h2><ol class="list">${s.items.map((i) => `<li><strong>${esc(i.title)}</strong>${i.note ? `<span>${esc(i.note)}</span>` : ''}</li>`).join('')}</ol>${foot}</div>`
    case 'text':
      return `<div class="slide"><h2>${esc(s.heading)}</h2>${s.body.map((p) => `<p class="big">${esc(p)}</p>`).join('')}${foot}</div>`
    case 'checklist':
      return `<div class="slide"><h2>${esc(s.heading)}</h2><ul class="check">${s.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>${foot}</div>`
    case 'cta':
      return `<div class="slide cta"><h2>${esc(s.heading)}</h2><p class="big">${esc(s.body)}</p>${foot}</div>`
  }
}

const css = (t: Theme) => `*{box-sizing:border-box}html,body{margin:0}
body{font-family:Inter,ui-sans-serif,system-ui,'Segoe UI',Roboto,sans-serif;color:${t.text};background:${t.bg}}
.slide{width:1080px;height:1350px;padding:96px 88px 72px;display:flex;flex-direction:column;gap:36px;background:${t.bg};overflow:hidden;position:relative;break-after:page}
h1{font-size:84px;line-height:1.05;letter-spacing:-0.02em;margin:0}h2{font-size:64px;line-height:1.1;letter-spacing:-0.02em;margin:0}
.kicker{font-size:30px;font-weight:600;color:${t.accent};margin:0 0 24px;text-transform:uppercase;letter-spacing:.06em}
.kw{font-size:34px;color:${t.muted};margin:24px 0 0}
.photo{height:540px;flex:none;border:4px dashed ${t.accent};border-radius:24px;background:${t.soft};display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;font-size:40px;font-weight:600;color:${t.accent}}
.photo small{font-size:26px;font-weight:500}
.list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:28px}
.list li{background:${t.surface};border:2px solid ${t.border};border-radius:20px;padding:32px 36px;display:flex;flex-direction:column;gap:12px}
.list strong{font-size:44px;line-height:1.15}.list span{font-size:32px;line-height:1.35;color:${t.muted}}
.big{font-size:46px;line-height:1.3;margin:0}
.check{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:18px}
.check li{font-size:36px;line-height:1.25;padding-left:64px;position:relative}
.check li::before{content:'';position:absolute;left:0;top:4px;width:38px;height:38px;border:4px solid ${t.accent};border-radius:8px}
.cta{justify-content:center}.cta h2{color:${t.accent};font-size:76px}
footer{margin-top:auto;display:flex;justify-content:space-between;font-size:26px;color:${t.muted};border-top:2px solid ${t.border};padding-top:24px}`

const problems = contrastProblems()
if (problems.length) throw new Error(problems.join('; '))

const exec = process.env.PW_CHROMIUM_PATH
const browser = await chromium.launch(exec ? { executablePath: exec } : {})
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } })
for (const c of CAROUSELS) {
  const dir = `content/carousels/${c.name}`
  mkdirSync(`${dir}/dark`, { recursive: true })
  for (const [variant, t] of Object.entries(THEMES)) {
    const slides = c.slides.map((s, i) => body(s, i + 1, c.slides.length)).join('')
    await page.setContent(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css(t)}@page{size:1080px 1350px;margin:0}</style></head><body>${slides}</body></html>`,
    )
    const overflow = await page.$$eval('.slide', (els) =>
      els.flatMap((el, i) => {
        const box = el.getBoundingClientRect()
        const kids = [...el.querySelectorAll('*')].some((k) => {
          const r = k.getBoundingClientRect()
          return r.bottom > box.bottom - 72 + 1 || r.right > box.right + 1
        })
        return kids ? [i + 1] : []
      }),
    )
    if (overflow.length)
      throw new Error(`${c.name} (${variant}): overflow on slide ${overflow.join(', ')}`)
    for (const [i, el] of (await page.$$('.slide')).entries()) {
      const folder = variant === 'dark' ? `${dir}/dark` : dir
      await el.screenshot({ path: `${folder}/slide-${String(i + 1).padStart(2, '0')}.png` })
    }
    if (variant === 'light')
      await page.pdf({
        path: `${dir}/${c.name}.pdf`,
        width: '1080px',
        height: '1350px',
        printBackground: true,
      })
  }
  writeFileSync(`${dir}/caption.md`, `# Caption: ${c.name}\n\n${c.caption}\n`)
  const alt = c.alt.map((a, i) => `${i + 1}. ${a}`).join('\n')
  writeFileSync(`${dir}/alt-text.md`, `# Alt text: ${c.name}\n\n${alt}\n`)
  process.stdout.write(`${c.name}: ${c.slides.length} slides\n`)
}
await browser.close()
