import { useState } from 'react'
import { Upload, AlertTriangle } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { importContacts } from '../../api/contacts.js'
import { useUIStore } from '../../store/useUIStore.js'

const COLUMN_MAP = {
  fullName:  ['name', 'full name', 'full_name', 'contact name', 'contact'],
  email:     ['email', 'e-mail', 'email address'],
  phone:     ['phone', 'phone number', 'mobile', 'cell'],
  company:   ['company', 'organization', 'employer', 'org'],
  jobTitle:  ['job title', 'title', 'position', 'role', 'job_title'],
  linkedinUrl: ['linkedin', 'linkedin url', 'linkedin_url', 'linkedin profile'],
  notes:     ['notes', 'note', 'comments', 'comment'],
  tags:      ['tags', 'labels', 'keywords', 'tag'],
  category:  ['category', 'type', 'network'],
}

function mapHeaders(headers) {
  const mapping = {}
  for (const header of headers) {
    const lh = header.toLowerCase().trim()
    for (const [field, variants] of Object.entries(COLUMN_MAP)) {
      if (variants.includes(lh)) { mapping[field] = header; break }
    }
  }
  return mapping
}

function parseRow(row, mapping) {
  const get = (field) => {
    const header = mapping[field]
    return header ? (row[header] || '').trim() : ''
  }
  const tagsRaw = get('tags')
  const tags = tagsRaw ? tagsRaw.split(/[,;|]/).map(t => t.trim().toLowerCase()).filter(Boolean) : []
  return {
    fullName: get('fullName'),
    email: get('email'),
    phone: get('phone'),
    company: get('company'),
    jobTitle: get('jobTitle'),
    linkedinUrl: get('linkedinUrl'),
    notes: get('notes'),
    category: get('category') || 'Professional',
    tags,
  }
}

export default function CSVImportModal({ open, onClose, onImported }) {
  const [rows, setRows]                     = useState([])
  const [headers, setHeaders]               = useState([])
  const [mapping, setMapping]               = useState({})
  const [duplicateStrategy, setStrategy]   = useState('skip')
  const [loading, setLoading]               = useState(false)
  const [step, setStep]                     = useState('upload') // upload | preview | result
  const [result, setResult]                 = useState(null)
  const { addToast } = useUIStore()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const Papa = (await import('papaparse')).default
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta }) => {
        const hdrs = meta.fields || []
        setHeaders(hdrs)
        setMapping(mapHeaders(hdrs))
        setRows(data)
        setStep('preview')
      },
      error: () => addToast('Failed to parse CSV', 'error'),
    })
  }

  const handleImport = async () => {
    const parsed = rows.map(r => parseRow(r, mapping)).filter(r => r.fullName)
    const skipped = rows.length - parsed.length
    setLoading(true)
    try {
      const res = await importContacts({ contacts: parsed, duplicateStrategy })
      setResult({ ...res, skippedEmpty: skipped })
      setStep('result')
      onImported?.()
    } catch { addToast('Import failed', 'error') }
    finally { setLoading(false) }
  }

  const reset = () => { setRows([]); setHeaders([]); setMapping({}); setStep('upload'); setResult(null) }
  const handleClose = () => { reset(); onClose() }

  const preview = rows.slice(0, 5).map(r => parseRow(r, mapping))

  return (
    <Modal open={open} onClose={handleClose} title="Import Contacts from CSV" size="lg">
      <div className="p-6 space-y-5">
        {step === 'upload' && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload a CSV file with columns: <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">name, email, phone, company, title, tags, notes, linkedin_url</code>
            </p>
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 cursor-pointer hover:border-amber-400 transition-colors">
              <Upload size={32} className="text-gray-400" />
              <span className="text-sm text-gray-500">Click to upload or drag a CSV file here</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </label>
          </div>
        )}

        {step === 'preview' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-amber-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Found <strong>{rows.length}</strong> rows. Preview:
              </span>
            </div>

            {/* Preview table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 mb-4">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {['Name', 'Email', 'Company', 'Category', 'Tags'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-gray-600 dark:text-gray-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className={`border-t border-gray-100 dark:border-gray-800 ${!row.fullName ? 'opacity-40' : ''}`}>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100 font-medium">{row.fullName || <em>Missing</em>}</td>
                      <td className="px-3 py-2 text-gray-500">{row.email}</td>
                      <td className="px-3 py-2 text-gray-500">{row.company}</td>
                      <td className="px-3 py-2 text-gray-500">{row.category}</td>
                      <td className="px-3 py-2 text-gray-500">{row.tags.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 5 && <p className="text-xs text-gray-400 mb-4">…and {rows.length - 5} more rows</p>}

            {/* Duplicate strategy */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">If a contact with the same email already exists:</p>
              <div className="flex gap-4">
                {[['skip', 'Skip duplicate'], ['update', 'Update existing'], ['import', 'Import anyway']].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 dark:text-gray-400">
                    <input type="radio" name="strategy" value={val} checked={duplicateStrategy === val}
                      onChange={() => setStrategy(val)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleImport} loading={loading} className="flex-1">
                Import {rows.length} contacts
              </Button>
              <Button variant="outline" onClick={reset}>Back</Button>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Import Complete!</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[['Imported', result.imported, 'text-green-600'], ['Updated', result.updated, 'text-blue-600'], ['Skipped', result.skipped + (result.skippedEmpty || 0), 'text-gray-500']].map(([label, count, color]) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <div className={`text-2xl font-bold ${color}`}>{count}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>
            <Button onClick={handleClose}>Done</Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
