import { t } from '../i18n/t.ts'
import { SITE_URL } from './paths.ts'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** Title, description, canonical and social tags for one page. `path` is relative to the site root. */
export function headTags({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}): string {
  const full = path === '' ? t('app.name') : `${title} · ${t('app.name')}`
  const url = `${SITE_URL}${path}`
  return [
    `<title>${esc(full)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(full)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta name="twitter:card" content="summary" />`,
  ].join('\n    ')
}
