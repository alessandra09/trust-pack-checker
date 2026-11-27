import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App.tsx'
// Self-hosted fonts (SPEC 11.3, owner decision 2026-11-25): served from this origin, no third-party requests.
import './styles/fonts.css'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element missing')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
