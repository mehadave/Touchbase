import { useEffect, useState, useCallback } from 'react'
import { Plus, Upload, SlidersHorizontal, Search, X } from 'lucide-react'
import ContactCard from '../components/contacts/ContactCard.jsx'
import ContactDetail from '../components/contacts/ContactDetail.jsx'
import ContactForm from '../components/contacts/ContactForm.jsx'
import CSVImportModal from '../components/contacts/CSVImportModal.jsx'
import Button from '../components/ui/Button.jsx'
import Input, { Select } from '../components/ui/Input.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { PageSpinner } from '../components/ui/Spinner.jsx'
import { useContactsStore } from '../store/useContactsStore.js'
import { useUIStore } from '../store/useUIStore.js'
import { useDebounce } from '../hooks/useDebounce.js'
import Modal from '../components/ui/Modal.jsx'

export default function Contacts() {
  const { contacts, loading, filters, sortBy, setFilter, setSortBy, fetchContacts, createContact } = useContactsStore()
  const { addToast } = useUIStore()
  const [selectedContact, setSelectedContact] = useState(null)
  const [showDetail, setShowDetail]           = useState(false)
  const [showAdd, setShowAdd]                 = useState(false)
  const [showImport, setShowImport]           = useState(false)
  const [showFilters, setShowFilters]         = useState(false)
  const [addLoading, setAddLoading]           = useState(false)
  const [localSearch, setLocalSearch]         = useState(filters.search || '')
  const debouncedSearch = useDebounce(localSearch, 300)

  useEffect(() => {
    setFilter('search', debouncedSearch)
  }, [debouncedSearch])

  useEffect(() => {
    fetchContacts()
  }, [filters, sortBy])

  const openContact = (c) => { setSelectedContact(c); setShowDetail(true) }

  const handleCreate = async (data) => {
    setAddLoading(true)
    try {
      await createContact(data)
      setShowAdd(false)
    } finally {
      setAddLoading(false)
    }
  }

  const activeFilterCount = [filters.category, filters.tag, filters.strength, filters.overdue]
    .filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{contacts.length} people</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
            <Upload size={14} /> Import CSV
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add Contact
          </Button>
        </div>
      </div>

      {/* Search & filters bar */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-56 relative">
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

        <Select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-44">
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
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
          <Select label="Category" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
            <option value="">All categories</option>
            <option>Personal</option>
            <option>Professional</option>
            <option>Social</option>
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
          <Button variant="ghost" size="sm" onClick={() => { useContactsStore.getState().clearFilters(); setLocalSearch('') }}>
            Clear all filters
          </Button>
        </div>
      )}

      {/* Contact grid */}
      {loading ? <PageSpinner /> : contacts.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No contacts yet"
          description="Add your first contact to start building your network. You can also import from a CSV file."
          action={<Button onClick={() => setShowAdd(true)}><Plus size={14} /> Add your first contact</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map(c => (
            <ContactCard key={c.id} contact={c} onClick={() => openContact(c)} />
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
    </div>
  )
}
