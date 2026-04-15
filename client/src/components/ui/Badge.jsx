const categoryColors = {
  Personal:     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Professional: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Social:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
}

export function CategoryBadge({ category }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[category] || 'bg-gray-100 text-gray-600'}`}>
      {category}
    </span>
  )
}

export function TagBadge({ name, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium border border-amber-200 dark:border-amber-800">
      #{name}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-amber-900 dark:hover:text-amber-100 leading-none">×</button>
      )}
    </span>
  )
}

export function SourceBadge({ source }) {
  const map = {
    conference: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    linkedin:   'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    manual:     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    csv:        'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[source] || map.manual}`}>
      {source}
    </span>
  )
}
