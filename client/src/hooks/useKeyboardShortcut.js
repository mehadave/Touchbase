import { useEffect } from 'react'

export function useKeyboardShortcut(key, callback, { meta = false, ctrl = false, shift = false } = {}) {
  useEffect(() => {
    const handler = (e) => {
      if (meta && !e.metaKey && !e.ctrlKey) return
      if (ctrl && !e.ctrlKey) return
      if (shift && e.shiftKey !== shift) return
      if (e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault()
        callback(e)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [key, callback, meta, ctrl, shift])
}
