import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Upload, SlidersHorizontal, Search, X, Users, ScanLine, CheckSquare, Trash2, Square } from 'lucide-react'
import ContactCard from '../components/contacts/ContactCard.jsx'
import ContactDetail from '../components/contacts/ContactDetail.jsx'
import ContactForm from '../components/contacts/ContactForm.jsx'
import CSVImportModal from '../components/contacts/CSVImportModal.jsx'
import BulkScanModal from '../components/contacts/BulkScanModal.jsx'
import Button from '../components/ui/Button.jsx'
import Input, { Select } from '../components/ui/Input.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { useContactsStore } from '../store/useContactsStore.js'
import { useUIStore } from '../store/useUIStore.js'
import { useDebounce } from '../hooks/useDebounce.js'
import Modal from '../components/ui/Modal.jsx'
import { listConferences } from '../api/conferences.js'

export default function Contacts() {
  const { contacts, filters, sortBy, setFilter, setSortBy, fetchContacts, createContact, deleteContact } = useContactsStore()
  const { addToast } = useUIStore()
  const [selectedContact, setSelectedContact] = useState(null)
  const [showDetail, setShowDetail]           = useState(false)
  const [showAdd, setShowAdd]                 = useState(false)
  const [showImport, setShowImport]           = useState(false)
  const [showBulkScan, setShowBulkScan]       = useState(false)
  const [showFilters, setShowFilters]         = useState(false)
  const [addLoading, setAddLoading]           = useState(false)
  const [localSearch, setLocalSearch]         = useState(filters.search || '')
  const [conferences, setConferences]         = useState([])
  // Selection mode
  const [selecting, setSelecting]             = useState(false)
  const [selectedIds, setSelectedIds]         = useState(new Set())
  const [deleting, setDeleting]               = useState(false)
  const debouncedSearch = useDebounce(localSearch, 300)
  const mountedRef = useRef(false)

  useEffect(() => {
    listConferences().then(setConferences).catch(() => {})
  }, [])

  useEffect(() => {
    if (!mountedRef.current) return
    setFilter('search', debouncedSearch)
  }, [debouncedSearch])

  useEffect(() => {
    mountedRef.current = true
    fetchContacts()
  }, [filters, sortBy])

  const openContact = (c) => {
    if (selecting) {
      toggleSelect(c.id)
    } else {
      setSelectedContact(c); setShowDetail(true)
    }
  }

  const handleCreate = async (data) => {
    setAddLoading(true)
    try {
      await createContact(data)
      setShowAdd(false)
    } finally {
      setAddLoading(false)
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(contacts.map(c => c.id)))
    }
  }

  const exitSelecting = () => { setSelecting(false); setSelectedIds(new Set()) }

  const handleBulkDelete = async () => {
    if (!selectedIds.size) return
    if (!confirm(`Delete ${selectedIds.size} contact${selectedIds.size !== 1 ? 's' : ''}? This cannot be undone.`)) return
    setDeleting(true)
    let done = 0
    for (const id of selectedIds) {
      try { await deleteContact(id); done++ } catch { /* skip */ }
    }
    addToast(`${done} contact${done !== 1 ? 's' : ''} deleted`)
    exitSelecting()
    setDeleting(false)
  }

  const activeFilterCount = [filters.category, filters.tag, filters.strength, filters.overdue, filters.conference_id]
    .filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{contacts.length} people</p>
        </div>
        {!selecting ? (
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={14} /> Import CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowBulkScan(true)}>
              <ScanLine size={14} /> Scan
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setSelecting(true) }}>
              <CheckSquare size={14} /> Select
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus size={14} /> Add
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">{selectedIds.size} selected</span>
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>
              {selectedIds.size === contacts.length ? <CheckSquare size={14} /> : <Square size={14} />}
              {selectedIds.size === contacts.length ? 'Deselect all' : 'Select all'}
            </Button>
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white border-red-500"
                onClick={handleBulkDelete}
                loading={deleting}
              >
                <Trash2 size={14} /> Delete {selectedIds.size}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={exitSelecting}>Cancel</Button>
          </div>
        )}
      </div>

      {/* Search & filters bar */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            placeholder="Search contacts…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {localSearch && (
            <button onClick={() => setLocalSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        <Select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-40">
          <option value="name">Name (A–Z)</option>
          <option value="last_contacted">Last contacted</option>
          <option value="next_follow_up">Next follow-up</option>
          <option value="strength">Relationship strength</option>
        </Select>

        <Button
          variant={showFilters || activeFilterCount > 0 ? 'primary' : 'outline'}
          size="md"
          onClick={() => setShowFilters(s => !s)}
          className="gap-2"
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeFilterCount > 0 && <span className="bg-white/30 text-xs rounded-full px-1.5 py-0">{activeFilterCount}</span>}
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          <Select label="Category" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
            <option value="">All categories</option>
            <option>Personal</option>
            <option>Professional</option>
            <option>Social</option>
          </Select>
          <Select label="Conference" value={filters.conference_id} onChange={e => setFilter('conference_id', e.target.value)}>
            <option value="">All conferences</option>
            {conferences.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Strength" value={filters.strength} onChange={e => setFilter('strength', e.target.value)}>
            <option value="">Any strength</option>
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{'⭐'.repeat(n)}</option>)}
          </Select>
          <Input label="Tag" value={filters.tag} onChange={e => setFilter('tag', e.target.value)} placeholder="e.g. investor" />
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={filters.overdue} onChange={e => setFilter('overdue', e.target.checked)}
                className="accent-amber-500" />
              Show overdue only
            </label>
          </div>
          <div className="flex flex-col justify-end">
            <Button variant="ghost" size="sm" onClick={() => { useContactsStore.getState().clearFilters(); setLocalSearch('') }}>
              Clear all filters
            </Button>
          </div>
        </div>
      )}

      {/* Contact grid */}
      {contacts.length === 0 ? (
        <EmptyState
          icon={<Users size={24} className="text-gray-400" />}
          title="No contacts yet"
          description="Add your first contact to start building your network. You can also import from a CSV file."
          action={<Button onClick={() => setShowAdd(true)}><Plus size={14} /> Add your first contact</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {contacts.map(c => (
            <div key={c.id} className="relative">
              {selecting && (
                <button
                  onClick={() => toggleSelect(c.id)}
                  className="absolute top-3 left-3 z-10"
                >
                  {selectedIds.has(c.id)
                    ? <CheckSquare size={18} className="text-amber-500 drop-shadow-sm" />
                    : <Square size={18} className="text-gray-300 drop-shadow-sm" />
                  }
                </button>
              )}
              <div className={selecting && selectedIds.has(c.id) ? 'ring-2 ring-amber-400 rounded-2xl' : ''}>
                <ContactCard contact={c} onClick={() => openContact(c)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contact detail drawer */}
      <ContactDetail
        contact={selectedContact}
        open={showDetail}
        onClose={() => setShowDetail(false)}
      />

      {/* Add contact modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Contact" size="lg">
        <ContactForm onSubmit={handleCreate} onCancel={() => setShowAdd(false)} loading={addLoading} />
      </Modal>

      {/* CSV import modal */}
      <CSVImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={() => fetchContacts()}
      />

      {/* Bulk scan modal */}
      <BulkScanModal
        open={showBulkScan}
        onClose={() => setShowBulkScan(false)}
        onImported={(saved, failed, dupes) => {
          fetchContacts()
          const parts = [`${saved} imported`]
          if (dupes  > 0) parts.push(`${dupes} already existed`)
          if (failed > 0) parts.push(`${failed} failed`)
          addToast(parts.join(' · '), failed > 0 ? 'warning' : 'success')
        }}
      />
    </div>
  )
}
