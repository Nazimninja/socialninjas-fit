import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { MOBILE } from './lib/mobile.js'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
)

// Force unregister stale legacy service workers and clear browser caches
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    for (let reg of regs) {
      reg.unregister()
    }
  })
}
if ('caches' in window) {
  caches.keys().then(keys => {
    for (let key of keys) {
      if (!key.startsWith('fitninjas-v3')) caches.delete(key)
    }
  })
}
