import { useState } from 'react'
import { TagBadge } from '../ui/Badge.jsx'

export default function TagInput({ value = [], onChange, placeholder = 'Add tags…' }) {
  const [input, setInput] = useState('')

  const addTag = (raw) => {
    const tag = raw.trim().toLowerCase().replace(/^#/, '').replace(/[^a-z0-9-_]/g, '')
    if (!tag || value.includes(tag)) return
    onChange([...value, tag])
    setInput('')
  }

  const removeTag = (tag) => onChange(value.filter(t => t !== tag))

  const handleKey = (e) => {
    if (['Enter', ',', ' '].includes(e.key)) {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map(tag => (
          <TagBadge key={tag} name={tag} onRemove={() => removeTag(tag)} />
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => input && addTag(input)}
        placeholder={value.length ? '' : placeholder}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
      <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add a tag</p>
    </div>
  )
}
