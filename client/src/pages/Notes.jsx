import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Tag, User, Trash2, Edit3, X, Image, StickyNote, ChevronDown } from 'lucide-react'
import { listNotes, createNote, updateNote, deleteNote } from '../api/notes.js'
import { listContacts } from '../api/contacts.js'
import { useUIStore } from '../store/useUIStore.js'
import { PageSpinner } from '../components/ui/Spinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Modal from '../components/ui/Modal.jsx'
import Button from '../components/ui/Button.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import { format, parseISO } from 'date-fns'

const CATEGORIES = ['All', 'Contact Notes', 'General', 'Meeting', 'Idea', 'Follow-up', 'Personal', 'Professional']
const CATEGORY_COLORS = {
  'Contact Notes': 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  General:         'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
  Meeting:         'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  Idea:            'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  'Follow-up':     'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  Personal:        'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
  Professional:    'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
}

function NoteEditor({ initial = {}, contacts = [], onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    title: initial.title || '',
    body: initial.body || '',
    category: initial.category || 'General',
    contact_id: initial.contact_id || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const bodyRef = useRef(null)

  useEffect(() => { bodyRef.current?.focus() }, [])

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="p-5 space-y-4">
      {/* Title */}
      <input
        value={form.title}
        onChange={e => set('title', e.target.value)}
        placeholder="Note title (optional)"
        className="w-full text-lg font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
      />

      {/* Meta row: category + linked contact */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <select
            value={form.category}
            onChange={e => set('category', e.target.value)}
            className="appearance-none text-xs font-medium pl-3 pr-7 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
          >
            {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative flex-1 min-w-40">
          <User size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={form.contact_id}
            onChange={e => set('contact_id', e.target.value)}
            className="appearance-none text-xs pl-7 pr-6 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer w-full"
          >
            <option value="">No linked contact</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 dark:border-gray-800" />

      {/* Body */}
      <textarea
        ref={bodyRef}
        value={form.body}
        onChange={e => set('body', e.target.value)}
        placeholder="Write your note here…"
        rows={8}
        className="w-full text-sm text-gray-800 dark:text-gray-200 bg-transparent border-none outline-none resize-none placeholder-gray-300 dark:placeholder-gray-600 leading-relaxed"
      />

      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} className="flex-1">
          {initial.id ? 'Save changes' : 'Create note'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

function NoteCard({ note, onEdit, onDelete }) {
  const catColor = CATEGORY_COLORS[note.category] || CATEGORY_COLORS.General
  const preview = note.body?.slice(0, 140) + (note.body?.length > 140 ? '…' : '')
  const photos = Array.isArray(note.photo_paths) ? note.photo_paths : (JSON.parse(note.photo_paths || '[]'))

  return (
    <div
      className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all cursor-pointer"
      onClick={onEdit}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          {note.title && (
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{note.title}</h3>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor}`}>
              {note.category}
            </span>
            {note.contact_name && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <User size={10} />{note.contact_name}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 hover:text-red-400 transition-all"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Body preview */}
      {preview && (
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">{preview}</p>
      )}

      {/* Photos strip */}
      {photos.length > 0 && (
        <div className="flex gap-1.5 mt-3">
          {photos.slice(0, 3).map((p, i) => (
            <img key={i} src={p} alt="" className="w-14 h-14 object-cover rounded-lg border border-gray-100 dark:border-gray-800" />
          ))}
          {photos.length > 3 && (
            <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400">
              +{photos.length - 3}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-3">
        {format(parseISO(note.updated_at), 'MMM d, yyyy · h:mm a')}
      </p>
    </div>
  )
}

export default function Notes() {
  const [notes, setNotes]       = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch]     = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const { addToast } = useUIStore()

  const load = (cat = activeCategory, q = search) => {
    const params = {}
    if (cat !== 'All') params.category = cat
    if (q) params.q = q
    listNotes(params)
      .then(d => setNotes(d))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    listContacts({ limit: 500 }).then(d => setContacts(d)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    load(activeCategory, search)
  }, [activeCategory, search])

  const handleCreate = async (data) => {
    setSaveLoading(true)
    try {
      const n = await createNote(data)
      setNotes(prev => [n, ...prev])
      setShowEditor(false)
      addToast('Note created')
    } catch { addToast('Failed', 'error') }
    finally { setSaveLoading(false) }
  }

  const handleEdit = async (data) => {
    setSaveLoading(true)
    try {
      const n = await updateNote(editTarget.id, data)
      setNotes(prev => prev.map(x => x.id === n.id ? n : x))
      setEditTarget(null)
      addToast('Note saved')
    } catch { addToast('Failed', 'error') }
    finally { setSaveLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return
    await deleteNote(id).catch(() => {})
    setNotes(prev => prev.filter(n => n.id !== id))
    addToast('Note deleted')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Capture thoughts, meetings, and ideas</p>
        </div>
        <Button size="sm" onClick={() => setShowEditor(true)}>
          <Plus size={14} /> New Note
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search notes…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-gray-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === cat
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-amber-300 dark:hover:border-amber-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notes grid */}
      {loading ? <PageSpinner /> : notes.length === 0 ? (
        <EmptyState
          icon="📝"
          title={search ? 'No notes match your search' : 'No notes yet'}
          description={search ? 'Try different keywords.' : 'Capture meeting notes, ideas, and follow-ups linked to your contacts.'}
          action={!search && <Button onClick={() => setShowEditor(true)}><Plus size={14} /> Create your first note</Button>}
        />
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-0">
          {notes.map(note => (
            <div key={note.id} className="break-inside-avoid mb-4">
              <NoteCard
                note={note}
                onEdit={() => setEditTarget(note)}
                onDelete={() => handleDelete(note.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showEditor} onClose={() => setShowEditor(false)} title="New Note" size="md">
        <NoteEditor contacts={contacts} onSave={handleCreate} onCancel={() => setShowEditor(false)} loading={saveLoading} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Note" size="md">
        <NoteEditor
          initial={editTarget || {}}
          contacts={contacts}
          onSave={handleEdit}
          onCancel={() => setEditTarget(null)}
          loading={saveLoading}
        />
      </Modal>
    </div>
  )
}
