import { useState } from 'react'
import { Download, X, Share } from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall.js'
import Button from './ui/Button.jsx'

export default function PWAInstallBanner() {
  const { installable, install, showIOSInstructions, dismissIOS } = usePWAInstall()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  if (installable) {
    return (
      <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl shadow-2xl p-4 flex items-center gap-3 z-40 animate-slide-up">
        <div className="flex-1">
          <p className="font-semibold text-sm">Install Touchbase</p>
          <p className="text-xs opacity-70 mt-0.5">Add to your home screen for instant access</p>
        </div>
        <Button size="sm" onClick={install} className="bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0">
          <Download size={14} /> Install
        </Button>
        <button onClick={() => setDismissed(true)} className="text-white/60 dark:text-gray-400 hover:text-white dark:hover:text-gray-700 flex-shrink-0">
          <X size={16} />
        </button>
      </div>
    )
  }

  if (showIOSInstructions) {
    return (
      <div className="fixed bottom-20 left-4 right-4 bg-gray-900 text-white rounded-2xl shadow-2xl p-4 z-40 animate-slide-up">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-sm mb-1">Install on iPhone</p>
            <p className="text-xs opacity-70 leading-relaxed">
              Tap <Share size={11} className="inline" /> <strong>Share</strong> at the bottom of Safari,
              then tap <strong>"Add to Home Screen"</strong>
            </p>
          </div>
          <button onClick={dismissIOS} className="text-white/60 flex-shrink-0">
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  return null
}
