// Design screenshots (DESIGN2 section 6): landing and review at 360, 390, 768, 1280 and 1600 px,
// light and dark, into docs/design/<label>/. Fails on horizontal scroll or clipped text.
// Usage: npm run build && npx vite preview --port 4173, then: tsx scripts/design-shots.ts <label> [base]
import { mkdirSync } from 'node:fs'
import { chromium, type Page } from '@playwright/test'

const label = process.argv[2] ?? 'after'
const base = process.argv[3] ?? 'http://localhost:4173/trust-pack-checker/'
const WIDTHS = [360, 390, 768, 1280, 1600]
const exec = process.env.PW_CHROMIUM_PATH
const out = `docs/design/${label}`
mkdirSync(out, { recursive: true })

async function problems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const issues: string[] = []
    if (document.documentElement.scrollWidth > window.innerWidth + 1)
      issues.push(`horizontal scroll ${document.documentElement.scrollWidth}px`)
    for (const el of document.querySelectorAll<HTMLElement>('h1,h2,h3,p,a,button,li,dt,dd,span')) {
      const s = getComputedStyle(el)
      if (
        s.overflow === 'hidden' &&
        el.scrollWidth > el.clientWidth + 1 &&
        s.textOverflow !== 'ellipsis'
      )
        issues.push(`clipped: ${el.tagName} "${(el.textContent ?? '').slice(0, 40)}"`)
    }
    return issues
  })
}

const browser = await chromium.launch(exec ? { executablePath: exec } : {})
const failures: string[] = []
for (const scheme of ['light', 'dark'] as const) {
  for (const width of WIDTHS) {
    const page = await browser.newPage({
      viewport: { width, height: width < 768 ? 844 : 900 },
      deviceScaleFactor: 1,
      colorScheme: scheme,
      reducedMotion: 'reduce',
    })
    await page.goto(base)
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: `${out}/landing-${scheme}-${width}.png` })
    if (width === 390 || width === 1280)
      await page.screenshot({ path: `${out}/landing-full-${scheme}-${width}.png`, fullPage: true })
    failures.push(...(await problems(page)).map((p) => `landing ${scheme} ${width}: ${p}`))
    await page.getByRole('button', { name: 'Try with sample data' }).first().click()
    await page.locator('[data-item-id]').first().click()
    await page.waitForTimeout(200)
    await page.screenshot({ path: `${out}/review-${scheme}-${width}.png` })
    failures.push(...(await problems(page)).map((p) => `review ${scheme} ${width}: ${p}`))
    await page.close()
  }
}
await browser.close()
if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`)
  process.exit(1)
}
process.stdout.write(`screenshots in ${out}\n`)
