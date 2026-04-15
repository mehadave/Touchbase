import { useState } from 'react'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'

export default function ConferenceForm({ initial = {}, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    date: initial.date || '',
    location: initial.location || '',
    websiteUrl: initial.websiteUrl || '',
    notes: initial.notes || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <Input label="Conference Name *" value={form.name} onChange={e => set('name', e.target.value)}
        placeholder="SaaStr Annual 2025" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        <Input label="Location" value={form.location} onChange={e => set('location', e.target.value)}
          placeholder="San Francisco, CA" />
      </div>
      <Input label="Website URL" type="url" value={form.websiteUrl} onChange={e => set('websiteUrl', e.target.value)}
        placeholder="https://example.com" />
      <Input label="Notes" textarea value={form.notes} onChange={e => set('notes', e.target.value)}
        placeholder="Key takeaways, sessions to remember…" />
      <div className="flex gap-3">
        <Button type="submit" loading={loading} className="flex-1">
          {initial.id ? 'Save Changes' : 'Add Conference'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
