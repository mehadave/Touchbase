import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, User, MessageSquare, MapPin } from 'lucide-react'
import { useUIStore } from '../store/useUIStore.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { listContacts } from '../api/contacts.js'
import { listTemplates } from '../api/templates.js'
import { listConferences } from '../api/conferences.js'
import Avatar from './ui/Avatar.jsx'

export default function SearchModal() {
  const { searchOpen, setSearchOpen } = useUIStore()
  const [query, setQuery]   = useState('')
  const [results, setResults] = useState({ contacts: [], templates: [], conferences: [] })
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const debouncedQuery = useDebounce(query, 250)

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50)
    else setQuery('')
  }, [searchOpen])

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults({ contacts: [], templates: [], conferences: [] }); return }
    setLoading(true)
    const q = debouncedQuery.toLowerCase()
    Promise.all([
      listContacts({ search: debouncedQuery, limit: 5 }),
      listTemplates(),
      listConferences(),
    ]).then(([contacts, templates, conferences]) => {
      setResults({
        contacts,
        templates: templates.filter(t =>
          t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q)
        ).slice(0, 3),
        conferences: conferences.filter(c =>
          c.name.toLowerCase().includes(q) || c.location?.toLowerCase().includes(q)
        ).slice(0, 3),
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [debouncedQuery])

  const total = results.contacts.length + results.templates.length + results.conferences.length
  const hasResults = total > 0 && query.trim()

  if (!searchOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={() => setSearchOpen(false)}>
      <div className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search contacts, templates, conferences…"
            className="flex-1 text-base bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
          <kbd className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 font-mono text-gray-500">Esc</kbd>
        </div>

        {/* Results */}
        {query.trim() && (
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="py-8 text-center text-sm text-gray-400">Searching…</div>
            )}

            {!loading && !hasResults && (
              <div className="py-8 text-center text-sm text-gray-400">
                No results for "{query}"
              </div>
            )}

            {!loading && results.contacts.length > 0 && (
              <div>
                <p className="px-5 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                  <User size={10} /> Contacts
                </p>
                {results.contacts.map(c => (
                  <button key={c.id} onClick={() => setSearchOpen(false)}
                    className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <Avatar name={c.fullName} photoPath={c.photoPath} size="sm" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.fullName}</p>
                      <p className="text-xs text-gray-500 truncate">{c.jobTitle}{c.company ? ` · ${c.company}` : ''}</p>
                    </div>
                    <span className="text-xs text-gray-400">{c.category}</span>
                  </button>
                ))}
              </div>
            )}

            {!loading && results.templates.length > 0 && (
              <div>
                <p className="px-5 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                  <MessageSquare size={10} /> Templates
                </p>
                {results.templates.map(t => (
                  <button key={t.id} onClick={() => setSearchOpen(false)}
                    className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <MessageSquare size={16} className="text-amber-400 flex-shrink-0" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{t.title}</p>
                      <p className="text-xs text-gray-500 truncate">{t.body.slice(0, 60)}…</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && results.conferences.length > 0 && (
              <div>
                <p className="px-5 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin size={10} /> Conferences
                </p>
                {results.conferences.map(c => (
                  <button key={c.id} onClick={() => setSearchOpen(false)}
                    className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <MapPin size={16} className="text-violet-400 flex-shrink-0" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.location}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && hasResults && (
              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-400">{total} result{total !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>
        )}

        {/* Empty state prompt */}
        {!query.trim() && (
          <div className="py-8 text-center text-sm text-gray-400">
            Type to search across contacts, templates, and conferences
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
