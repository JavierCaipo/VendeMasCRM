import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import posthog from 'posthog-js'
import App from './App.jsx'

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  autocapture: true, // Captura clics y pageviews automáticamente
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
