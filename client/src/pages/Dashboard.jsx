import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CalendarClock, ArrowRight } from 'lucide-react'
import TodayTouchbase from '../components/TodayTouchbase.jsx'
import StreakBar from '../components/streak/StreakBar.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import { DashboardSkeleton } from '../components/ui/Spinner.jsx'
import { getTodayTouchbase } from '../api/touchbase.js'
import { listContacts } from '../api/contacts.js'
import { stalenessInfo, lastContactedLabel } from '../utils/contact.js'
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

      const in7 = format(addDays(new Date(), 7), 'yyyy-MM-dd')
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
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {format(new Date(), 'EEEE, MMMM d')} · stay close to the people who matter
        </p>
      </div>

      {/* Streak bar */}
      <StreakBar />

      {/* Today's Touchbase */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          👋 Today's Touchbase
        </h2>
        <TodayTouchbase data={touchbaseData} onRefresh={load} />
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Overdue connections */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              Overdue Connections
            </h2>
            <Link to="/contacts?overdue=true" className="text-xs text-amber-500 hover:text-amber-600 font-medium flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {overdue.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">All caught up!</p>
              <p className="text-xs text-gray-400 mt-0.5">No overdue contacts right now.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {overdue.map(contact => {
                const info = stalenessInfo(contact)
                return (
                  <div key={contact.id} className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-red-100 dark:border-red-900/30 p-3 hover:border-red-200 dark:hover:border-red-800 transition-colors">
                    <Avatar name={contact.fullName} photoPath={contact.photoPath} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{contact.fullName}</p>
                      <p className="text-xs text-gray-400 truncate">{contact.company || info.label}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-medium text-red-500 whitespace-nowrap">{info.label}</span>
                      <Link
                        to="/contacts"
                        className="text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      >
                        Reach out →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Upcoming this week */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarClock size={16} className="text-blue-500" />
              Upcoming This Week
            </h2>
            <Link to="/calendar" className="text-xs text-amber-500 hover:text-amber-600 font-medium flex items-center gap-1">
              Calendar <ArrowRight size={12} />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
              <p className="text-2xl mb-2">📅</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Clear week ahead</p>
              <p className="text-xs text-gray-400 mt-0.5">No follow-ups due in the next 7 days.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map(contact => {
                const info = stalenessInfo(contact)
                return (
                  <div key={contact.id} className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors">
                    <Avatar name={contact.fullName} photoPath={contact.photoPath} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{contact.fullName}</p>
                      <p className="text-xs text-gray-400 truncate">{contact.company || contact.jobTitle || '—'}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md whitespace-nowrap">{info.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
