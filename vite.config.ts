import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { buildCsp } from './src/app/csp.ts'
import { headTags, LANDING_DESCRIPTION, softwareJsonLd } from './src/pages/head.ts'

// The CSP is injected only into the production build: the dev server needs inline scripts for hot reload.
function cspPlugin(): Plugin {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace(
        '<!-- CSP -->',
        `<meta http-equiv="Content-Security-Policy" content="${buildCsp()}" />`,
      ),
  }
}

// The landing page gets its title, description, social tags and JSON-LD at build time.
function landingHeadPlugin(): Plugin {
  return {
    name: 'landing-head',
    apply: 'build',
    transformIndexHtml: (html, ctx) =>
      ctx.path.endsWith('/index.html')
        ? html.replace(
            '<title>Trust Pack Checker</title>',
            `${headTags({ title: 'Trust Pack Checker', description: LANDING_DESCRIPTION, path: '' })}\n    ${softwareJsonLd(LANDING_DESCRIPTION)}`,
          )
        : html,
  }
}

// Preload the two Latin fonts so text settles in the brand fonts without waiting for the CSS (DESIGN2).
function fontPreloadPlugin(): Plugin {
  return {
    name: 'font-preload',
    apply: 'build',
    transformIndexHtml: (html, ctx) => {
      const base = process.env.BASE_PATH ?? '/'
      const fonts = Object.keys(ctx.bundle ?? {}).filter((f) =>
        /\/(inter|source-serif-4)-latin-wght-normal-[\w-]+\.woff2$/.test(f),
      )
      const links = fonts.map(
        (f) => `<link rel="preload" href="${base}${f}" as="font" type="font/woff2" crossorigin />`,
      )
      return html.replace('</head>', `    ${links.join('\n    ')}\n  </head>`)
    },
  }
}

// BASE_PATH lets GitHub Pages serve the app from /<repo>/.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss(), cspPlugin(), landingHeadPlugin(), fontPreloadPlugin()],
  build: {
    // pages.html is the template for the prerendered static pages (scripts/prerender.tsx).
    rollupOptions: { input: { main: 'index.html', pages: 'pages.html' } },
    // Fonts must be files, not data: URIs, or the CSP (font-src 'self') blocks them.
    assetsInlineLimit: (file) =>
      file.endsWith('.woff2') || file.endsWith('.woff') ? false : undefined,
  },
})
