import { useState, useRef } from 'react'
import Input, { Select } from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'
import StarRating from '../ui/StarRating.jsx'
import TagInput from './TagInput.jsx'
import { format } from 'date-fns'
import { Camera, Loader2 as Spinner, AlertCircle } from 'lucide-react'

const FREQUENCIES = [
  { label: 'Weekly (7 days)', value: 7 },
  { label: 'Bi-weekly (14 days)', value: 14 },
  { label: 'Monthly (30 days)', value: 30 },
  { label: 'Quarterly (90 days)', value: 90 },
  { label: 'Custom', value: 'custom' },
]

const defaults = {
  fullName: '', email: '', phone: '', company: '', jobTitle: '',
  category: 'Personal', linkedinUrl: '', notes: '',
  relationshipStrength: 3, lastContacted: '',
  followUpFrequency: 30, source: 'manual', tags: [],
}

export default function ContactForm({ initial = {}, onSubmit, onCancel, loading }) {
  const [form, setForm]         = useState({ ...defaults, ...initial,
    tags: initial.tags?.map(t => t.name || t) || [],
    lastContacted: initial.lastContacted
      ? format(new Date(initial.lastContacted), 'yyyy-MM-dd') : '',
  })
  const [customFreq, setCustomFreq] = useState(false)
  const [errors, setErrors]     = useState({})
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrError, setOcrError]     = useState('')
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
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('eng')
      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()

      // ── Helpers ────────────────────────────────────────────────────────
      // Lines of text, cleaned up
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

      // LinkedIn / app UI noise to skip
      const UI_NOISE = new Set([
        'linkedin', 'home', 'my network', 'jobs', 'messaging', 'notifications',
        'me', 'work', 'search', 'connect', 'follow', 'message', 'more',
        'connections', 'followers', 'following', 'contact info', 'about',
        'experience', 'education', 'skills', 'recommendations', 'activity',
        'see all', 'show more', 'show less', 'view profile', 'open to',
        'add section', 'premium', 'try premium', '·', '•',
      ])
      const isNoise = (l) => {
        const lower = l.toLowerCase()
        return (
          UI_NOISE.has(lower) ||
          /^[\d,+]+\s*(connection|follower|view|like|comment)/i.test(l) ||
          /^\d+\s*$/.test(l) ||                      // lone numbers
          l.length < 3 ||
          l.includes('linkedin.com/in/') ||           // URL line handled separately
          /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}/i.test(l) // date ranges
        )
      }

      const cleanLines = lines.filter(l => !isNoise(l))

      // Extended title keywords
      const TITLE_KEYWORDS = [
        'director', 'manager', 'engineer', 'developer', 'designer',
        'founder', 'ceo', 'cto', 'coo', 'cfo', 'cmo', 'cpo',
        'vp', 'vice president', 'president', 'head of', 'lead', 'leads',
        'senior', 'principal', 'staff', 'architect', 'analyst', 'associate',
        'consultant', 'officer', 'partner', 'attorney', 'lawyer', 'counsel',
        'scientist', 'researcher', 'professor', 'lecturer', 'teacher',
        'product', 'marketing', 'sales', 'operations', 'finance', 'legal',
        'coordinator', 'specialist', 'strategist', 'advisor', 'executive',
        'intern', 'apprentice', 'trainee', 'fellow', 'contractor', 'freelance',
      ]
      const looksLikeTitle = (l) =>
        TITLE_KEYWORDS.some(k => l.toLowerCase().includes(k)) && l.length < 100

      // Is a proper name: 2–4 words, each capitalised, no digits, reasonable length
      const looksLikeName = (l) => {
        if (l.length < 4 || l.length > 50) return false
        if (/\d/.test(l)) return false
        if (l.includes('@') || l.includes('http') || l.includes('|')) return false
        const words = l.split(/\s+/)
        return words.length >= 2 && words.length <= 4 &&
          words.every(w => /^[A-Z]/.test(w))
      }

      // ── LinkedIn URL ───────────────────────────────────────────────────
      const linkedinMatch = text.match(/linkedin\.com\/in\/([\w-]+)/i)
      if (linkedinMatch && !form.linkedinUrl) {
        set('linkedinUrl', 'https://linkedin.com/in/' + linkedinMatch[1])
      }

      // ── Email ──────────────────────────────────────────────────────────
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
      if (emailMatch && !form.email) set('email', emailMatch[0])

      // ── Phone — strict pattern: must start with +/( or digit groups ───
      const phoneMatch = text.match(/(\+\d[\d\s\-().]{8,15}|\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4})/)
      if (phoneMatch && !form.phone) set('phone', phoneMatch[0].trim())

      // ── Name ───────────────────────────────────────────────────────────
      // Prefer a proper-name-shaped line; fall back to first clean line
      const nameLine = cleanLines.find(looksLikeName) || cleanLines[0]
      if (nameLine && !form.fullName) set('fullName', nameLine)

      // ── Title & Company ─────────────────────────────────────────────────
      // Pattern 1: "Software Engineer at Google" (LinkedIn headline)
      const atPattern = /^(.+?)\s+at\s+(.+)$/i
      const headlineLine = cleanLines.find(l => atPattern.test(l) && looksLikeTitle(l))
      if (headlineLine) {
        const m = headlineLine.match(atPattern)
        if (m) {
          if (!form.jobTitle) set('jobTitle', m[1].trim())
          if (!form.company)  set('company',  m[2].trim())
        }
      } else {
        // Pattern 2: title and company on separate lines
        const titleLine = cleanLines.find(l => looksLikeTitle(l) && l !== nameLine)
        if (titleLine && !form.jobTitle) set('jobTitle', titleLine)

        // Company: line after the title that doesn't look like a title or location
        const titleIdx = titleLine ? cleanLines.indexOf(titleLine) : -1
        if (titleIdx >= 0) {
          const next = cleanLines.slice(titleIdx + 1).find(l =>
            l.length < 60 &&
            !looksLikeTitle(l) &&
            !l.includes('@') &&
            !/^(greater|san|new |los |new york|london|toronto|sydney|remote)/i.test(l)
          )
          if (next && !form.company) set('company', next)
        }
      }

      set('source', 'linkedin')

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
      {/* LinkedIn OCR Scanner */}
      <div className="bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30 rounded-xl p-4 border border-blue-100 dark:border-blue-900/50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <Camera size={14} /> Auto-fill from LinkedIn screenshot
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
              Upload a screenshot of any LinkedIn profile to auto-fill the form
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLinkedInScan}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={ocrLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {ocrLoading ? <><Spinner size={12} className="animate-spin" /> Scanning…</> : <><Camera size={12} /> Scan photo</>}
            </button>
          </div>
        </div>
        {ocrError && (
          <p className="flex items-center gap-1 text-xs text-red-500 mt-2">
            <AlertCircle size={11} /> {ocrError}
          </p>
        )}
        {ocrLoading && (
          <div className="mt-2">
            <div className="h-1 bg-blue-100 dark:bg-blue-900 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse w-3/4" />
            </div>
            <p className="text-xs text-blue-400 mt-1">Reading profile details…</p>
          </div>
        )}
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-1 gap-4">
        <Input label="Full Name *" value={form.fullName} onChange={e => set('fullName', e.target.value)}
          placeholder="Jane Smith" error={errors.fullName} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)}
            placeholder="jane@example.com" error={errors.email} />
          <Input label="Phone" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
            placeholder="+1 (555) 000-0000" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Company" value={form.company} onChange={e => set('company', e.target.value)}
            placeholder="Acme Inc." />
          <Input label="Job Title" value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)}
            placeholder="CEO" />
        </div>
      </div>

      {/* Category & source */}
      <div className="grid grid-cols-2 gap-4">
        <Select label="Category" value={form.category} onChange={e => set('category', e.target.value)}>
          <option>Personal</option>
          <option>Professional</option>
          <option>Social</option>
        </Select>
        <Select label="Source" value={form.source} onChange={e => set('source', e.target.value)}>
          <option value="manual">Manual</option>
          <option value="linkedin">LinkedIn</option>
          <option value="conference">Conference</option>
          <option value="csv">CSV import</option>
        </Select>
      </div>

      {/* LinkedIn URL */}
      <Input label="LinkedIn URL" value={form.linkedinUrl} onChange={e => set('linkedinUrl', e.target.value)}
        placeholder="https://linkedin.com/in/username" />

      {/* Relationship strength */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
          Relationship Strength
        </label>
        <StarRating value={form.relationshipStrength} onChange={v => set('relationshipStrength', v)} size={20} />
      </div>

      {/* Follow-up frequency */}
      <div className="grid grid-cols-2 gap-4">
        <Select label="Follow-up Frequency" value={customFreq ? 'custom' : String(form.followUpFrequency)}
          onChange={e => handleFreqChange(e.target.value)}>
          {FREQUENCIES.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </Select>
        {customFreq && (
          <Input label="Custom (days)" type="number" min="1" max="365"
            value={form.followUpFrequency}
            onChange={e => set('followUpFrequency', parseInt(e.target.value) || 30)} />
        )}
        <Input label="Last Contacted" type="date" value={form.lastContacted}
          onChange={e => set('lastContacted', e.target.value)} />
      </div>

      {/* Tags */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Tags</label>
        <TagInput value={form.tags} onChange={v => set('tags', v)} />
      </div>

      {/* Notes */}
      <Input label="Notes" textarea value={form.notes} onChange={e => set('notes', e.target.value)}
        placeholder="Add any notes about this contact…" className="min-h-28" />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {initial.id ? 'Save Changes' : 'Add Contact'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
