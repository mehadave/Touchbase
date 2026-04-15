export default function Input({ label, error, className = '', textarea = false, ...props }) {
  const base = `
    w-full px-3 py-2 rounded-lg border text-sm transition-colors
    bg-white dark:bg-gray-900
    border-gray-300 dark:border-gray-700
    text-gray-900 dark:text-gray-100
    placeholder-gray-400 dark:placeholder-gray-500
    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
    disabled:opacity-50 disabled:cursor-not-allowed
    ${error ? 'border-red-400 focus:ring-red-400' : ''}
    ${className}
  `

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      {textarea ? (
        <textarea {...props} className={`${base} resize-y min-h-24`} />
      ) : (
        <input {...props} className={base} />
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`
          w-full px-3 py-2 rounded-lg border text-sm transition-colors
          bg-white dark:bg-gray-900
          border-gray-300 dark:border-gray-700
          text-gray-900 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
          ${error ? 'border-red-400' : ''}
          ${className}
        `}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
