import { useState, useEffect } from 'react'

/**
 * Returns true only if `loading` has been true for longer than `delay` ms.
 * Prevents skeleton flicker on fast fetches — the skeleton never shows if
 * data arrives before the delay expires.
 */
export function useDelayedLoading(loading, delay = 150) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!loading) {
      setShow(false)
      return
    }
    const t = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(t)
  }, [loading, delay])

  return show
}
