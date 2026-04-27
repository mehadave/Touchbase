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
          {format(new Date(), 'EEEE, MMMM d')} · relationships don't maintain themselves 😄
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
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-center">
              <p className="text-sm text-gray-500">No overdue contacts — you're on top of things!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {overdue.map(contact => {
                const info = stalenessInfo(contact)
                return (
                  <div key={contact.id} className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-red-100 dark:border-red-900/30 p-3">
                    <Avatar name={contact.fullName} photoPath={contact.photoPath} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{contact.fullName}</p>
                      <p className="text-xs text-red-500">{info.label}</p>
                    </div>
                    <Link
                      to={`/contacts`}
                      className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-1 rounded-lg font-medium hover:bg-red-100 transition-colors"
                    >
                      Reach out
                    </Link>
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
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-center">
              <p className="text-sm text-gray-500">Nothing due in the next 7 days.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map(contact => {
                const info = stalenessInfo(contact)
                return (
                  <div key={contact.id} className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                    <Avatar name={contact.fullName} photoPath={contact.photoPath} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{contact.fullName}</p>
                      <p className="text-xs text-gray-500">{contact.company}</p>
                    </div>
                    <span className="text-xs text-blue-500 font-medium whitespace-nowrap">{info.label}</span>
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
