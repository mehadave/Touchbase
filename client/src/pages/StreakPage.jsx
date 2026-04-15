import { useEffect, useRef } from 'react'
import { Flame, Trophy, Target, Calendar } from 'lucide-react'
import WeeklyBar from '../components/streak/WeeklyBar.jsx'
import { useStreakStore } from '../store/useStreakStore.js'
import { PageSpinner } from '../components/ui/Spinner.jsx'

const MILESTONES = [7, 14, 30, 60, 90, 180, 365]

const MILESTONE_MESSAGES = {
  7:   { emoji: '🔥', msg: 'One week strong!' },
  14:  { emoji: '💪', msg: 'Two weeks — you\'re building a habit!' },
  30:  { emoji: '🌟', msg: 'One month! You\'re a networking pro.' },
  60:  { emoji: '🏆', msg: 'Two months of consistent touchbases!' },
  90:  { emoji: '💎', msg: 'Three months — legendary status!' },
  180: { emoji: '🚀', msg: 'Half a year of staying connected!' },
  365: { emoji: '🎖️', msg: 'ONE FULL YEAR. Absolutely incredible!' },
}

async function fireConfetti() {
  const confetti = (await import('canvas-confetti')).default
  confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
  setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.4 } }), 400)
}

export default function StreakPage() {
  const { streak, loading, fetchStreak } = useStreakStore()
  const confettiFiredRef = useRef(false)

  useEffect(() => { fetchStreak() }, [])

  useEffect(() => {
    if (!streak.currentStreak || confettiFiredRef.current) return
    if (MILESTONES.includes(streak.currentStreak)) {
      confettiFiredRef.current = true
      fireConfetti()
    }
  }, [streak.currentStreak])

  const milestoneInfo = MILESTONE_MESSAGES[streak.currentStreak]

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Streak</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your networking consistency over time</p>
      </div>

      {/* Milestone celebration */}
      {milestoneInfo && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center animate-fade-in">
          <div className="text-5xl mb-2">{milestoneInfo.emoji}</div>
          <h2 className="text-xl font-bold text-amber-700 dark:text-amber-300">{milestoneInfo.msg}</h2>
          <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
            You've reached a {streak.currentStreak}-day milestone!
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Flame,    label: 'Current Streak',  value: streak.currentStreak, suffix: 'days', color: 'text-amber-500' },
          { icon: Trophy,   label: 'Longest Streak',  value: streak.longestStreak, suffix: 'days', color: 'text-yellow-500' },
          { icon: Target,   label: 'Total Touchbases',value: streak.total,          suffix: 'total', color: 'text-blue-500' },
          { icon: Calendar, label: 'This Week',        value: streak.weeklyDates?.length || 0, suffix: '/ 7 days', color: 'text-green-500' },
        ].map(({ icon: Icon, label, value, suffix, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <Icon size={20} className={`${color} mb-3`} />
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{suffix}</div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Weekly bar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Last 7 Days</h3>
        <WeeklyBar weeklyDates={streak.weeklyDates} />
      </div>

      {/* Milestones road */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-5">Milestone Road</h3>
        <div className="relative">
          <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-4">
            {MILESTONES.map(m => {
              const reached = streak.currentStreak >= m || streak.longestStreak >= m
              const info = MILESTONE_MESSAGES[m]
              return (
                <div key={m} className="flex items-center gap-4 pl-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm z-10 flex-shrink-0 border-2 transition-all
                    ${reached
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-400'
                    }`}>
                    {reached ? '✓' : m}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${reached ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                      {info.emoji} {m} days — {info.msg}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Next milestone */}
      {streak.nextMilestone && streak.currentStreak < streak.nextMilestone && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Next milestone: {streak.nextMilestone} days
            </span>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
              {streak.nextMilestone - streak.currentStreak} days to go
            </span>
          </div>
          <div className="h-2 bg-amber-200 dark:bg-amber-900/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min((streak.currentStreak / streak.nextMilestone) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
