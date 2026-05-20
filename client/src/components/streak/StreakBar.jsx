import { Flame, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStreakStore } from '../../store/useStreakStore.js'

export default function StreakBar() {
  const { streak } = useStreakStore()
  const { currentStreak = 0, nextMilestone } = streak

  const progress = nextMilestone
    ? Math.min((currentStreak / nextMilestone) * 100, 100)
    : 100

  return (
    <Link
      to="/streak"
      className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-100
                 dark:border-gray-800 rounded-2xl px-5 py-4 shadow-sm min-h-[110px]
                 hover:border-amber-200 dark:hover:border-amber-800/60
                 hover:shadow-md hover:shadow-amber-500/5
                 transition-all duration-200 cursor-pointer group h-full"
    >
      {/* Flame icon + count */}
      <div className="flex flex-col items-center justify-center w-14 shrink-0">
        <div className="relative">
          <Flame size={28} className="text-amber-500 group-hover:scale-110 transition-transform duration-200" />
          {currentStreak > 0 && (
            <span className="absolute -top-1 -right-2 text-[10px] font-black text-amber-600 dark:text-amber-400
                             bg-amber-100 dark:bg-amber-900/40 rounded-full px-1 leading-tight">
              {currentStreak}
            </span>
          )}
        </div>
        <span className="text-[10px] font-semibold text-amber-600/70 dark:text-amber-400/70 mt-1 leading-none">
          {currentStreak === 1 ? 'day' : 'days'}
        </span>
      </div>

      {/* Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {currentStreak === 0
              ? 'Start your streak'
              : `${currentStreak}-day streak`}
          </span>
          {nextMilestone && (
            <div className="flex items-center gap-1">
              <Trophy size={11} className="text-amber-400" />
              <span className="text-xs text-gray-400">{nextMilestone}d</span>
            </div>
          )}
        </div>

        {nextMilestone ? (
          <>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {nextMilestone - currentStreak > 0
                ? `${nextMilestone - currentStreak} days to next milestone`
                : 'Milestone reached!'}
            </p>
          </>
        ) : (
          <p className="text-xs text-gray-400">Keep going — you're on a roll!</p>
        )}
      </div>
    </Link>
  )
}
