import { Loader2 } from 'lucide-react'

export default function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-amber-500 ${className}`} />
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={32} />
    </div>
  )
}
