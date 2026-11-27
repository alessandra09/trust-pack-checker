// Carousel colours: the site's design tokens (src/index.css) for light, and a matching dark set.
export const THEMES = {
  light: {
    bg: '#fafafa',
    surface: '#ffffff',
    text: '#18181b',
    muted: '#52525b',
    accent: '#4f46e5',
    soft: '#eef2ff',
    border: '#e4e4e7',
  },
  dark: {
    bg: '#0f0f12',
    surface: '#18181b',
    text: '#f4f4f5',
    muted: '#a1a1aa',
    accent: '#a5b4fc',
    soft: '#1e1b4b',
    border: '#3f3f46',
  },
}
export type Theme = (typeof THEMES)['light']

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number]
  return (x + 0.05) / (y + 0.05)
}

/** Every text colour on every background it is used on must reach 4.5:1 (WCAG AA). */
export function contrastProblems(): string[] {
  return Object.entries(THEMES).flatMap(([name, t]) =>
    (
      [
        [t.text, t.bg],
        [t.text, t.surface],
        [t.muted, t.bg],
        [t.muted, t.surface],
        [t.accent, t.bg],
        [t.accent, t.soft],
      ] as const
    ).flatMap(([fg, bg]) =>
      contrast(fg, bg) < 4.5 ? [`${name}: ${fg} on ${bg} is ${contrast(fg, bg).toFixed(2)}`] : [],
    ),
  )
}
