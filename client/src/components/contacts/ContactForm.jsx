import { useState, useRef } from 'react'
import Button from '../ui/Button.jsx'
import StarRating from '../ui/StarRating.jsx'
import TagInput from './TagInput.jsx'
import { format } from 'date-fns'
import { Camera, Loader2 as Spinner, AlertCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { findLinkedIn } from '../../api/contacts.js'
import { parseLinkedInOCR } from '../../utils/ocrParse.js'

function linkedInSearchUrl(name, company) {
  const kw = [name, company].filter(Boolean).join(' ')
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(kw)}`
}

const CATEGORIES = ['Personal', 'Professional', 'Social']

const FREQUENCIES = [
  { label: 'Weekly', value: 7 },
  { label: 'Bi-weekly', value: 14 },
  { label: 'Monthly', value: 30 },
  { label: 'Quarterly', value: 90 },
  { label: 'Custom', value: 'custom' },
]

const defaults = {
  fullName: '', email: '', phone: '', company: '', jobTitle: '',
  university: '', category: 'Personal', linkedinUrl: '', notes: '',
  relationshipStrength: 3, lastContacted: '',
  followUpFrequency: 30, source: 'manual', tags: [],
}

const field = 'w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition'

export default function ContactForm({ initial = {}, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    ...defaults, ...initial,
    tags: initial.tags?.map(t => t.name || t) || [],
    lastContacted: initial.lastContacted
      ? format(new Date(initial.lastContacted), 'yyyy-MM-dd') : '',
  })
  const [showMore, setShowMore] = useState(false)
  const [customFreq, setCustomFreq] = useState(false)
  const [errors, setErrors] = useState({})
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrError, setOcrError] = useState('')
  const [ocrStatus, setOcrStatus] = useState('')
  const fileInputRef = useRef(null)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleFreqChange = (v) => {
    if (v === 'custom') { setCustomFreq(true); return }
    setCustomFreq(false)
    set('followUpFrequency', parseInt(v))
  }

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Name is required'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    return e
  }

  const handleLinkedInScan = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOcrLoading(true)
    setOcrError('')
    setOcrStatus('')
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('eng')
      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()

      const parsed = parseLinkedInOCR(text)
      if (parsed.fullName    && !form.fullName)    set('fullName',    parsed.fullName)
      if (parsed.jobTitle    && !form.jobTitle)    set('jobTitle',    parsed.jobTitle)
      if (parsed.company     && !form.company)     set('company',     parsed.company)
      if (parsed.email       && !form.email)       set('email',       parsed.email)
      if (parsed.phone       && !form.phone)       set('phone',       parsed.phone)
      if (parsed.university  && !form.university)  set('university',  parsed.university)
      if (parsed.linkedinUrl && !form.linkedinUrl) set('linkedinUrl', parsed.linkedinUrl)
      if (parsed.notes       && !form.notes)       set('notes',       parsed.notes)
      set('source', 'linkedin')

      // Auto-find LinkedIn profile URL if not in the screenshot
      if (!parsed.linkedinFound && parsed.fullName) {
        setOcrStatus('Finding LinkedIn profile…')
        try {
          const result = await findLinkedIn(parsed.fullName, parsed.company)
          if (result?.url) {
            set('linkedinUrl', result.url)
            setOcrStatus('LinkedIn profile found ✓')
          } else {
            setOcrStatus('not_found')
          }
        } catch {
          setOcrStatus('not_found')
        }
      }
    } catch (err) {
      console.error('OCR error:', err)
      setOcrError('Could not read the image. Try a clearer screenshot.')
    } finally {
      setOcrLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    onSubmit({ ...form, lastContacted: form.lastContacted || null })
  }

  const currentFreqValue = FREQUENCIES.find(f => f.value === form.followUpFrequency)
    ? form.followUpFrequency : 'custom'

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">

      {/* Name — hero field */}
      <div>
        <input
          autoFocus
          value={form.fullName}
          onChange={e => set('fullName', e.target.value)}
          placeholder="Full name"
          className={`${field} text-base font-medium ${errors.fullName ? 'border-red-400 focus:ring-red-400' : ''}`}
        />
        {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
      </div>

      {/* Email + Phone */}
      <div className="grid grid-cols-2 gap-3">
        <input
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
          placeholder="Email"
          className={`${field} ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
        />
        <input
          type="tel"
          value={form.phone}
          onChange={e => set('phone', e.target.value)}
          placeholder="Phone"
          className={field}
        />
      </div>
      {errors.email && <p className="text-xs text-red-500 -mt-3">{errors.email}</p>}

      {/* Company + Title */}
      <div className="grid grid-cols-2 gap-3">
        <input
          value={form.company}
          onChange={e => set('company', e.target.value)}
          placeholder="Company"
          className={field}
        />
        <input
          value={form.jobTitle}
          onChange={e => set('jobTitle', e.target.value)}
          placeholder="Job title"
          className={field}
        />
      </div>

      {/* University */}
      <input
        value={form.university}
        onChange={e => set('university', e.target.value)}
        placeholder="University / School"
        className={field}
      />

      {/* Category pills */}
      <div className="flex gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => set('category', cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              form.category === cat
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}

        {/* LinkedIn scan — tucked right */}
        <div className="ml-auto flex items-center">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLinkedInScan} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={ocrLoading}
            title="Auto-fill from LinkedIn screenshot"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition disabled:opacity-50"
          >
            {ocrLoading ? <Spinner size={12} className="animate-spin" /> : <Camera size={12} />}
            {ocrLoading ? (ocrStatus ? 'Finding profile…' : 'Scanning…') : 'Scan LinkedIn'}
          </button>
        </div>
      </div>

      {/* OCR feedback */}
      {ocrLoading && (
        <div className="h-0.5 bg-blue-100 dark:bg-blue-900 rounded-full overflow-hidden -mt-3">
          <div className="h-full bg-blue-500 rounded-full animate-pulse w-3/4" />
        </div>
      )}
      {!ocrLoading && ocrStatus && !ocrError && (
        ocrStatus === 'not_found' ? (
          <p className="flex items-center gap-1.5 text-xs -mt-3 text-gray-400 dark:text-gray-500">
            Profile URL not found —
            <a
              href={linkedInSearchUrl(form.fullName, form.company)}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-blue-500 hover:text-blue-600 underline"
            >
              search LinkedIn <ExternalLink size={10} />
            </a>
            and paste the URL below
          </p>
        ) : (
          <p className={`flex items-center gap-1 text-xs -mt-3 ${ocrStatus.includes('✓') ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
            {ocrStatus}
          </p>
        )
      )}
      {ocrError && (
        <p className="flex items-center gap-1 text-xs text-red-500 -mt-3">
          <AlertCircle size={11} /> {ocrError}
        </p>
      )}

      {/* More details toggle */}
      <button
        type="button"
        onClick={() => setShowMore(s => !s)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
      >
        {showMore ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {showMore ? 'Less details' : 'More details'}
      </button>

      {/* Expanded section */}
      {showMore && (
        <div className="space-y-4 pt-1 border-t border-gray-100 dark:border-gray-800">

          {/* Relationship strength */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Relationship strength</p>
            <StarRating value={form.relationshipStrength} onChange={v => set('relationshipStrength', v)} size={18} />
          </div>

          {/* Follow-up frequency + last contacted */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Follow-up frequency</p>
              <select
                value={customFreq ? 'custom' : String(form.followUpFrequency)}
                onChange={e => handleFreqChange(e.target.value)}
                className={field}
              >
                {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            {customFreq ? (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Custom (days)</p>
                <input type="number" min="1" max="365" value={form.followUpFrequency}
                  onChange={e => set('followUpFrequency', parseInt(e.target.value) || 30)}
                  className={field} />
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Last contacted</p>
                <input type="date" value={form.lastContacted}
                  onChange={e => set('lastContacted', e.target.value)}
                  className={field} />
              </div>
            )}
          </div>

          {/* LinkedIn URL */}
          <div className="flex gap-2 items-center">
            <input
              value={form.linkedinUrl}
              onChange={e => set('linkedinUrl', e.target.value)}
              placeholder="LinkedIn URL"
              className={`${field} flex-1`}
            />
            {!form.linkedinUrl && form.fullName && (
              <a
                href={linkedInSearchUrl(form.fullName, form.company)}
                target="_blank" rel="noreferrer"
                title="Search LinkedIn"
                className="shrink-0 flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition"
              >
                <ExternalLink size={12} /> Find
              </a>
            )}
          </div>

          {/* Tags */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Tags</p>
            <TagInput value={form.tags} onChange={v => set('tags', v)} />
          </div>

          {/* Notes */}
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Notes…"
            rows={3}
            className={`${field} resize-none`}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} className="flex-1">
          {initial.id ? 'Save Changes' : 'Add Contact'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
