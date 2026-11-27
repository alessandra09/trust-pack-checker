import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { Layout } from '../src/pages/Layout.tsx'
import { SAMPLE_REPORT_PATH, SITE_URL } from '../src/pages/paths.ts'
import { STATIC_PAGES } from '../src/pages/registry.tsx'
import { headTags } from '../src/pages/head.ts'

// After `vite build`: fills dist/pages.html once per static page and writes dist/<path>index.html,
// so each page has its own title and description and reads without JavaScript.
const template = readFileSync('dist/pages.html', 'utf8')

for (const p of STATIC_PAGES) {
  const body = renderToString(
    <StrictMode>
      <Layout>{p.render()}</Layout>
    </StrictMode>,
  )
  const html = template
    .replace(
      '<!-- PAGE-HEAD -->',
      headTags({ title: p.title, description: p.description, path: p.path }),
    )
    .replace('<!-- PAGE-BODY -->', body)
    .replace('data-page=""', `data-page="${p.id}"`)
  const out = `dist/${p.path}index.html`
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, html)
}
rmSync('dist/pages.html')

// Sitemap: the landing page, every static page and the sample report.
const paths = ['', ...STATIC_PAGES.map((p) => p.path), SAMPLE_REPORT_PATH]
writeFileSync(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
    .map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`)
    .join('\n')}\n</urlset>\n`,
)
process.stdout.write(`prerendered ${STATIC_PAGES.length} pages for ${SITE_URL}\n`)
