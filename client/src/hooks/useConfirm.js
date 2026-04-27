import { useState, useCallback } from 'react'
import ConfirmModal from '../components/ui/ConfirmModal.jsx'

/**
 * Promise-based confirm hook — drop-in replacement for window.confirm().
 *
 * Usage:
 *   const { confirm, ConfirmDialog } = useConfirm()
 *   // In JSX: <ConfirmDialog />
 *   // In handler:
 *   const ok = await confirm({ title: 'Delete note?', message: 'This cannot be undone.' })
 *   if (!ok) return
 */
export function useConfirm() {
  const [state, setState] = useState({ open: false, resolve: null, title: '', message: '', confirmLabel: 'Delete' })

  const confirm = useCallback(({ title, message, confirmLabel = 'Delete' } = {}) => {
    return new Promise((resolve) => {
      setState({ open: true, resolve, title, message, confirmLabel })
    })
  }, [])

  const handleConfirm = () => {
    state.resolve?.(true)
    setState(s => ({ ...s, open: false }))
  }

  const handleCancel = () => {
    state.resolve?.(false)
    setState(s => ({ ...s, open: false }))
  }

  const ConfirmDialog = () => (
    <ConfirmModal
      open={state.open}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  )

  return { confirm, ConfirmDialog }
}
