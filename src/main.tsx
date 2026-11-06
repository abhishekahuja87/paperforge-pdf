import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import theme from './config/theme.json'
import App from './App.tsx'

for (const [name, value] of Object.entries(theme)) {
  document.documentElement.style.setProperty(`--theme-${name}`, value)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
