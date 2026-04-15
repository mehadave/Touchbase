import { useState, useEffect } from 'react'
import { MapPin, Globe, Calendar, Users, Edit3, Trash2 } from 'lucide-react'
import { Drawer } from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Avatar from '../ui/Avatar.jsx'
import ConferenceForm from './ConferenceForm.jsx'
import { getConference, updateConference, deleteConference } from '../../api/conferences.js'
import { useUIStore } from '../../store/useUIStore.js'
import { format } from 'date-fns'

export default function ConferenceDetail({ conferenceId, open, onClose, onDeleted }) {
  const [conf, setConf]     = useState(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const { addToast } = useUIStore()

  useEffect(() => {
    if (!open || !conferenceId) return
    getConference(conferenceId).then(setConf).catch(() => {})
  }, [open, conferenceId])

  if (!conf) return null

  const handleSave = async (data) => {
    setLoading(true)
    try {
      const updated = await updateConference(conf.id, data)
      setConf(c => ({ ...c, ...updated }))
      setEditing(false)
      addToast('Conference saved')
    } catch { addToast('Failed to save', 'error') }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${conf.name}"?`)) return
    await deleteConference(conf.id)
    addToast('Conference deleted')
    onClose()
    onDeleted?.()
  }

  return (
    <Drawer open={open} onClose={onClose} title={conf.name}>
      <div className="p-6 space-y-6">
        {/* Meta */}
        <div className="space-y-2">
          {conf.date && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar size={14} /> {format(new Date(conf.date + 'T12:00:00'), 'MMMM d, yyyy')}
            </div>
          )}
          {conf.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin size={14} /> {conf.location}
            </div>
          )}
          {conf.websiteUrl && (
            <a href={conf.websiteUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600">
              <Globe size={14} /> {conf.websiteUrl}
            </a>
          )}
        </div>

        {conf.notes && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 rounded-lg p-3">{conf.notes}</p>
          </div>
        )}

        {/* Contacts met */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} className="text-gray-400" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              People Met ({conf.contacts?.length || 0})
            </p>
          </div>
          {conf.contacts?.length > 0 ? (
            <div className="space-y-2">
              {conf.contacts.map(c => (
                <div key={c.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
                  <Avatar name={c.full_name || c.fullName} photoPath={c.photo_path || c.photoPath} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{c.full_name || c.fullName}</p>
                    <p className="text-xs text-gray-500">{c.job_title || c.jobTitle} {c.company ? `· ${c.company}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No contacts linked yet.</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
            <Edit3 size={14} /> Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-500 hover:bg-red-50 gap-1.5">
            <Trash2 size={14} /> Delete
          </Button>
        </div>
      </div>

      {editing && (
        <div className="border-t border-gray-200 dark:border-gray-800">
          <ConferenceForm initial={conf} onSubmit={handleSave} onCancel={() => setEditing(false)} loading={loading} />
        </div>
      )}
    </Drawer>
  )
}
