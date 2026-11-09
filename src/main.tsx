import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import { loadContent } from './locales/contentLoader'
import theme from './config/theme.json'
import App from './App.tsx'

for (const [name, value] of Object.entries(theme)) {
  document.documentElement.style.setProperty(`--theme-${name}`, value)
}

// Start downloading the long per-tool text now, so it is usually ready by the time a tool page opens.
loadContent().catch(() => undefined)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
