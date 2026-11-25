import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Client mode (SPEC 11.1, 11.2): vendor DPA vs vendor answers, all checks in code, no network calls.
async function axeClean(page: Page) {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (a) => a.playState === 'finished' || a.effect?.getComputedTiming().iterations === Infinity,
      ),
  )
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze()
  expect(results.violations).toEqual([])
}

test('vendor sample shows contradictions with both quotes and questions to send', async ({
  page,
  baseURL,
}) => {
  const external: string[] = []
  page.on('request', (req) => {
    if (!req.url().startsWith(baseURL ?? '')) external.push(req.url())
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Or try the vendor sample' }).click()
  await expect(page.getByRole('tab', { name: 'Answers vs DPA' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  const list = page.getByRole('list', { name: 'Answers vs DPA' })
  await expect(list.getByRole('listitem')).toHaveCount(9)

  await list.getByRole('button', { name: /V03/ }).click()
  await expect(
    page.getByText('The answer says 24 hours; the DPA says seventy-two (72) hours.'),
  ).toBeVisible()
  // The quote is marked word by word in both passages: the answer and the DPA clause.
  await expect(page.locator('mark.quote-hl', { hasText: /^24$/ })).toBeVisible()
  await expect(page.locator('mark.quote-hl', { hasText: /^seventy$/ })).toBeVisible()
  await axeClean(page)

  await page.getByRole('button', { name: 'Accept' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Accepted' }).first()).toBeVisible()

  await page.getByRole('tab', { name: 'Questions to send the vendor' }).click()
  await expect(page.getByText('different breach notification periods')).toBeVisible()
  await expect(page.getByText('Where the answers and the DPA differ')).toBeVisible()
  await axeClean(page)
  expect(external).toEqual([])
})

test('vendor upload flow runs the checks on uploaded files', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /I'm reviewing a vendor/ }).click()
  await expect(page.getByRole('heading', { name: "Add the vendor's documents" })).toBeVisible()
  const run = page.getByRole('button', { name: 'Check documents' })
  await expect(run).toBeDisabled()
  const inputs = page.locator('input[type="file"]')
  await inputs.nth(0).setInputFiles('eval/packs/pack-d/docs/dpa.md')
  await inputs.nth(1).setInputFiles('eval/packs/pack-d/answers.csv')
  await expect(page.getByText('15 questions found')).toBeVisible()
  await axeClean(page)
  await run.click()
  await expect(
    page.getByRole('list', { name: 'Answers vs DPA' }).getByRole('listitem'),
  ).toHaveCount(9)
  await page.getByRole('tab', { name: 'DPA check (Art. 28)' }).click()
  await expect(
    page.getByRole('list', { name: 'DPA check (Art. 28)' }).getByRole('listitem'),
  ).not.toHaveCount(0)
})
