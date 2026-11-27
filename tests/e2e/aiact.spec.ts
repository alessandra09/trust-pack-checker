import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// SPRINT2 task 8: flags appear only on their triggers; every date shows "last verified on".
test('AI use tab: flags follow the answers, dates show when they were verified', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Try with sample data' }).click()
  await expect(page.locator('[data-item-id]').first()).toBeVisible()
  await page.getByRole('tab', { name: 'AI use (AI Act)' }).click()

  const form = page.getByRole('form', { name: 'AI use declaration' })
  await expect(page.getByText('No screening flag from your answers so far.')).toBeVisible()
  await expect(page.locator('[data-flag]')).toHaveCount(0)

  const group = (name: RegExp) => form.getByRole('group', { name })
  await group(/use AI systems in your service/)
    .getByLabel('Yes')
    .check()
  await group(/infer emotions/)
    .getByLabel('Yes')
    .check()
  await expect(page.locator('[data-flag="F-EMOTION-OTHER"]')).toBeVisible()
  await form.getByLabel('Employees').check()
  await expect(page.locator('[data-flag="F-EMOTION-WORK"]')).toBeVisible()
  await expect(page.locator('[data-flag="F-EMOTION-OTHER"]')).toHaveCount(0)
  await form.getByLabel(/AI literacy/).fill('none')
  await expect(page.locator('[data-flag="F-LITERACY"]')).toContainText('last verified on')

  await expect(page.getByTestId('ai-disclosure')).toContainText('We use AI systems')
  const dates = page.getByRole('region', { name: 'Key EU AI Act dates' }).getByRole('listitem')
  await expect(dates).toHaveCount(6)
  for (const li of await dates.all()) await expect(li).toContainText('last verified on')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze()
  expect(results.violations).toEqual([])
})
