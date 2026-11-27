import { describe, expect, it } from 'vitest'
import { CAROUSELS } from '../../scripts/carousels/content.ts'
import { contrastProblems } from '../../scripts/carousels/theme.ts'
import { art28 } from '../../src/data/load.ts'

// SPRINT2 task 9 acceptance: facts match the rules data, no forbidden words, caption rules, contrast.
const BANNED = [/\bcompliant\b/i, /\bcertified\b/i, /\bsafe\b/i, /\bguaranteed\b/i, /\bapproved\b/i]
const titles = new Set(art28.rules.map((r) => r.title))

describe('carousels', () => {
  it('three carousels of 6 to 8 slides, cover first and call to action last', () => {
    expect(CAROUSELS).toHaveLength(3)
    for (const c of CAROUSELS) {
      expect(c.slides.length).toBeGreaterThanOrEqual(6)
      expect(c.slides.length).toBeLessThanOrEqual(8)
      expect(c.slides[0]?.kind).toBe('cover')
      expect(c.slides.at(-1)).toMatchObject({
        kind: 'cta',
        heading: 'Try the free checker, link in bio',
      })
      expect(c.slides.some((s) => s.kind === 'checklist')).toBe(true)
      expect(c.alt).toHaveLength(c.slides.length)
    }
  })

  it('rule slides use only rule names and articles from the rules data', () => {
    for (const c of CAROUSELS.filter((x) => x.name !== 'found-in-text'))
      for (const s of c.slides) {
        if (s.kind === 'list') for (const i of s.items) expect(titles.has(i.title)).toBe(true)
        if (s.kind === 'checklist') for (const i of s.items) expect(titles.has(i)).toBe(true)
      }
  })

  it('captions: keyword in the first line, 1 to 5 specific hashtags, "Not legal advice" footer', () => {
    for (const c of CAROUSELS) {
      const cover = c.slides[0]
      const keyword = cover?.kind === 'cover' ? cover.keyword.toLowerCase() : ''
      expect(c.caption.split('\n')[0]?.toLowerCase()).toContain(keyword)
      const tags = c.caption.match(/#\w+/g) ?? []
      expect(tags.length).toBeGreaterThanOrEqual(1)
      expect(tags.length).toBeLessThanOrEqual(5)
      expect(c.caption.trim().split('\n').at(-1)).toMatch(/^Not legal advice\./)
    }
  })

  it('no forbidden words on slides, captions or alt text', () => {
    for (const c of CAROUSELS) {
      const text = [JSON.stringify(c.slides), c.caption, ...c.alt].join(' ')
      for (const w of BANNED) expect(text).not.toMatch(w)
    }
  })

  it('text colours reach 4.5:1 contrast in both themes', () => {
    expect(contrastProblems()).toEqual([])
  })
})
