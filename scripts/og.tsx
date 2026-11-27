import { readdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { renderToStaticMarkup } from 'react-dom/server'
import { OgCard } from '../src/pages/OgCard.tsx'

// npm run og: renders public/og.png (1200 x 630) from the built site's CSS and the OgCard component.
const css = readdirSync('dist/assets').find((f) => /\.css$/.test(f))
if (!css) throw new Error('Run npm run build first')
const tmp = resolve('dist/assets/og-card.html')
writeFileSync(
  tmp,
  `<!doctype html><html lang="en" class="light"><head><meta charset="utf-8"><link rel="stylesheet" href="./${css}"></head><body style="margin:0">${renderToStaticMarkup(<OgCard />)}</body></html>`,
)
const exec = process.env.PW_CHROMIUM_PATH
const browser = await chromium.launch(exec ? { executablePath: exec } : {})
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.emulateMedia({ reducedMotion: 'reduce' })
await page.goto(`file://${tmp}`)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: 'public/og.png' })
await browser.close()
rmSync(tmp)
