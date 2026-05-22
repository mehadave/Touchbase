import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle, CalendarClock, ArrowRight, UserPlus,
  TrendingUp, Clock, PartyPopper, Target,
} from 'lucide-react'
import TodayTouchbase from '../components/TodayTouchbase.jsx'
import StreakBar from '../components/streak/StreakBar.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import { DashboardSkeleton } from '../components/ui/Spinner.jsx'
import { getTodayTouchbase } from '../api/touchbase.js'
import { listContacts } from '../api/contacts.js'
import { stalenessInfo } from '../utils/contact.js'
import { format, addDays } from 'date-fns'
import { c } from '../utils/useCopy.js'
import { useSettingsStore } from '../store/useSettingsStore.js'

export default function Dashboard() {
  const tone                              = useSettingsStore(s => s.settings?.app_tone || 'millennial')
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
      setOverdue(overdueContacts.filter(c => stalenessInfo(c).status === 'overdue').slice(0, 5))

      const in7      = format(addDays(new Date(), 7), 'yyyy-MM-dd')
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

  const greetingKey = overdue.length > 2 ? 'overdueMany' : 'allGood'
  const greetingCopy = c(`greeting.${greetingKey}`, tone)

  return (
    <div className="pb-8 animate-fade-in">

      {/* ── Bento grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">

        {/* Cell: Greeting ─ 2 cols */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100
                        dark:border-gray-800 p-5 shadow-sm flex flex-col justify-between min-h-[110px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              {greetingCopy.main}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {greetingCopy.sub}
            </p>
          </div>
          <Link
            to="/contacts"
            className="mt-4 self-start inline-flex items-center gap-1.5 text-xs font-semibold
                       px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800
                       text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20
                       hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-150 cursor-pointer"
          >
            <UserPlus size={13} /> Add contact
          </Link>
        </div>

        {/* Cell: Streak ─ 2 cols */}
        <div className="lg:col-span-2">
          <StreakBar />
        </div>

        {/* Cell: Today's Touchbase ─ full width */}
        <div className="col-span-full">
          <BentoCard
            icon={<Target size={15} className="text-amber-500" />}
            title="Today's Touchbase"
            className="p-0 overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1">
              <TodayTouchbase data={touchbaseData} onRefresh={load} />
            </div>
          </BentoCard>
        </div>

        {/* Cell: Overdue ─ 2 cols */}
        <div className="md:col-span-1 lg:col-span-2">
          <BentoCard
            icon={<AlertCircle size={15} className="text-red-500" />}
            title="Overdue"
            action={
              <Link to="/contacts?overdue=true"
                className="text-xs text-amber-500 hover:text-amber-600 font-semibold
                           flex items-center gap-0.5 transition-colors cursor-pointer">
                View all <ArrowRight size={11} />
              </Link>
            }
          >
            {overdue.length === 0 ? (
              <BentoEmpty icon={<PartyPopper size={22} className="text-green-500" />}
                title="All caught up!" body="No overdue contacts right now." />
            ) : (
              <ul className="space-y-1.5">
                {overdue.map(contact => {
                  const info = stalenessInfo(contact)
                  return (
                    <li key={contact.id}>
                      <Link to="/contacts"
                        className="flex items-center gap-3 p-2.5 rounded-xl
                                   hover:bg-red-50 dark:hover:bg-red-900/10
                                   transition-colors duration-150 cursor-pointer group">
                        <Avatar name={contact.fullName} photoPath={contact.photoPath} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {contact.fullName}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{contact.company || '—'}</p>
                        </div>
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400
                                         bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-lg
                                         whitespace-nowrap shrink-0">
                          {info.label}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </BentoCard>
        </div>

        {/* Cell: Upcoming ─ 2 cols */}
        <div className="md:col-span-1 lg:col-span-2">
          <BentoCard
            icon={<CalendarClock size={15} className="text-blue-500" />}
            title="This Week"
            action={
              <Link to="/calendar"
                className="text-xs text-amber-500 hover:text-amber-600 font-semibold
                           flex items-center gap-0.5 transition-colors cursor-pointer">
                Calendar <ArrowRight size={11} />
              </Link>
            }
          >
            {upcoming.length === 0 ? (
              <BentoEmpty icon={<Clock size={22} className="text-blue-400" />}
                title="Clear week ahead" body="No follow-ups due in the next 7 days." />
            ) : (
              <ul className="space-y-1.5">
                {upcoming.map(contact => {
                  const info = stalenessInfo(contact)
                  return (
                    <li key={contact.id}>
                      <Link to="/calendar"
                        className="flex items-center gap-3 p-2.5 rounded-xl
                                   hover:bg-blue-50 dark:hover:bg-blue-900/10
                                   transition-colors duration-150 cursor-pointer group">
                        <Avatar name={contact.fullName} photoPath={contact.photoPath} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {contact.fullName}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{contact.company || '—'}</p>
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400
                                         bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-lg
                                         whitespace-nowrap shrink-0">
                          {info.label}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </BentoCard>
        </div>

      </div>
    </div>
  )
}

/* ── Bento card shell ─────────────────────────────────────────────── */
function BentoCard({ icon, title, action, children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100
                     dark:border-gray-800 shadow-sm h-full ${className}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-800/60">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

/* ── Empty state inside a bento card ─────────────────────────────── */
function BentoEmpty({ icon, title, body }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
      <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{body}</p>
      </div>
    </div>
  )
}

