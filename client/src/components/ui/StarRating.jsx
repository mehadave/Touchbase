import { Star } from 'lucide-react'

export default function StarRating({ value = 0, onChange, size = 16, readOnly = false }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={`transition-colors ${readOnly ? 'cursor-default' : 'hover:scale-110'}`}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <Star
            size={size}
            className={star <= value
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-300 dark:text-gray-600'
            }
          />
        </button>
      ))}
    </div>
  )
}
