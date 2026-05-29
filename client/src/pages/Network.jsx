import { useEffect, useState } from 'react'
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { Plus, MapPin, Calendar, Globe, Users, User, Presentation, Briefcase } from 'lucide-react'
import ContactCard from '../components/contacts/ContactCard.jsx'
import ContactDetail from '../components/contacts/ContactDetail.jsx'
import ConferenceDetail from '../components/conferences/ConferenceDetail.jsx'
import ConferenceForm from '../components/conferences/ConferenceForm.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
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
  const [selected, setSelected]     = useState(null)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    listContacts({ category })
      .then(d => setContacts(d))
      .catch(() => {})
  }, [category])

  if (!contacts.length) return (
    <EmptyState icon={<User size={24} className="text-gray-400" />} title={`No ${category} contacts yet`}
      description={`Add contacts in the ${category} category to see them here.`} />
  )
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
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
  const [selectedContact, setSelectedContact] = useState(null)
  const [showContactDetail, setShowContactDetail] = useState(false)
  const [selectedConf, setSelectedConf] = useState(null)
  const [showConfDetail, setShowConfDetail] = useState(false)
  const [showAddConf, setShowAddConf]   = useState(false)
  const [addLoading, setAddLoading]     = useState(false)
  const { addToast } = useUIStore()

  const load = () => {
    Promise.all([listContacts({ category: 'Professional' }), listConferences()])
      .then(([c, conf]) => { setContacts(c); setConferences(conf) })
      .catch(() => {})
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


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Conferences section */}
      <section>
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin size={16} className="text-violet-500" /> Conferences
          </h2>
          <Button size="sm" onClick={() => setShowAddConf(true)}>
            <Plus size={14} /> Add Conference
          </Button>
        </div>

        {conferences.length === 0 ? (
          <EmptyState icon={<Presentation size={24} className="text-gray-400" />} title="No conferences yet"
            description="Track the conferences you attend and the people you meet there."
            action={<Button size="sm" onClick={() => setShowAddConf(true)}><Plus size={14} /> Add Conference</Button>} />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {conferences.map(conf => (
              <div key={conf.id}
                onClick={() => { setSelectedConf(conf.id); setShowConfDetail(true) }}
                className="cursor-pointer bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-1.5 gap-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{conf.name}</h3>
                  <span className="text-xs text-violet-500 bg-violet-50 dark:bg-violet-900/20 px-1.5 py-0.5 rounded-full shrink-0">conf</span>
                </div>
                <div className="space-y-0.5">
                  {conf.date && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                      <Calendar size={10} className="shrink-0" /> {format(new Date(conf.date + 'T12:00:00'), 'MMM d, yyyy')}
                    </div>
                  )}
                  {conf.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                      <MapPin size={10} className="shrink-0" /> {conf.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LinkedIn connections */}
      {contacts.filter(c => c.source === 'linkedin' || c.linkedinUrl).length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <Users size={16} className="text-sky-500" /> LinkedIn Connections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {contacts.filter(c => c.source === 'linkedin' || c.linkedinUrl).map(c => (
              <ContactCard key={c.id} contact={c}
                onClick={() => { setSelectedContact(c); setShowContactDetail(true) }} />
            ))}
          </div>
        </section>
      )}

      {/* All professional contacts */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          All Professional Contacts
        </h2>
        {contacts.length === 0 ? (
          <EmptyState icon={<Briefcase size={24} className="text-gray-400" />} title="No professional contacts yet" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Network</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Browse your connections by relationship type</p>
      </div>

      {/* Sub-tabs — full width on mobile so tabs don't clip */}
      <nav className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-full sm:w-fit">
        <NavLink to="/network/personal"      className={subNavClass + ' flex-1 sm:flex-none text-center'}>Personal</NavLink>
        <NavLink to="/network/professional"  className={subNavClass + ' flex-1 sm:flex-none text-center'}>Professional</NavLink>
        <NavLink to="/network/social"        className={subNavClass + ' flex-1 sm:flex-none text-center'}>Social</NavLink>
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
