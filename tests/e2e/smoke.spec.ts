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

test('landing page has no axe violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze()
  expect(results.violations).toEqual([])
})
