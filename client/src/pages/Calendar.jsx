import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, User, X } from 'lucide-react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameDay, isSameMonth,
  addMonths, subMonths, isToday,
} from 'date-fns'
import { listContacts } from '../api/contacts.js'
import { PageSpinner } from '../components/ui/Spinner.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import ContactDetail from '../components/contacts/ContactDetail.jsx'
import { useUIStore } from '../store/useUIStore.js'
import { updateContact } from '../api/contacts.js'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORY_COLOR = {
  Personal:     { dot: 'bg-purple-500', pill: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' },
  Professional: { dot: 'bg-blue-500',   pill: 'bg-blue-100   dark:bg-blue-900/40   text-blue-700   dark:text-blue-300'   },
  Social:       { dot: 'bg-green-500',  pill: 'bg-green-100  dark:bg-green-900/40  text-green-700  dark:text-green-300'  },
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
    listContacts({ limit: 500 })
      .then(d => setContacts(d))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false))
  }, [])

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 })
    const end   = endOfWeek(endOfMonth(currentMonth),   { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const contactsByDay = useMemo(() => {
    const map = {}
    for (const c of contacts) {
      if (!c.nextFollowUp) continue
      if (!map[c.nextFollowUp]) map[c.nextFollowUp] = []
      map[c.nextFollowUp].push(c)
    }
    return map
  }, [contacts])

  const selectedDayStr      = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null
  const selectedDayContacts = selectedDayStr ? (contactsByDay[selectedDayStr] || []) : []

  const handleMarkDone = async (contact) => {
    try {
      await updateContact(contact.id, { lastContacted: new Date().toISOString() })
      setContacts(prev => prev.map(c =>
        c.id === contact.id ? { ...c, lastContacted: new Date().toISOString() } : c
      ))
      addToast(`Marked ${contact.fullName} as contacted`)
    } catch {
      addToast('Failed to update', 'error')
    }
  }

  const handleDayClick = (day) => {
    setSelectedDay(prev => (prev && isSameDay(prev, day)) ? null : day)
  }

  const prevMonth = () => { setCurrentMonth(m => subMonths(m, 1)); setSelectedDay(null) }
  const nextMonth = () => { setCurrentMonth(m => addMonths(m, 1)); setSelectedDay(null) }
  const goToToday = () => { setCurrentMonth(new Date()); setSelectedDay(new Date()) }

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your follow-up schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700
                       text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
                       transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500
                         dark:text-gray-400 transition-colors cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-white w-32 text-center select-none">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500
                         dark:text-gray-400 transition-colors cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Calendar grid ────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="py-3 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayStr     = format(day, 'yyyy-MM-dd')
            const inMonth    = isSameMonth(day, currentMonth)
            const todayFlag  = isToday(day)
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            const dayCons    = contactsByDay[dayStr] || []
            const dotCons    = dayCons.slice(0, 3)
            const hasMore    = dayCons.length > 3

            return (
              <button
                key={i}
                onClick={() => handleDayClick(day)}
                className={`
                  relative flex flex-col items-center pt-2 pb-2 gap-1
                  border-b border-r border-gray-100 dark:border-gray-800
                  min-h-[64px] sm:min-h-[80px]
                  transition-colors duration-150 cursor-pointer
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset
                  ${i % 7 === 6 ? 'border-r-0' : ''}
                  ${isSelected
                    ? 'bg-amber-50 dark:bg-amber-900/15'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                  }
                  ${!inMonth ? 'opacity-30' : ''}
                `}
              >
                {/* Date number */}
                <span className={`
                  w-7 h-7 flex items-center justify-center rounded-full text-sm leading-none
                  ${todayFlag
                    ? 'bg-amber-500 text-white font-bold shadow-sm shadow-amber-500/40'
                    : isSelected
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold'
                      : 'text-gray-700 dark:text-gray-200 font-medium'
                  }
                `}>
                  {format(day, 'd')}
                </span>

                {/* Dots */}
                {dotCons.length > 0 && (
                  <div className="flex items-center gap-0.5 flex-wrap justify-center">
                    {dotCons.map(c => (
                      <span
                        key={c.id}
                        className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLOR[c.category]?.dot || 'bg-gray-400'}`}
                      />
                    ))}
                    {hasMore && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────── */}
      <div className="flex items-center gap-5 flex-wrap px-1">
        {Object.entries(CATEGORY_COLOR).map(([label, { dot }]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Today</span>
        </div>
      </div>

      {/* ── Day detail panel (below calendar) ────────────── */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            key={selectedDayStr}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">

              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {format(selectedDay, 'EEEE, MMMM d')}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedDayContacts.length === 0
                      ? 'No follow-ups scheduled'
                      : `${selectedDayContacts.length} follow-up${selectedDayContacts.length > 1 ? 's' : ''} due`
                    }
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                             hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Contact list */}
              {selectedDayContacts.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📅</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Free day!</p>
                  <p className="text-xs text-gray-400 mt-1">No contacts due on this date.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {selectedDayContacts.map(c => {
                    const colors = CATEGORY_COLOR[c.category] || { dot: 'bg-gray-400', pill: 'bg-gray-100 text-gray-600' }
                    return (
                      <li key={c.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <Avatar name={c.fullName} photoPath={c.photoPath} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.fullName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {c.company && (
                              <span className="text-xs text-gray-400 truncate">{c.company}</span>
                            )}
                            {c.category && (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${colors.pill}`}>
                                {c.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleMarkDone(c)}
                            title="Mark as contacted"
                            className="p-2 rounded-xl text-gray-400 hover:text-green-600 dark:hover:text-green-400
                                       hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors cursor-pointer"
                          >
                            <CheckCircle size={17} />
                          </button>
                          <button
                            onClick={() => { setSelectedContact(c); setShowDetail(true) }}
                            title="View profile"
                            className="p-2 rounded-xl text-gray-400 hover:text-amber-600 dark:hover:text-amber-400
                                       hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer"
                          >
                            <User size={17} />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ContactDetail
        contact={selectedContact}
        open={showDetail}
        onClose={() => setShowDetail(false)}
      />
    </div>
  )
}
