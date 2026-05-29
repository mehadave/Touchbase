import { useState, useRef, useCallback, useEffect } from 'react'
import { X, ScanLine, CheckCircle2, AlertCircle, Loader2, ImagePlus, Trash2, Tag } from 'lucide-react'
import Button from '../ui/Button.jsx'
import { parseLinkedInOCR } from '../../utils/ocrParse.js'
import { findLinkedIn, createContact } from '../../api/contacts.js'
import { listConferences, createConference } from '../../api/conferences.js'

const field = 'w-full px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

// Maximum number of Tesseract workers alive at one time.
// 2 is safe on mobile (each worker ~10-15 MB WASM). Increase on desktop if needed.
const WORKER_POOL_SIZE = 2

export default function BulkScanModal({ open, onClose, onImported }) {
  const [phase, setPhase]             = useState('pick')  // pick | scan | review | importing
  const [contacts, setContacts]       = useState([])
  const [conferences, setConferences] = useState([])
  const [conferenceId, setConferenceId]   = useState('')
  const [newConfName, setNewConfName]     = useState('')
  const [sharedTags, setSharedTags]       = useState('')
  const [importResults, setImportResults] = useState({})

  // Queue state — kept in refs so the async scanner loop can always see current values
  const queueRef      = useRef([])   // array of { id, file } waiting to be scanned
  const workersRef    = useRef([])   // active Tesseract worker instances
  const abortRef      = useRef(false) // set true when modal closes mid-scan
  const fileInputRef  = useRef(null)
  const dropRef       = useRef(null)

  useEffect(() => {
    if (open) {
      abortRef.current = false
      listConferences().then(setConferences).catch(() => {})
    }
  }, [open])

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback((contactsToClean) => {
    abortRef.current = true
    // Terminate any live workers
    workersRef.current.forEach(w => { try { w.terminate() } catch {} })
    workersRef.current = []
    queueRef.current = []
    // Release object URLs
    contactsToClean.forEach(c => { try { URL.revokeObjectURL(c.previewUrl) } catch {} })
  }, [])

  const reset = useCallback(() => {
    setPhase('pick')
    setContacts(prev => { cleanup(prev); return [] })
    setConferenceId('')
    setNewConfName('')
    setSharedTags('')
    setImportResults({})
  }, [cleanup])

  const handleClose = () => { reset(); onClose() }

  // ── Worker pool scanner ────────────────────────────────────────────────────
  // Each "lane" pulls from queueRef and processes one image at a time.
  const runLane = useCallback(async (worker) => {
    while (true) {
      if (abortRef.current) return
      const job = queueRef.current.shift()
      if (!job) return  // queue empty — lane is done

      setContacts(prev => prev.map(c => c.id === job.id ? { ...c, status: 'scanning' } : c))

      try {
        const { data: { text } } = await worker.recognize(job.file)
        if (abortRef.current) return

        const parsed = parseLinkedInOCR(text)

        // LinkedIn URL lookup (non-fatal)
        if (!parsed.linkedinFound && parsed.fullName) {
          try {
            const result = await findLinkedIn(parsed.fullName, parsed.company)
            if (result?.url) parsed.linkedinUrl = result.url
          } catch { /* ignore */ }
        }

        if (abortRef.current) return
        setContacts(prev => prev.map(c => c.id === job.id ? { ...c, status: 'done', parsed } : c))
      } catch {
        if (abortRef.current) return
        setContacts(prev => prev.map(c => c.id === job.id ? { ...c, status: 'error' } : c))
      }
    }
  }, [])

  // Start the worker pool for a batch of new entries
  const startPool = useCallback(async (entries) => {
    const { createWorker } = await import('tesseract.js')

    // Spin up min(POOL_SIZE, entries.length) workers
    const poolSize = Math.min(WORKER_POOL_SIZE, entries.length)
    const workers  = await Promise.all(
      Array.from({ length: poolSize }, () => createWorker('eng'))
    )
    if (abortRef.current) {
      workers.forEach(w => { try { w.terminate() } catch {} })
      return
    }
    workersRef.current = workers

    // Run all lanes concurrently; when they all drain, terminate workers
    await Promise.allSettled(workers.map(w => runLane(w)))

    workers.forEach(w => { try { w.terminate() } catch {} })
    workersRef.current = []
  }, [runLane])

  // ── File selection ─────────────────────────────────────────────────────────
  const addFiles = useCallback((files) => {
    const images = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!images.length) return

    const entries = images.map(f => ({
      id:         Math.random().toString(36).slice(2),
      file:       f,
      previewUrl: URL.createObjectURL(f),
      status:     'pending',
      parsed:     null,
      override:   {},
    }))

    // Push jobs onto the shared queue
    entries.forEach(e => queueRef.current.push({ id: e.id, file: e.file }))

    setContacts(prev => [...prev, ...entries])
    setPhase('scan')

    // Start the pool — if workers are already running from a previous batch
    // they'll naturally drain the new queue items. Only start a new pool when
    // there are no active workers.
    if (workersRef.current.length === 0) {
      startPool(entries)
    }
  }, [startPool])

  const handleDrop = (e) => {
    e.preventDefault()
    addFiles(e.dataTransfer.files)
  }

  const removeContact = (id) => {
    setContacts(prev => {
      const c = prev.find(p => p.id === id)
      if (c) { try { URL.revokeObjectURL(c.previewUrl) } catch {} }
      // Also remove from queue if still pending
      queueRef.current = queueRef.current.filter(q => q.id !== id)
      const updated = prev.filter(p => p.id !== id)
      if (updated.length === 0) setPhase('pick')
      return updated
    })
  }

  const setOverride = (id, key, val) =>
    setContacts(prev => prev.map(c =>
      c.id === id ? { ...c, override: { ...c.override, [key]: val } } : c
    ))

  // Switch to review once everything has settled
  const allDone = contacts.length > 0 && contacts.every(c => c.status === 'done' || c.status === 'error')
  useEffect(() => {
    if (allDone && phase === 'scan') setPhase('review')
  }, [allDone, phase])

  const doneCount     = contacts.filter(c => c.status === 'done').length
  const scanningCount = contacts.filter(c => c.status === 'scanning' || c.status === 'pending').length
  const scannedSoFar  = contacts.filter(c => c.status === 'done' || c.status === 'error').length

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    setPhase('importing')

    let resolvedConferenceId = conferenceId === '__new__' ? null : (conferenceId || null)
    if (conferenceId === '__new__' && newConfName.trim()) {
      try {
        const conf = await createConference({ name: newConfName.trim() })
        resolvedConferenceId = conf.id
        setConferences(prev => [...prev, conf])
      } catch { /* skip */ }
    }

    const tagList = sharedTags.split(',').map(t => t.trim()).filter(Boolean)
    const results = {}

    await Promise.allSettled(
      contacts
        .filter(c => c.status === 'done')
        .map(async (c) => {
          const p = c.parsed
          const data = {
            fullName:    (c.override.fullName    ?? p.fullName)    || 'Unknown',
            jobTitle:    c.override.jobTitle     ?? p.jobTitle,
            company:     c.override.company      ?? p.company,
            email:       c.override.email        ?? p.email,
            phone:       c.override.phone        ?? p.phone,
            linkedinUrl: c.override.linkedinUrl  ?? p.linkedinUrl,
            notes:       c.override.notes        ?? p.notes,
            category:    'Professional',
            source:      'linkedin',
            followUpFrequency: 30,
            tags:        tagList,
            conferenceId: resolvedConferenceId,
          }
          try {
            await createContact(data)
            results[c.id] = 'ok'
          } catch {
            results[c.id] = 'error'
          }
        })
    )

    setImportResults(results)
    const saved  = Object.values(results).filter(v => v === 'ok').length
    const failed = Object.values(results).filter(v => v === 'error').length
    onImported(saved, failed)
    handleClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <ScanLine size={18} className="text-amber-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Bulk Scan LinkedIn Screenshots</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── PICK phase ── */}
          {phase === 'pick' && (
            <div
              ref={dropRef}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              className="m-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 flex flex-col items-center gap-4 text-center cursor-pointer hover:border-amber-400 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus size={36} className="text-gray-300 dark:text-gray-600" />
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Drop screenshots here or click to select</p>
                <p className="text-sm text-gray-400 mt-1">Select multiple LinkedIn profile screenshots at once</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => addFiles(e.target.files)}
              />
            </div>
          )}

          {/* ── SCAN / REVIEW / IMPORTING phases ── */}
          {(phase === 'scan' || phase === 'review' || phase === 'importing') && (
            <div className="p-6 space-y-4">

              {/* Progress bar (scan phase only) */}
              {phase === 'scan' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Loader2 size={13} className="animate-spin text-amber-500" />
                      Scanning {scanningCount} remaining…
                    </span>
                    <span className="text-gray-400 tabular-nums">{scannedSoFar} / {contacts.length}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${contacts.length ? (scannedSoFar / contacts.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Conference + tags panel (review / importing) */}
              {(phase === 'review' || phase === 'importing') && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    Apply to all {doneCount} contacts
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Conference</label>
                      <select
                        value={conferenceId}
                        onChange={e => { setConferenceId(e.target.value); if (e.target.value !== '__new__') setNewConfName('') }}
                        className={field}
                      >
                        <option value="">— none —</option>
                        <option value="__new__">+ Create new…</option>
                        {conferences.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <Tag size={11} className="inline mr-1" />Tags (comma-separated)
                      </label>
                      <input
                        value={sharedTags}
                        onChange={e => setSharedTags(e.target.value)}
                        placeholder="e.g. nfcon2025, investor"
                        className={field}
                      />
                    </div>
                  </div>
                  {conferenceId === '__new__' && (
                    <input
                      autoFocus
                      value={newConfName}
                      onChange={e => setNewConfName(e.target.value)}
                      placeholder="New conference name…"
                      className={field}
                    />
                  )}
                </div>
              )}

              {/* Contact cards */}
              <div className="space-y-2">
                {contacts.map(c => (
                  <div
                    key={c.id}
                    className={`rounded-xl border p-3 flex gap-3 transition ${
                      c.status === 'error'
                        ? 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20'
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img src={c.previewUrl} alt="" className="w-full h-full object-cover object-top" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {(c.status === 'pending' || c.status === 'scanning') && (
                        <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                          <Loader2 size={13} className="animate-spin" />
                          {c.status === 'pending' ? 'Queued…' : 'Scanning…'}
                        </div>
                      )}
                      {c.status === 'error' && (
                        <div className="flex items-center gap-2 text-sm text-red-500 py-2">
                          <AlertCircle size={13} /> Could not read this image
                        </div>
                      )}
                      {c.status === 'done' && (
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            value={c.override.fullName  ?? c.parsed.fullName}
                            onChange={e => setOverride(c.id, 'fullName', e.target.value)}
                            placeholder="Full name"
                            className={`${field} text-xs py-1`}
                          />
                          <input
                            value={c.override.company ?? c.parsed.company}
                            onChange={e => setOverride(c.id, 'company', e.target.value)}
                            placeholder="Company"
                            className={`${field} text-xs py-1`}
                          />
                          <input
                            value={c.override.jobTitle ?? c.parsed.jobTitle}
                            onChange={e => setOverride(c.id, 'jobTitle', e.target.value)}
                            placeholder="Job title"
                            className={`${field} text-xs py-1`}
                          />
                          <input
                            value={c.override.linkedinUrl ?? c.parsed.linkedinUrl}
                            onChange={e => setOverride(c.id, 'linkedinUrl', e.target.value)}
                            placeholder="LinkedIn URL"
                            className={`${field} text-xs py-1`}
                          />
                        </div>
                      )}
                    </div>

                    {/* Status icon + remove */}
                    <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
                      {importResults[c.id] === 'ok'    && <CheckCircle2 size={15} className="text-green-500" />}
                      {importResults[c.id] === 'error' && <AlertCircle  size={15} className="text-red-500" />}
                      {phase !== 'importing' && (
                        <button
                          onClick={() => removeContact(c.id)}
                          className="text-gray-300 hover:text-red-400 transition mt-auto"
                          title="Remove"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add more (review phase) */}
              {phase === 'review' && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 text-sm text-gray-400 hover:text-amber-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl transition"
                >
                  + Add more screenshots
                </button>
              )}

              {/* Hidden file input shared across phases */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => addFiles(e.target.files)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {(phase === 'review' || phase === 'importing') && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
            <p className="text-sm text-gray-400">
              {doneCount} contact{doneCount !== 1 ? 's' : ''} ready to import
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClose} disabled={phase === 'importing'}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                loading={phase === 'importing'}
                disabled={doneCount === 0}
              >
                Import {doneCount} Contact{doneCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
