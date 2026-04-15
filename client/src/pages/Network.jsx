import { useEffect, useState } from 'react'
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { Plus, MapPin, Calendar, Globe, Users } from 'lucide-react'
import ContactCard from '../components/contacts/ContactCard.jsx'
import ContactDetail from '../components/contacts/ContactDetail.jsx'
import ConferenceDetail from '../components/conferences/ConferenceDetail.jsx'
import ConferenceForm from '../components/conferences/ConferenceForm.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { PageSpinner } from '../components/ui/Spinner.jsx'
import { listContacts } from '../api/contacts.js'
import { listConferences, createConference } from '../api/conferences.js'
import { useUIStore } from '../store/useUIStore.js'
import { format } from 'date-fns'

const subNavClass = ({ isActive }) =>
  `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
    isActive
      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
  }`

function CategoryContacts({ category }) {
  const [contacts, setContacts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    listContacts({ category }).then(d => { setContacts(d); setLoading(false) })
  }, [category])

  if (loading) return <PageSpinner />
  if (!contacts.length) return (
    <EmptyState icon="👤" title={`No ${category} contacts yet`}
      description={`Add contacts in the ${category} category to see them here.`} />
  )
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map(c => (
          <ContactCard key={c.id} contact={c} onClick={() => { setSelected(c); setShowDetail(true) }} />
        ))}
      </div>
      <ContactDetail contact={selected} open={showDetail} onClose={() => setShowDetail(false)} />
    </>
  )
}

function ProfessionalNetwork() {
  const [contacts, setContacts]         = useState([])
  const [conferences, setConferences]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [selectedContact, setSelectedContact] = useState(null)
  const [showContactDetail, setShowContactDetail] = useState(false)
  const [selectedConf, setSelectedConf] = useState(null)
  const [showConfDetail, setShowConfDetail] = useState(false)
  const [showAddConf, setShowAddConf]   = useState(false)
  const [addLoading, setAddLoading]     = useState(false)
  const { addToast } = useUIStore()

  const load = () => {
    Promise.all([
      listContacts({ category: 'Professional' }),
      listConferences(),
    ]).then(([c, conf]) => { setContacts(c); setConferences(conf); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const handleAddConf = async (data) => {
    setAddLoading(true)
    try {
      const c = await createConference(data)
      setConferences(prev => [...prev, c])
      setShowAddConf(false)
      addToast('Conference added')
    } catch { addToast('Failed', 'error') }
    finally { setAddLoading(false) }
  }

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-8">
      {/* Conferences section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin size={18} className="text-violet-500" /> Conferences
          </h2>
          <Button size="sm" onClick={() => setShowAddConf(true)}>
            <Plus size={14} /> Add Conference
          </Button>
        </div>

        {conferences.length === 0 ? (
          <EmptyState icon="🎪" title="No conferences yet"
            description="Track the conferences you attend and the people you meet there."
            action={<Button size="sm" onClick={() => setShowAddConf(true)}><Plus size={14} /> Add Conference</Button>} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {conferences.map(conf => (
              <div key={conf.id}
                onClick={() => { setSelectedConf(conf.id); setShowConfDetail(true) }}
                className="cursor-pointer bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{conf.name}</h3>
                  <span className="text-xs text-violet-500 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-full">conf</span>
                </div>
                <div className="space-y-1">
                  {conf.date && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar size={11} /> {format(new Date(conf.date + 'T12:00:00'), 'MMM d, yyyy')}
                    </div>
                  )}
                  {conf.location && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin size={11} /> {conf.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LinkedIn connections */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Users size={18} className="text-sky-500" /> LinkedIn Connections
        </h2>
        {contacts.filter(c => c.source === 'linkedin' || c.linkedinUrl).length === 0 ? (
          <EmptyState icon="💼" title="No LinkedIn contacts"
            description="Add contacts with a LinkedIn URL or 'LinkedIn' source to see them here." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.filter(c => c.source === 'linkedin' || c.linkedinUrl).map(c => (
              <ContactCard key={c.id} contact={c}
                onClick={() => { setSelectedContact(c); setShowContactDetail(true) }} />
            ))}
          </div>
        )}
      </section>

      {/* All professional contacts */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Professional Contacts</h2>
        {contacts.length === 0 ? (
          <EmptyState icon="💼" title="No professional contacts yet" />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map(c => (
              <ContactCard key={c.id} contact={c}
                onClick={() => { setSelectedContact(c); setShowContactDetail(true) }} />
            ))}
          </div>
        )}
      </section>

      <ContactDetail contact={selectedContact} open={showContactDetail} onClose={() => setShowContactDetail(false)} />
      <ConferenceDetail conferenceId={selectedConf} open={showConfDetail}
        onClose={() => setShowConfDetail(false)} onDeleted={load} />
      <Modal open={showAddConf} onClose={() => setShowAddConf(false)} title="Add Conference" size="md">
        <ConferenceForm onSubmit={handleAddConf} onCancel={() => setShowAddConf(false)} loading={addLoading} />
      </Modal>
    </div>
  )
}

export default function Network() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Network</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Browse your connections by relationship type</p>
      </div>

      {/* Sub-tabs */}
      <nav className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        <NavLink to="/network/personal"      className={subNavClass}>Personal</NavLink>
        <NavLink to="/network/professional"  className={subNavClass}>Professional</NavLink>
        <NavLink to="/network/social"        className={subNavClass}>Social</NavLink>
      </nav>

      <Routes>
        <Route index element={<Navigate to="personal" replace />} />
        <Route path="personal"      element={<CategoryContacts category="Personal" />} />
        <Route path="professional"  element={<ProfessionalNetwork />} />
        <Route path="social"        element={<CategoryContacts category="Social" />} />
      </Routes>
    </div>
  )
}
