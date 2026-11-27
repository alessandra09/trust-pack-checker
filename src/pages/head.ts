import { AUTHOR } from '../app/config.ts'
import { t } from '../i18n/t.ts'
import { SITE_URL } from './paths.ts'

/** Landing description for search results and link previews. */
export const LANDING_DESCRIPTION = t('page.home.description')

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
    `<meta property="og:image" content="${SITE_URL}og.png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(t('og.alt'))}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(full)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${SITE_URL}og.png" />`,
  ].join('\n    ')
}

/** JSON-LD for the landing page: what the app is, with no ratings and no prices. */
export function softwareJsonLd(description: string): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: t('app.name'),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web browser',
    url: SITE_URL,
    description,
    inLanguage: 'en',
    isAccessibleForFree: true,
    author: { '@type': 'Person', name: AUTHOR.name },
  }
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`
}
