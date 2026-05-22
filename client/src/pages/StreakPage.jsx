import { useEffect, useRef } from 'react'
import { Flame, Trophy, Target, Calendar, Dumbbell, Star, Gem, Zap, Award } from 'lucide-react'
import WeeklyBar from '../components/streak/WeeklyBar.jsx'
import { useStreakStore } from '../store/useStreakStore.js'

const MILESTONES = [7, 14, 30, 60, 90, 180, 365]

const MILESTONE_DATA = {
  7:   { icon: Flame,    color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20',  msg: 'One week strong!' },
  14:  { icon: Dumbbell, color: 'text-blue-500',   bg: 'bg-blue-50   dark:bg-blue-900/20',    msg: "Two weeks — you're building a habit!" },
  30:  { icon: Star,     color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20',  msg: 'One month! Networking pro.' },
  60:  { icon: Trophy,   color: 'text-amber-500',  bg: 'bg-amber-50  dark:bg-amber-900/20',   msg: 'Two months of consistent touchbases!' },
  90:  { icon: Gem,      color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20',  msg: 'Three months — legendary status!' },
  180: { icon: Zap,      color: 'text-sky-500',    bg: 'bg-sky-50    dark:bg-sky-900/20',     msg: 'Half a year of staying connected!' },
  365: { icon: Award,    color: 'text-rose-500',   bg: 'bg-rose-50   dark:bg-rose-900/20',    msg: 'ONE FULL YEAR. Absolutely incredible!' },
}

async function fireConfetti() {
  const confetti = (await import('canvas-confetti')).default
  confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
  setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.4 } }), 400)
}

export default function StreakPage() {
  const { streak, fetchStreak } = useStreakStore()
  const confettiFiredRef = useRef(false)

  useEffect(() => { fetchStreak() }, [])

  useEffect(() => {
    if (!streak.currentStreak || confettiFiredRef.current) return
    if (MILESTONES.includes(streak.currentStreak)) {
      confettiFiredRef.current = true
      fireConfetti()
    }
  }, [streak.currentStreak])

  const milestoneData = MILESTONE_DATA[streak.currentStreak]
  const MilestoneIcon = milestoneData?.icon

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      {/* ── Header ───────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Streak</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your networking consistency over time</p>
      </div>

      {/* ── Milestone celebration ─────────────────── */}
      {milestoneData && (
        <div className={`flex items-center gap-4 rounded-2xl border px-5 py-4 shadow-sm
                         ${milestoneData.bg} border-current/20`}>
          <div className={`w-12 h-12 rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm shrink-0`}>
            <MilestoneIcon size={24} className={milestoneData.color} />
          </div>
          <div>
            <p className={`text-sm font-bold ${milestoneData.color}`}>{streak.currentStreak}-day milestone!</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{milestoneData.msg}</p>
          </div>
        </div>
      )}

      {/* ── Stats bento grid ─────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Flame size={20} className="text-orange-500" />}
          value={streak.currentStreak ?? 0}
          label="Current streak"
          suffix="days"
          gradient="from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10"
          border="border-orange-100 dark:border-orange-900/30"
        />
        <StatCard
          icon={<Trophy size={20} className="text-yellow-500" />}
          value={streak.longestStreak ?? 0}
          label="Longest streak"
          suffix="days"
          gradient="from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10"
          border="border-yellow-100 dark:border-yellow-900/30"
        />
        <StatCard
          icon={<Target size={20} className="text-blue-500" />}
          value={streak.total ?? 0}
          label="Total touchbases"
          suffix="total"
          gradient="from-blue-50 to-sky-50 dark:from-blue-900/10 dark:to-sky-900/10"
          border="border-blue-100 dark:border-blue-900/30"
        />
        <StatCard
          icon={<Calendar size={20} className="text-green-500" />}
          value={streak.weeklyDates?.length ?? 0}
          label="This week"
          suffix="/ 7 days"
          gradient="from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10"
          border="border-green-100 dark:border-green-900/30"
        />
      </div>

      {/* ── Weekly bar ───────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Last 7 Days</h3>
        <WeeklyBar weeklyDates={streak.weeklyDates} />
      </div>

      {/* ── Next milestone progress ───────────────── */}
      {streak.nextMilestone && streak.currentStreak < streak.nextMilestone && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy size={15} className="text-amber-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Next milestone: {streak.nextMilestone} days
              </span>
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
              {streak.nextMilestone - streak.currentStreak} to go
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min((streak.currentStreak / streak.nextMilestone) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {streak.currentStreak} / {streak.nextMilestone} days
          </p>
        </div>
      )}

      {/* ── Milestone road ───────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">Milestone Road</h3>
        <div className="space-y-3">
          {MILESTONES.map((m, idx) => {
            const reached = streak.currentStreak >= m || streak.longestStreak >= m
            const data    = MILESTONE_DATA[m]
            const Icon    = data.icon
            const isNext  = streak.nextMilestone === m

            return (
              <div
                key={m}
                className={`flex items-center gap-4 p-3 rounded-xl transition-colors
                  ${reached
                    ? `${data.bg} border border-current/10`
                    : isNext
                      ? 'bg-amber-50/50 dark:bg-amber-900/10 border border-dashed border-amber-200 dark:border-amber-800/50'
                      : 'bg-gray-50 dark:bg-gray-800/50 border border-transparent'
                  }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                  ${reached
                    ? 'bg-white dark:bg-gray-900 shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <Icon size={18} className={reached ? data.color : 'text-gray-300 dark:text-gray-600'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${reached ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                    {m} days
                  </p>
                  <p className={`text-xs truncate ${reached ? 'text-gray-500 dark:text-gray-400' : 'text-gray-300 dark:text-gray-600'}`}>
                    {data.msg}
                  </p>
                </div>
                {reached && (
                  <span className="text-xs font-bold text-white bg-green-500 px-2 py-0.5 rounded-full shrink-0">
                    Done
                  </span>
                )}
                {isNext && !reached && (
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full shrink-0">
                    Next
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, suffix, gradient, border }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl border ${border} p-5 shadow-sm`}>
      <div className="mb-3">{icon}</div>
      <div className="text-3xl font-black text-gray-900 dark:text-white leading-none">{value}</div>
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">{suffix}</div>
      <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mt-2">{label}</div>
    </div>
  )
}
