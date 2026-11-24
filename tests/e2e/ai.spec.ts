import { expect, test, type Page } from '@playwright/test'

// AI path with a mocked Anthropic API (SPEC 13.1): consent first, key only in the provider request.
const KEY = 'sk-ant-test-0000'
const PACK = 'eval/packs/pack-c'

async function upload(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /answering a questionnaire/ }).click()
  await page.getByLabel('My DPA').setInputFiles(`${PACK}/docs/dpa.md`)
  await page.getByLabel('Security policy').setInputFiles(`${PACK}/docs/security-policy.md`)
  await page.getByLabel('Client questionnaire').setInputFiles(`${PACK}/questionnaire.csv`)
  await expect(page.getByText(/questions found/)).toBeVisible()
  await page.getByLabel('Use AI to draft answers and check clauses').check()
  await page.getByLabel('Anthropic API key').fill(KEY)
}

test('consent dialog appears before any call, and "Use without AI" sends nothing', async ({
  page,
}) => {
  let calls = 0
  await page.route('https://api.anthropic.com/**', (route) => {
    calls++
    return route.abort()
  })
  await upload(page)
  await page.getByRole('button', { name: 'Check documents' }).click()
  const dialog = page.getByRole('dialog', { name: 'Send passages to Anthropic?' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByTestId('consent-estimate')).toContainText('calls')
  await dialog.getByRole('button', { name: 'Use without AI' }).click()
  await expect(page.locator('[data-item-id]').first()).toBeVisible()
  expect(calls).toBe(0)
})

test('a rejected key stops the run and the key is only sent to the provider', async ({
  page,
  baseURL,
}) => {
  const leaks: string[] = []
  let calls = 0
  page.on('request', (req) => {
    const toProvider = req.url().startsWith('https://api.anthropic.com/')
    const carries = req.url().includes(KEY) || (req.postData() ?? '').includes(KEY)
    if (carries || (!toProvider && !req.url().startsWith(baseURL ?? ''))) leaks.push(req.url())
  })
  await page.route('https://api.anthropic.com/**', (route) => {
    calls++
    return route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        type: 'error',
        error: { type: 'authentication_error', message: 'invalid x-api-key' },
      }),
    })
  })
  await upload(page)
  await page.getByRole('button', { name: 'Check documents' }).click()
  await page.getByRole('button', { name: 'Send to Anthropic' }).click()
  await expect(page.getByText('The API key was rejected.', { exact: false })).toBeVisible()
  await expect(page.locator('[data-item-id]').first()).toBeVisible()
  expect(calls).toBeLessThanOrEqual(3)
  expect(leaks).toEqual([])
})

test('model replies are gated: a quote copied from a passage is shown as found', async ({
  page,
}) => {
  await page.route('https://api.anthropic.com/**', async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}') as {
      messages: { content: string }[]
    }
    const user = body.messages[0]?.content ?? ''
    const m = /<passage id="([^"]+)"[^>]*>([^<]{12,})/.exec(user)
    const quote = (m?.[2] ?? '').slice(0, 80).trim()
    const reply = {
      status: 'FOUND',
      draft: 'We describe this in our documents.',
      chunkId: m?.[1] ?? '',
      quote,
      missingElements: [],
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'msg_test',
        type: 'message',
        role: 'assistant',
        model: 'claude-haiku-5-5',
        content: [{ type: 'text', text: JSON.stringify(reply) }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 20 },
      }),
    })
  })
  await upload(page)
  await page.getByRole('button', { name: 'Check documents' }).click()
  await page.getByRole('button', { name: 'Send to Anthropic' }).click()
  await expect(page.locator('[data-item-id]').first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('button', { name: /Found in text/ }).first()).toBeVisible()
})
