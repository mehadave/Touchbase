import { Flame } from 'lucide-react'
import { useStreakStore } from '../../store/useStreakStore.js'

export default function StreakBar() {
  const { streak } = useStreakStore()
  const { currentStreak, nextMilestone } = streak

  const progress = nextMilestone
    ? Math.min((currentStreak / nextMilestone) * 100, 100)
    : 100

  return (
    <div className="flex items-center gap-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
      <div className="flex items-center gap-2">
        <Flame size={20} className="text-amber-500" />
        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{currentStreak}</span>
        <span className="text-sm text-amber-600/80 dark:text-amber-400/80 font-medium">
          day streak
        </span>
      </div>

      {nextMilestone && (
        <div className="flex-1">
          <div className="flex justify-between text-xs text-amber-600/70 dark:text-amber-400/70 mb-1">
            <span>Progress to {nextMilestone} days</span>
            <span>{currentStreak}/{nextMilestone}</span>
          </div>
          <div className="h-1.5 bg-amber-200 dark:bg-amber-900/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
