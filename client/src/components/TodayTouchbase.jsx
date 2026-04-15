import { useState, useCallback } from 'react'
import { CheckCircle, SkipForward, Copy, RefreshCw, Sparkles, Phone, Mail, Link2 } from 'lucide-react'
import Avatar from './ui/Avatar.jsx'
import Button from './ui/Button.jsx'
import StarRating from './ui/StarRating.jsx'
import { CategoryBadge } from './ui/Badge.jsx'
import { useUIStore } from '../store/useUIStore.js'
import { useStreakStore } from '../store/useStreakStore.js'
import { markDone, skipTouchbase } from '../api/touchbase.js'
import { fillTemplate } from '../utils/contact.js'
import EmptyState from './ui/EmptyState.jsx'
import { Flame } from 'lucide-react'

export default function TodayTouchbase({ data, onRefresh }) {
  const { contact, template, queueId, allTemplates = [], message: serverMsg } = data || {}
  const { addToast } = useUIStore()
  const setStreak = useStreakStore(s => s.setStreak)

  const [loading, setLoading] = useState(false)
  const [templateIdx, setTemplateIdx] = useState(0)
  const [currentTemplate, setCurrentTemplate] = useState(template)
  const [done, setDone] = useState(false)

  const filledBody = currentTemplate && contact
    ? fillTemplate(currentTemplate.body, contact)
    : null

  const handleCopy = () => {
    if (!filledBody) return
    navigator.clipboard.writeText(filledBody)
    addToast('Message copied to clipboard')
  }

  const handleDone = async () => {
    if (!queueId || !contact?.id) return
    setLoading(true)
    try {
      const result = await markDone({ queueId, contactId: contact.id })
      if (result.streak) setStreak(result.streak)
      setDone(true)
      addToast(`Touchbase with ${contact.fullName} logged!`)
      setTimeout(() => { setDone(false); onRefresh?.() }, 2000)
    } catch {
      addToast('Failed to mark done', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    if (!queueId) return
    setLoading(true)
    try {
      const result = await skipTouchbase({ queueId })
      onRefresh?.()
      addToast('Skipped — showing next contact')
    } catch {
      addToast('Failed to skip', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleNextTemplate = () => {
    if (!allTemplates.length) return
    const next = (templateIdx + 1) % allTemplates.length
    setTemplateIdx(next)
    setCurrentTemplate(allTemplates[next])
  }

  if (serverMsg === 'all_done' || !contact) {
    return (
      <EmptyState
        icon="🎉"
        title="You're all caught up!"
        description="No contacts due for follow-up today. Check back tomorrow."
      />
    )
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 animate-fade-in">
        <div className="text-5xl">🔥</div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Touchbase logged!</h3>
        <p className="text-gray-500">Great job staying connected with {contact.fullName}.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
      {/* Contact header */}
      <div className="flex items-start gap-4 p-6 border-b border-gray-100 dark:border-gray-800">
        <Avatar name={contact.fullName} photoPath={contact.photoPath} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{contact.fullName}</h3>
              {(contact.company || contact.jobTitle) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {contact.jobTitle}{contact.jobTitle && contact.company ? ' · ' : ''}{contact.company}
                </p>
              )}
            </div>
            <CategoryBadge category={contact.category} />
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <StarRating value={contact.relationshipStrength} readOnly size={14} />
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-amber-500 transition-colors">
                <Mail size={12} /> {contact.email}
              </a>
            )}
            {contact.linkedinUrl && (
              <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors">
                <Link2 size={12} /> LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Template message */}
      {filledBody ? (
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Based on: <span className="text-amber-600 dark:text-amber-400">{currentTemplate?.title}</span>
              </span>
            </div>
            <button
              onClick={handleNextTemplate}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              disabled={allTemplates.length <= 1}
            >
              <RefreshCw size={12} /> Try another
            </button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed border border-gray-200 dark:border-gray-700">
            {filledBody}
          </div>

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5">
              <Copy size={14} /> Copy message
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-6 pb-4 pt-2">
          <p className="text-sm text-gray-500 italic">
            Add a template to get message suggestions here.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
        <Button onClick={handleDone} loading={loading} className="flex-1 gap-2">
          <CheckCircle size={16} /> Done for today
        </Button>
        <Button variant="outline" onClick={handleSkip} loading={loading} className="gap-2">
          <SkipForward size={16} /> Skip
        </Button>
      </div>
    </div>
  )
}
