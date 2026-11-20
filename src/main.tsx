import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import { loadContent } from './locales/contentLoader'
import theme from './config/theme.json'
import App from './App.tsx'
import { listenForInstall } from './lib/install'

for (const [name, value] of Object.entries(theme)) {
  document.documentElement.style.setProperty(`--theme-${name}`, value)
}

listenForInstall()

// Offline copy of the site's own pages and files (see public/sw.js). Skipped while developing.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => undefined) })
}

// Start downloading the long per-tool text now, so it is usually ready by the time a tool page opens.
loadContent().catch(() => undefined)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
