import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('landing page shows the headline and disclaimers', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Every answer comes with its proof.',
  )
  await expect(page.getByText('Draft for human review. Not legal advice.')).toBeVisible()
  await expect(page.getByText('Rules not yet reviewed by a lawyer.')).toBeVisible()
})

test('production build carries a strict CSP', async ({ page }) => {
  await page.goto('/')
  const csp = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content')
  expect(csp).toContain("connect-src 'self' https://api.anthropic.com")
})

test('no network requests leave the origin', async ({ page, baseURL }) => {
  const external: string[] = []
  page.on('request', (req) => {
    if (!req.url().startsWith(baseURL ?? '')) external.push(req.url())
  })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect(external).toEqual([])
})

// Entrance animations fade content in; axe must check the settled page, not a half-faded frame.
async function settled(page: import('@playwright/test').Page) {
  // Looping background animations never finish; only one-off entrance animations are awaited.
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (a) => a.playState === 'finished' || a.effect?.getComputedTiming().iterations === Infinity,
      ),
  )
}

test('landing page has no axe violations', async ({ page }) => {
  await page.goto('/')
  await settled(page)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze()
  expect(results.violations).toEqual([])
})

async function axeClean(page: import('@playwright/test').Page) {
  await settled(page)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze()
  expect(results.violations).toEqual([])
}

test('upload screen has no axe violations', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /answering a questionnaire/ }).click()
  await expect(page.getByRole('heading', { name: 'Add your documents' })).toBeVisible()
  await axeClean(page)
})

test('sample data opens review with a conflict and no external requests', async ({
  page,
  baseURL,
}) => {
  const external: string[] = []
  page.on('request', (req) => {
    if (!req.url().startsWith(baseURL ?? '')) external.push(req.url())
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Try with sample data' }).click()
  await expect(page.locator('[data-item-id]').first()).toBeVisible()
  await page.getByRole('button', { name: /Q15/ }).click()
  await expect(page.getByText('These passages state different numbers.')).toBeVisible()
  await axeClean(page)
  await page.getByRole('tab', { name: /DPA check/ }).click()
  await page.locator('[data-item-id]').first().click()
  await axeClean(page)
  expect(external).toEqual([])
})

test('keyboard j/k moves selection and export downloads an XLSX copy', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Try with sample data' }).click()
  const first = page.locator('[data-item-id]').first()
  await expect(first).toBeVisible()
  await first.click()
  const before = await page.locator('[aria-current="true"]').getAttribute('data-item-id')
  await page.locator('body').press('j')
  const after = await page.locator('[aria-current="true"]').getAttribute('data-item-id')
  expect(after).not.toBe(before)
  await page.getByText('Export', { exact: true }).click()
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Filled questionnaire/ }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^questionnaire-draft-.*\.xlsx$/)
})

test('no CSP violations or console errors on load', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 200))
  })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  expect(errors).toEqual([])
})

test('dark theme: landing and review have no axe violations', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await axeClean(page)
  await page.getByRole('button', { name: 'Try with sample data' }).click()
  await page.getByRole('button', { name: /Q15/ }).click()
  await axeClean(page)
})

test('reduced motion: no animations run', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const running = await page.evaluate(
    () => document.getAnimations().filter((a) => a.playState === 'running').length,
  )
  expect(running).toBe(0)
})
