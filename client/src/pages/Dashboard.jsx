import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CalendarClock, ArrowRight, Zap } from 'lucide-react'
import TodayTouchbase from '../components/TodayTouchbase.jsx'
import StreakBar from '../components/streak/StreakBar.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import { DashboardSkeleton } from '../components/ui/Spinner.jsx'
import { getTodayTouchbase } from '../api/touchbase.js'
import { listContacts } from '../api/contacts.js'
import { stalenessInfo } from '../utils/contact.js'
import { format, addDays } from 'date-fns'

export default function Dashboard() {
  const [touchbaseData, setTouchbaseData] = useState(null)
  const [overdue, setOverdue]             = useState([])
  const [upcoming, setUpcoming]           = useState([])
  const [loading, setLoading]             = useState(true)

  const load = async () => {
    try {
      const [tb, overdueContacts, allContacts] = await Promise.all([
        getTodayTouchbase(),
        listContacts({ overdue: true, sort: 'next_follow_up', limit: 5 }),
        listContacts({ sort: 'next_follow_up', limit: 50 }),
      ])
      setTouchbaseData(tb)
      setOverdue(overdueContacts.filter(c => {
        const info = stalenessInfo(c)
        return info.status === 'overdue'
      }).slice(0, 5))

      const in7     = format(addDays(new Date(), 7), 'yyyy-MM-dd')
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      setUpcoming(allContacts.filter(c =>
        c.nextFollowUp && c.nextFollowUp > todayStr && c.nextFollowUp <= in7
      ).slice(0, 5))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <DashboardSkeleton />

  return (
    <div className="space-y-8 pb-8">

      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Good {getGreeting()}&nbsp;👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>
        <Link
          to="/contacts"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold
                     px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600
                     text-white shadow-sm shadow-amber-500/30 transition-all active:scale-[0.97]"
        >
          <Zap size={13} /> Add contact
        </Link>
      </div>

      {/* ── Streak ───────────────────────────────────────── */}
      <StreakBar />

      {/* ── Today's Touchbase ────────────────────────────── */}
      <section>
        <SectionHeader title="Today's Touchbase" emoji="🎯" />
        <TodayTouchbase data={touchbaseData} onRefresh={load} />
      </section>

      {/* ── Two-column grid ──────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Overdue */}
        <section>
          <SectionHeader
            title="Overdue"
            emoji={null}
            icon={<AlertCircle size={15} className="text-red-500" />}
            action={<Link to="/contacts?overdue=true" className="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-0.5 transition-colors">View all <ArrowRight size={11} /></Link>}
          />
          {overdue.length === 0 ? (
            <EmptyState emoji="🎉" title="All caught up!" body="No overdue contacts right now." />
          ) : (
            <ul className="space-y-2">
              {overdue.map(contact => {
                const info = stalenessInfo(contact)
                return (
                  <li key={contact.id}>
                    <Link
                      to="/contacts"
                      className="flex items-center gap-3 bg-white dark:bg-gray-900
                                 rounded-xl border border-red-100 dark:border-red-900/30
                                 hover:border-red-300 dark:hover:border-red-700/50
                                 p-3 transition-all group"
                    >
                      <Avatar name={contact.fullName} photoPath={contact.photoPath} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{contact.fullName}</p>
                        <p className="text-xs text-gray-400 truncate">{contact.company || info.label}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg whitespace-nowrap shrink-0">
                        {info.label}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Upcoming */}
        <section>
          <SectionHeader
            title="This Week"
            emoji={null}
            icon={<CalendarClock size={15} className="text-blue-500" />}
            action={<Link to="/calendar" className="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-0.5 transition-colors">Calendar <ArrowRight size={11} /></Link>}
          />
          {upcoming.length === 0 ? (
            <EmptyState emoji="📅" title="Clear week ahead" body="No follow-ups due in the next 7 days." />
          ) : (
            <ul className="space-y-2">
              {upcoming.map(contact => {
                const info = stalenessInfo(contact)
                return (
                  <li key={contact.id}>
                    <Link
                      to="/calendar"
                      className="flex items-center gap-3 bg-white dark:bg-gray-900
                                 rounded-xl border border-gray-200 dark:border-gray-800
                                 hover:border-blue-200 dark:hover:border-blue-800/50
                                 p-3 transition-all group"
                    >
                      <Avatar name={contact.fullName} photoPath={contact.photoPath} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{contact.fullName}</p>
                        <p className="text-xs text-gray-400 truncate">{contact.company || contact.jobTitle || '—'}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg whitespace-nowrap shrink-0">
                        {info.label}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

/* ── Small helpers ─────────────────────────────────────────── */

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function SectionHeader({ title, emoji, icon, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
        {emoji && <span>{emoji}</span>}
        {icon}
        {title}
      </h2>
      {action}
    </div>
  )
}

function EmptyState({ emoji, title, body }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed
                    border-gray-200 dark:border-gray-700 p-8 text-center">
      <span className="text-3xl block mb-2">{emoji}</span>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{body}</p>
    </div>
  )
}
