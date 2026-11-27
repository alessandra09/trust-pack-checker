import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contrast } from '../../scripts/carousels/theme.ts'

// DESIGN2 section 6: contrast AA for all text and status chips in both themes, read from the one
// tokens file; reduced motion switches every animation and transition off; fonts stay under 150 KB.
const css = readFileSync('src/styles/tokens.css', 'utf8')

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`no ${selector} block`)
  const body = css.slice(start, css.indexOf('}', start))
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]),
  )
}

const light = block(':root')
const darkClass = block(':root.dark')
const darkMedia = block(':root:not(.light)')

// [text colour, background]: every pair the components put together.
const PAIRS: [string, string][] = [
  ...['bg', 'surface', 'surface-2', 'paper'].flatMap((b): [string, string][] => [
    ['text', b],
    ['muted', b],
    ['accent', b],
  ]),
  ['text', 'accent-soft'],
  ['accent', 'accent-soft'],
  ['accent-fg', 'accent'],
  ['accent-fg', 'accent-hover'],
  ['text', 'quote-bg'],
  ['text', 'hit-bg'],
  ['found-fg', 'found-bg'],
  ['partial-fg', 'partial-bg'],
  ['notfound-fg', 'notfound-bg'],
  ['conflict-fg', 'conflict-bg'],
  ['human-fg', 'human-bg'],
]

describe('design tokens', () => {
  it('the dark theme is the same in the class and in the media query', () => {
    expect(darkMedia).toEqual(darkClass)
  })

  for (const [name, theme] of [
    ['light', light],
    ['dark', darkClass],
  ] as const) {
    it(`${name}: every text and status chip pair reaches 4.5:1`, () => {
      const low = PAIRS.flatMap(([fg, bg]) => {
        const a = theme[fg]
        const b = theme[bg]
        if (!a || !b) return [`missing --${fg} or --${bg}`]
        const r = contrast(a, b)
        return r < 4.5 ? [`--${fg} on --${bg}: ${r.toFixed(2)}`] : []
      })
      expect(low).toEqual([])
    })
  }

  it('reduced motion turns off every animation and transition', () => {
    const index = readFileSync('src/index.css', 'utf8')
    const rule = /@media \(prefers-reduced-motion: reduce\)\s*{\s*\*\s*{([^}]*)}/.exec(index)
    expect(rule?.[1]).toMatch(/transition:\s*none\s*!important/)
    expect(rule?.[1]).toMatch(/animation:\s*none\s*!important/)
  })

  it('the latin font files together stay under 150 KB', () => {
    const fonts = readFileSync('src/styles/fonts.css', 'utf8')
    const files = [...fonts.matchAll(/url\('\.\.\/assets\/fonts\/([\w-]+\.woff2)'\)/g)].map(
      (m) => m[1] ?? '',
    )
    expect(files).toHaveLength(4)
    const latin = files.filter((f) => !f.includes('-ext-'))
    const bytes = latin.reduce((n, f) => n + readFileSync(`src/assets/fonts/${f}`).length, 0)
    expect(bytes).toBeLessThan(150 * 1024)
  })
})
