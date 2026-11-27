import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { art28 } from '../../src/data/load.ts'
import { Art28Page, QuestionnairePage } from '../../src/pages/GuidePages.tsx'
import { Layout } from '../../src/pages/Layout.tsx'

const words = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length

describe('content pages', () => {
  it('the Art. 28 checklist lists exactly the rules in the data file', () => {
    const html = renderToStaticMarkup(h(Art28Page))
    const ids = [...html.matchAll(/data-rule="([^"]+)"/g)].map((m) => m[1])
    expect(ids).toEqual([
      ...art28.rules.filter((r) => r.class === 'core').map((r) => r.id),
      ...art28.rules.filter((r) => r.class !== 'core').map((r) => r.id),
    ])
    for (const r of art28.rules) expect(html).toContain(r.title)
    expect(html).toContain(art28.lastVerified)
  })

  it('both pages are 700 to 1,000 words, say not legal advice and avoid forbidden words', () => {
    for (const Page of [Art28Page, QuestionnairePage]) {
      const html = renderToStaticMarkup(h(Page))
      expect(words(html)).toBeGreaterThanOrEqual(700)
      expect(words(html)).toBeLessThanOrEqual(1000)
      expect(html).toContain('Not legal advice.')
      expect(renderToStaticMarkup(h(Layout, null, h(Page)))).not.toMatch(
        /\b(compliant|certified|safe|guaranteed)\b/i,
      )
    }
  })
})
