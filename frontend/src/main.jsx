import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { loadCatalog } from './data/site'

if (!/^\/admin(?:\/|$)/.test(window.location.pathname)) await loadCatalog()
const { default: App } = await import('./App.jsx')
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
