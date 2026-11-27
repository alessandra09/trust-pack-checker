import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const WIDTHS = [360, 390, 768, 1280]

async function settled(page: Page) {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (a) => a.playState === 'finished' || a.effect?.getComputedTiming().iterations === Infinity,
      ),
  )
}

async function noOverflowAndAxeClean(page: Page) {
  await settled(page)
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze()
  expect(results.violations).toEqual([])
}

for (const width of WIDTHS) {
  test(`landing and pilot page at ${width}px: no overflow, axe clean`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    // The product name stays on one line next to the header buttons.
    const brand = page.locator('header').getByText('Trust Pack Checker')
    expect((await brand.boundingBox())?.height ?? 99).toBeLessThan(30)
    await noOverflowAndAxeClean(page)
    await page.goto('/pilot/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Free pilot review')
    await noOverflowAndAxeClean(page)
  })
}

test('pilot page form builds a mailto link and needs the checkbox', async ({ page }) => {
  await page.goto('/pilot/')
  await page.getByLabel('Name').fill('Test Person')
  await page.getByLabel('Company', { exact: true }).fill('Example Ltd')
  await page.getByLabel('Role').fill('DPO')
  await page.getByLabel('I am a').selectOption('consultant')
  await page.getByLabel('What I want checked').fill('One processor DPA')
  await page.getByRole('button', { name: 'Write the email' }).click()
  await expect(page.getByText(/Your request is ready/)).toHaveCount(0)
  await page.getByLabel('I removed personal data and confidential terms.').check()
  await page.getByRole('button', { name: 'Write the email' }).click()
  const link = page.getByRole('link', { name: 'Open in email app' })
  const href = (await link.getAttribute('href')) ?? ''
  expect(href).toMatch(
    /^mailto:Oleksandrahordieieva@gmail\.com\?subject=Free%20pilot%20review%20request&body=/,
  )
  const body = decodeURIComponent(href.split('body=')[1] ?? '')
  expect(body).toContain('Name: Test Person')
  expect(body).toContain('I am a: DPO consultant')
  expect(body).toContain('What I want checked: One processor DPA')
})

test('pilot page works without JavaScript and shows the email address', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false })
  const page = await ctx.newPage()
  await page.goto('/pilot/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Free pilot review')
  await expect(page.getByRole('link', { name: 'Oleksandrahordieieva@gmail.com' })).toHaveAttribute(
    'href',
    'mailto:Oleksandrahordieieva@gmail.com',
  )
  await expect(page.getByText('Within 3 working days.')).toBeVisible()
  await ctx.close()
})

test('static pages have their own title and description and link from the footer', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Privacy', exact: true }).click()
  await expect(page).toHaveURL(/\/privacy\/$/)
  await expect(page).toHaveTitle('Privacy · Trust Pack Checker')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /browser/)
  await expect(
    page.getByText('Draft. The site owner has not yet reviewed this text.'),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Terms', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terms of use')
  await page.getByRole('link', { name: 'About', exact: true }).click()
  await expect(page.getByText(/billing reconciliation into leading GDPR compliance/)).toBeVisible()
  await page.getByRole('link', { name: 'Trust Pack Checker home' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Every answer comes with its proof.',
  )
})

test('old #/privacy links open the privacy page', async ({ page }) => {
  await page.goto('/#/privacy')
  await expect(page).toHaveURL(/\/privacy\/$/)
})

test('guides render, are axe clean and linked from the footer', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Article 28 checklist' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'GDPR Article 28 checklist for processor agreements (DPA)',
  )
  await expect(page.getByText(/^Not legal advice\./)).toBeVisible()
  await noOverflowAndAxeClean(page)
  await page.getByRole('link', { name: 'Answering security questionnaires' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'How to answer a customer security questionnaire without guessing',
  )
  await noOverflowAndAxeClean(page)
})

test('SEO basics: one h1, description, canonical, social card, JSON-LD, sitemap, robots', async ({
  page,
  request,
}) => {
  for (const path of ['/', '/pilot/', '/about/', '/guides/gdpr-article-28-dpa-checklist/']) {
    await page.goto(path)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{50,}/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /^https:\/\/alessandra09\.github\.io\/trust-pack-checker\//,
    )
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og\.png$/)
  }
  await page.goto('/')
  const ld = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
  )
  expect(ld['@type']).toBe('SoftwareApplication')
  expect(ld.aggregateRating).toBeUndefined()
  expect(ld.offers).toBeUndefined()
  expect(await (await request.get('/sitemap.xml')).text()).toContain('/pilot/</loc>')
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap:')
  expect((await request.get('/og.png')).headers()['content-type']).toContain('image/png')
  const imgs = await page.locator('img:not([alt])').count()
  expect(imgs).toBe(0)
})
