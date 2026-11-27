import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import { prefetchContentWhenIdle } from './locales/contentLoader'
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

// Fetch the long per-tool text in idle time after the page has loaded, so it is usually ready when a tool page opens
// but never competes with the first paint. A tool page loads it itself if it is not ready.
prefetchContentWhenIdle()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
