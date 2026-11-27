import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import '../styles/fonts.css'
import '../index.css'
import { Layout } from './Layout.tsx'
import { STATIC_PAGES } from './registry.tsx'

// Hydrates a prerendered static page; the page works without this script (plain HTML and links).
const theme = localStorage.getItem('theme')
if (theme === 'dark' || theme === 'light') document.documentElement.classList.add(theme)

const root = document.getElementById('root')
const page = STATIC_PAGES.find((p) => p.id === document.body.dataset.page)
if (root && page)
  hydrateRoot(
    root,
    <StrictMode>
      <Layout>{page.render()}</Layout>
    </StrictMode>,
  )
