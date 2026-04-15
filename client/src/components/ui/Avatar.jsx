// Deterministic color from name hash
const COLORS = [
  'bg-amber-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
  'bg-rose-500', 'bg-teal-500', 'bg-indigo-500', 'bg-orange-500',
]

function hashName(name = '') {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return Math.abs(h) % COLORS.length
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

const sizeMap = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-9 h-9 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
}

export default function Avatar({ name = '', photoPath = null, size = 'md', className = '' }) {
  const sizeClass = sizeMap[size] || sizeMap.md
  const color     = COLORS[hashName(name)]

  if (photoPath) {
    return (
      <img
        src={photoPath}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
      />
    )
  }

  return (
    <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ${className}`}>
      {initials(name)}
    </div>
  )
}
