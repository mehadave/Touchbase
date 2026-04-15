import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './index.css'

// Initialize dark mode before React mounts to prevent flash
const saved = localStorage.getItem('touchbase-dark')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
if (saved === 'true' || (!saved && prefersDark)) {
  document.documentElement.classList.add('dark')
}

// Register service worker via vite-plugin-pwa (auto-update on new deploy)
registerSW({
  onOfflineReady() {
    console.log('Touchbase is ready to work offline.')
  },
  onNeedRefresh() {
    // Auto-update without prompting for a personal app
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
