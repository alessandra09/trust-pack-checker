import { expect, test } from '@playwright/test'

// SPRINT2 task 3: the exported report is one self-contained file that opens offline and prints.
for (const mode of ['company', 'vendor'] as const) {
  test(`exported ${mode} report opens offline and prints to PDF`, async ({
    page,
    browser,
  }, testInfo) => {
    await page.goto('/')
    await page
      .getByRole('button', {
        name: mode === 'vendor' ? 'Or try the vendor sample' : 'Try with sample data',
      })
      .click()
    await page.getByText('Export', { exact: true }).click()
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Report (HTML, printable)' }).click()
    const file = await download
    expect(file.suggestedFilename()).toMatch(/^report-\d{4}-\d{2}-\d{2}\.html$/)
    const path = testInfo.outputPath('report.html')
    await file.saveAs(path)

    const ctx = await browser.newContext({ offline: true })
    const requests: string[] = []
    const report = await ctx.newPage()
    report.on('request', (r) => {
      if (!r.url().startsWith('file:')) requests.push(r.url())
    })
    await report.goto(`file://${path}`)
    await expect(report.getByRole('heading', { level: 1 })).toHaveText('Trust Pack Checker report')
    await expect(report.getByText('What this tool did not check')).toBeVisible()
    await expect(report.getByText(/Rules not yet reviewed by a lawyer/).first()).toBeVisible()
    expect(await report.locator('blockquote').count()).toBeGreaterThan(0)
    const pdf = await report.pdf({ format: 'A4' })
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
    expect(requests).toEqual([])
    await ctx.close()
  })
}

test('sample report page shows the fictional-documents banner and links back', async ({ page }) => {
  await page.goto('/sample-report/')
  await expect(page.getByText(/Sample on fictional documents/)).toBeVisible()
  await page.getByRole('link', { name: 'Back to Trust Pack Checker' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Every answer comes with its proof.',
  )
})
