import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, Eye } from 'lucide-react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameDay, isSameMonth,
  addMonths, subMonths, isToday, parseISO,
} from 'date-fns'
import { listContacts } from '../api/contacts.js'
import { PageSpinner } from '../components/ui/Spinner.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import ContactDetail from '../components/contacts/ContactDetail.jsx'
import Button from '../components/ui/Button.jsx'
import { markDone } from '../api/touchbase.js'
import { useUIStore } from '../store/useUIStore.js'
import { updateContact } from '../api/contacts.js'

const DOT_COLORS = {
  Personal:     'bg-purple-500',
  Professional: 'bg-blue-500',
  Social:       'bg-green-500',
}

const STATUS_DOT = {
  overdue: 'bg-red-500',
  soon:    'bg-amber-400',
  ok:      'bg-green-500',
}

function getDotStatus(contact, dayStr) {
  if (!contact.nextFollowUp) return 'ok'
  if (contact.nextFollowUp < dayStr) return 'overdue'
  if (contact.nextFollowUp === dayStr) return 'soon'
  return 'ok'
}

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [contacts, setContacts]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [selectedDay, setSelectedDay]   = useState(null)
  const [selectedContact, setSelectedContact] = useState(null)
  const [showDetail, setShowDetail]     = useState(false)
  const { addToast } = useUIStore()

  useEffect(() => {
    listContacts({ limit: 500 }).then(d => { setContacts(d); setLoading(false) })
  }, [])

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 })
    const end   = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Map date string -> contacts due that day
  const contactsByDay = useMemo(() => {
    const map = {}
    for (const c of contacts) {
      if (!c.nextFollowUp) continue
      if (!map[c.nextFollowUp]) map[c.nextFollowUp] = []
      map[c.nextFollowUp].push(c)
    }
    return map
  }, [contacts])

  const selectedDayStr = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null
  const selectedDayContacts = selectedDayStr ? (contactsByDay[selectedDayStr] || []) : []

  const handleMarkDone = async (contact) => {
    try {
      // Use updateContact to advance the follow-up date
      const freq = contact.followUpFrequency || 30
      const next = format(addMonths(new Date(), 1), 'yyyy-MM-dd') // simplified
      await updateContact(contact.id, { lastContacted: new Date().toISOString() })
      const updated = contacts.map(c => c.id === contact.id
        ? { ...c, lastContacted: new Date().toISOString() }
        : c
      )
      setContacts(updated)
      addToast(`Marked ${contact.fullName} as contacted`)
    } catch { addToast('Failed', 'error') }
  }

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your follow-up schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="text-base font-semibold text-gray-900 dark:text-white w-36 text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Calendar grid */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const dayStr    = format(day, 'yyyy-MM-dd')
                const inMonth   = isSameMonth(day, currentMonth)
                const today     = isToday(day)
                const isSelected = selectedDay && isSameDay(day, selectedDay)
                const dayContacts = contactsByDay[dayStr] || []
                const shown    = dayContacts.slice(0, 3)
                const overflow = dayContacts.length - 3

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDay(isSameDay(day, selectedDay) ? null : day)}
                    className={`
                      min-h-20 p-1.5 border-b border-r border-gray-100 dark:border-gray-800 cursor-pointer
                      transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/10
                      ${isSelected ? 'bg-amber-50 dark:bg-amber-900/10' : ''}
                      ${i % 7 === 6 ? 'border-r-0' : ''}
                    `}
                  >
                    <div className={`
                      w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1 mx-auto
                      ${today ? 'bg-amber-500 text-white font-bold' : ''}
                      ${!inMonth ? 'text-gray-300 dark:text-gray-700' : 'text-gray-900 dark:text-gray-100 font-medium'}
                    `}>
                      {format(day, 'd')}
                    </div>

                    {/* Contact dots */}
                    <div className="space-y-0.5">
                      {shown.map(c => (
                        <div key={c.id} className="flex items-center gap-1 text-xs truncate">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT_COLORS[c.category] || 'bg-gray-400'}`} />
                          <span className={`truncate ${inMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'} text-[10px]`}>
                            {c.fullName.split(' ')[0]}
                          </span>
                        </div>
                      ))}
                      {overflow > 0 && (
                        <p className="text-[10px] text-gray-400">+{overflow} more</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {[['Personal', 'bg-purple-500'], ['Professional', 'bg-blue-500'], ['Social', 'bg-green-500']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                {label}
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Today
            </div>
          </div>
        </div>

        {/* Day detail sidebar */}
        {selectedDay && (
          <div className="w-72 flex-shrink-0 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                {format(selectedDay, 'EEEE, MMM d')}
              </h3>

              {selectedDayContacts.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No follow-ups scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayContacts.map(c => (
                    <div key={c.id} className="flex items-center gap-3 group">
                      <Avatar name={c.fullName} photoPath={c.photoPath} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{c.company}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleMarkDone(c)}
                          className="p-1 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500 transition-colors"
                          title="Mark as contacted">
                          <CheckCircle size={14} />
                        </button>
                        <button onClick={() => { setSelectedContact(c); setShowDetail(true) }}
                          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                          title="View profile">
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ContactDetail contact={selectedContact} open={showDetail} onClose={() => setShowDetail(false)} />
    </div>
  )
}
