import { useEffect, useState } from 'react'
import { Plus, Edit3, Trash2, Copy } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import Button from '../components/ui/Button.jsx'
import Input, { Select } from '../components/ui/Input.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { TemplateCardSkeleton } from '../components/ui/Spinner.jsx'
import { useConfirm } from '../hooks/useConfirm.jsx'
import { listTemplates, createTemplate, updateTemplate, deleteTemplate } from '../api/templates.js'
import { useUIStore } from '../store/useUIStore.js'

const CATEGORY_TAGS = ['Personal', 'Professional', 'Social', 'Conference', 'LinkedIn', 'General', 'Reconnect', 'Cold Outreach', 'Congrats', 'Follow Up']

// Highlight {placeholder} tokens in template body
function HighlightedBody({ body }) {
  const parts = body.split(/(\{[^}]+\})/g)
  return (
    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) =>
        /^\{[^}]+\}$/.test(part)
          ? <mark key={i} className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-0.5 rounded not-italic">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </p>
  )
}

function TemplateEditor({ initial = {}, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    title: initial.title || '',
    body: initial.body || '',
    categoryTag: initial.categoryTag || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); if (form.title && form.body) onSave(form) }} className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Template Name *" value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="Reconnect" />
        <Select label="Category" value={form.categoryTag} onChange={e => set('categoryTag', e.target.value)}>
          <option value="">No category</option>
          {CATEGORY_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
      </div>
      <div>
        <Input label="Message Body *" textarea value={form.body}
          onChange={e => set('body', e.target.value)}
          placeholder="Hey {name}, I wanted to reach out…"
          className="min-h-40 font-mono text-xs" />
        <p className="text-xs text-gray-400 mt-1">
          Use <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{name}'}</code>,{' '}
          <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{company}'}</code>,{' '}
          <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{title}'}</code> as placeholders
        </p>
      </div>

      {/* Live preview */}
      {form.body && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Preview</p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <HighlightedBody body={form.body} />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={loading} className="flex-1">
          {initial.id ? 'Save Changes' : 'Create Template'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showAdd, setShowAdd]     = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const { addToast } = useUIStore()
  const { confirm, ConfirmDialog } = useConfirm()

  const load = () => listTemplates()
    .then(d => setTemplates(d))
    .catch(() => setTemplates([]))
    .finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleCreate = async (data) => {
    setSaveLoading(true)
    try {
      const t = await createTemplate(data)
      setTemplates(prev => [t, ...prev])
      setShowAdd(false)
      addToast('Template created')
    } catch { addToast('Failed', 'error') }
    finally { setSaveLoading(false) }
  }

  const handleEdit = async (data) => {
    setSaveLoading(true)
    try {
      const t = await updateTemplate(editTarget.id, data)
      setTemplates(prev => prev.map(x => x.id === t.id ? t : x))
      setEditTarget(null)
      addToast('Template saved')
    } catch { addToast('Failed', 'error') }
    finally { setSaveLoading(false) }
  }

  const handleDelete = async (id, title) => {
    const ok = await confirm({ title: `Delete "${title}"?`, message: 'This template will be permanently removed.' })
    if (!ok) return
    await deleteTemplate(id)
    setTemplates(prev => prev.filter(t => t.id !== id))
    addToast('Template deleted')
  }

  const handleCopy = (body) => {
    navigator.clipboard.writeText(body)
    addToast('Template body copied')
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Templates</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Saved message templates for quick outreach</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <TemplateCardSkeleton key={i} />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Templates</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Saved message templates for quick outreach</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon="✉️"
          title="No templates yet"
          description="Create message templates to speed up your outreach. Use {name}, {company}, and {title} to personalise automatically."
          action={<Button onClick={() => setShowAdd(true)}><Plus size={14} /> Create your first template</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="flex items-start justify-between px-5 pt-5 pb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t.title}</h3>
                  {t.categoryTag && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full font-medium">
                      {t.categoryTag}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleCopy(t.body)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-amber-500 transition-colors">
                    <Copy size={14} />
                  </button>
                  <button onClick={() => setEditTarget(t)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-500 transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDelete(t.id, t.title)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="px-5 pb-5 max-h-40 overflow-hidden relative">
                <HighlightedBody body={t.body} />
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-900 to-transparent" />
              </div>
              {t.useCount > 0 && (
                <div className="px-5 py-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
                  Used {t.useCount} time{t.useCount !== 1 ? 's' : ''}
                  {t.lastUsedAt && ` · Last: ${new Date(t.lastUsedAt).toLocaleDateString()}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add template modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Template" size="lg">
        <TemplateEditor onSave={handleCreate} onCancel={() => setShowAdd(false)} loading={saveLoading} />
      </Modal>

      {/* Edit template modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Template" size="lg">
        <TemplateEditor initial={editTarget || {}} onSave={handleEdit} onCancel={() => setEditTarget(null)} loading={saveLoading} />
      </Modal>

      <ConfirmDialog />
    </div>
  )
}
