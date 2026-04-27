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

// ── Shared pulse base ─────────────────────────────────────────────────────────
function Pulse({ className }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg ${className}`} />
}

// ── Contact card skeleton ─────────────────────────────────────────────────────
export function ContactCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full animate-pulse bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Pulse className="h-4 w-3/4" />
          <Pulse className="h-3 w-1/2" />
          <div className="flex gap-1 mt-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-3 h-3 rounded-full animate-pulse bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        </div>
        <Pulse className="h-5 w-16 rounded-full" />
      </div>
      {/* Tags row */}
      <div className="flex gap-1.5">
        <Pulse className="h-5 w-14 rounded-full" />
        <Pulse className="h-5 w-10 rounded-full" />
      </div>
      {/* Footer */}
      <Pulse className="h-8 w-full" />
    </div>
  )
}

// ── Note card skeleton ────────────────────────────────────────────────────────
export function NoteCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3 break-inside-avoid mb-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5 flex-1">
          <Pulse className="h-4 w-2/3" />
          <Pulse className="h-4 w-16 rounded-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Pulse className="h-3 w-full" />
        <Pulse className="h-3 w-5/6" />
        <Pulse className="h-3 w-4/6" />
      </div>
      <Pulse className="h-3 w-24" />
    </div>
  )
}

// ── Template card skeleton ────────────────────────────────────────────────────
export function TemplateCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-5 pt-5 pb-3 space-y-2">
        <Pulse className="h-4 w-1/2" />
        <Pulse className="h-4 w-16 rounded-full" />
      </div>
      <div className="px-5 pb-5 space-y-2">
        <Pulse className="h-3 w-full" />
        <Pulse className="h-3 w-full" />
        <Pulse className="h-3 w-4/5" />
        <Pulse className="h-3 w-3/5" />
      </div>
    </div>
  )
}

// ── Dashboard skeleton ────────────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Pulse className="h-7 w-36" />
        <Pulse className="h-4 w-64" />
      </div>
      {/* Streak bar */}
      <Pulse className="h-16 w-full rounded-2xl" />
      {/* Today's touchbase card */}
      <div className="space-y-3">
        <Pulse className="h-5 w-44" />
        <Pulse className="h-40 w-full rounded-2xl" />
      </div>
      {/* Two-col grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Pulse className="h-5 w-40" />
          {[...Array(3)].map((_, i) => <Pulse key={i} className="h-16 w-full rounded-xl" />)}
        </div>
        <div className="space-y-3">
          <Pulse className="h-5 w-40" />
          {[...Array(3)].map((_, i) => <Pulse key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      </div>
    </div>
  )
}
