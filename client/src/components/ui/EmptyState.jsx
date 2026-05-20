export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-5 shadow-inner">
          {typeof icon === 'string'
            ? <span className="text-2xl">{icon}</span>
            : icon
          }
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed mb-6">{description}</p>
      )}
      {action}
    </div>
  )
}
