import { useState, useEffect } from 'react'
import { Edit3, Trash2, Link2, Mail, Phone, Building, ScanLine, Copy, ExternalLink } from 'lucide-react'
import { Drawer } from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Avatar from '../ui/Avatar.jsx'
import StarRating from '../ui/StarRating.jsx'
import { CategoryBadge, TagBadge, SourceBadge } from '../ui/Badge.jsx'
import PhotoUpload from './PhotoUpload.jsx'
import ContactForm from './ContactForm.jsx'
import { useContactsStore } from '../../store/useContactsStore.js'
import { useUIStore } from '../../store/useUIStore.js'
import { stalenessInfo, lastContactedLabel, fillTemplate } from '../../utils/contact.js'
import { listTemplates } from '../../api/templates.js'
import { format, isValid } from 'date-fns'

export default function ContactDetail({ contact: initialContact, open, onClose }) {
  const [contact, setContact]   = useState(initialContact)
  const [editing, setEditing]   = useState(false)
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)

  const updateContact = useContactsStore(s => s.updateContact)
  const deleteContact = useContactsStore(s => s.deleteContact)
  const { addToast, openModal } = useUIStore()

  useEffect(() => { setContact(initialContact); setEditing(false) }, [initialContact])
  useEffect(() => { listTemplates().then(setTemplates).catch(() => {}) }, [open])

  if (!contact) return null

  const info = stalenessInfo(contact)

  const handleSave = async (data) => {
    try {
      const updated = await updateContact(contact.id, data)
      setContact(updated)
      setEditing(false)
    } catch { addToast('Failed to save', 'error') }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete ${contact.fullName}? This cannot be undone.`)) return
    await deleteContact(contact.id)
    onClose()
    addToast(`${contact.fullName} deleted`)
  }

  const handleCopyTemplate = () => {
    if (!selectedTemplate) return
    const filled = fillTemplate(selectedTemplate.body, contact)
    navigator.clipboard.writeText(filled)
    addToast('Message copied')
  }

  // OCR: extract LinkedIn URL from screenshot
  const handleOCR = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      setOcrLoading(true)
      setOcrProgress(0)
      try {
        const { createWorker } = await import('tesseract.js')
        const worker = await createWorker('eng', 1, {
          logger: m => { if (m.progress) setOcrProgress(Math.round(m.progress * 100)) }
        })
        const { data: { text } } = await worker.recognize(file)
        await worker.terminate()

        const match = text.match(/linkedin\.com\/in\/[\w-]+/i)
        if (match) {
          const url = `https://${match[0]}`
          const updated = await updateContact(contact.id, { linkedinUrl: url })
          setContact(updated)
          addToast('LinkedIn URL detected and saved')
        } else {
          addToast('No LinkedIn URL found — please paste it manually', 'info')
        }
      } catch {
        addToast('OCR failed', 'error')
      } finally {
        setOcrLoading(false)
        setOcrProgress(0)
      }
    }
    input.click()
  }

  const filledMessage = selectedTemplate
    ? fillTemplate(selectedTemplate.body, contact)
    : null

  return (
    <Drawer open={open} onClose={onClose} title="">
      <div className="p-6 space-y-6">
        {/* Header: photo + name */}
        <div className="flex items-start gap-4">
          <PhotoUpload contact={contact} onUpdate={setContact} />
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{contact.fullName}</h2>
            {(contact.jobTitle || contact.company) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {contact.jobTitle}{contact.jobTitle && contact.company ? ' · ' : ''}{contact.company}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <CategoryBadge category={contact.category} />
              <SourceBadge source={contact.source} />
              <StarRating value={contact.relationshipStrength} readOnly size={13} />
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label="Edit">
              <Edit3 size={16} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" aria-label="Delete">
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        {/* Staleness status */}
        <div className={`flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 ${
          info.status === 'overdue' ? 'bg-red-50 dark:bg-red-900/20 text-red-600'
          : info.status === 'soon'  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
          : 'bg-green-50 dark:bg-green-900/20 text-green-600'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            info.status === 'overdue' ? 'bg-red-500' : info.status === 'soon' ? 'bg-amber-400' : 'bg-green-500'
          }`} />
          {lastContactedLabel(contact)} · {info.label}
          {contact.nextFollowUp && (
            <span className="ml-auto text-xs opacity-70">
              Next: {format(new Date(contact.nextFollowUp + 'T12:00:00'), 'MMM d')}
            </span>
          )}
        </div>

        {/* Contact details */}
        <div className="space-y-3">
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors group">
              <Mail size={15} className="text-gray-400 group-hover:text-amber-500 flex-shrink-0" />
              {contact.email}
            </a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors group">
              <Phone size={15} className="text-gray-400 group-hover:text-amber-500 flex-shrink-0" />
              {contact.phone}
            </a>
          )}
          {contact.company && (
            <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <Building size={15} className="text-gray-400 flex-shrink-0" />
              {contact.company}
            </div>
          )}

          {/* LinkedIn */}
          <div className="flex items-center gap-2">
            {contact.linkedinUrl ? (
              <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 font-medium">
                <Link2 size={15} />
                LinkedIn Profile
                <ExternalLink size={12} />
              </a>
            ) : (
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Link2 size={15} /> No LinkedIn URL
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleOCR} loading={ocrLoading} className="ml-auto text-xs">
              <ScanLine size={13} />
              {ocrLoading ? `Scanning… ${ocrProgress}%` : 'Scan screenshot'}
            </Button>
          </div>
        </div>

        {/* Tags */}
        {contact.tags?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {contact.tags.map(t => <TagBadge key={t.name || t} name={t.name || t} />)}
            </div>
          </div>
        )}

        {/* Notes */}
        {contact.notes && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Notes</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              {contact.notes}
            </p>
          </div>
        )}

        {/* Use Template */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Send a Message</p>
          <select
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={selectedTemplate?.id || ''}
            onChange={e => setSelectedTemplate(templates.find(t => t.id === e.target.value) || null)}
          >
            <option value="">Choose a template…</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>

          {filledMessage && (
            <div className="relative">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed border border-gray-200 dark:border-gray-700 pr-10">
                {filledMessage}
              </div>
              <Button variant="ghost" size="icon" onClick={handleCopyTemplate}
                className="absolute top-2 right-2 text-gray-400 hover:text-amber-500">
                <Copy size={14} />
              </Button>
            </div>
          )}
        </div>

        {/* Follow-up info */}
        <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
          <p>Follow-up every {contact.followUpFrequency} days</p>
          <p>Added {contact.createdAt ? format(new Date(contact.createdAt), 'MMM d, yyyy') : 'Unknown'}</p>
        </div>
      </div>

      {/* Inline edit form */}
      {editing && (
        <div className="border-t border-gray-200 dark:border-gray-800">
          <ContactForm
            initial={contact}
            onSubmit={handleSave}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}
    </Drawer>
  )
}
