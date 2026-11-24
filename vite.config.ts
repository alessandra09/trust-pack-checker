import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { buildCsp } from './src/app/csp.ts'

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

// BASE_PATH lets GitHub Pages serve the app from /<repo>/.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss(), cspPlugin()],
})
