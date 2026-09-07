import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { MOBILE } from './lib/mobile.js'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
)

// Register modern Fit Ninja service worker in production for PWA installability and instant loading
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('SW registration:', err)
    })
  })
}
