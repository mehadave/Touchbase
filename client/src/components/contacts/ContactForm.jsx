import { useState } from 'react'
import Input, { Select } from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'
import StarRating from '../ui/StarRating.jsx'
import TagInput from './TagInput.jsx'
import { format } from 'date-fns'

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
