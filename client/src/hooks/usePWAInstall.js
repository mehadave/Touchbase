import { useState, useEffect } from 'react'

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installable, setInstallable]       = useState(false)
  const [showIOSInstructions, setShowIOS]   = useState(false)

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches

    if (isIOS && !isStandalone) {
      setShowIOS(true)
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setInstallable(false)
  }

  return { installable, install, showIOSInstructions, dismissIOS: () => setShowIOS(false) }
}
