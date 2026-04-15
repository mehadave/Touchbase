import { createPortal } from 'react-dom'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { useUIStore } from '../../store/useUIStore.js'

const icons = {
  success: <CheckCircle size={16} className="text-green-500 flex-shrink-0" />,
  error:   <AlertCircle size={16} className="text-red-500 flex-shrink-0" />,
  info:    <Info size={16} className="text-blue-500 flex-shrink-0" />,
}

function Toast({ toast }) {
  const removeToast = useUIStore(s => s.removeToast)

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 min-w-64 max-w-sm animate-toast-in">
      {icons[toast.type] || icons.info}
      <p className="flex-1 text-sm text-gray-800 dark:text-gray-200 font-medium">{toast.message}</p>
      <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useUIStore(s => s.toasts)

  return createPortal(
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[100] flex flex-col gap-2 items-end">
      {toasts.map(t => <Toast key={t.id} toast={t} />)}
    </div>,
    document.body
  )
}
