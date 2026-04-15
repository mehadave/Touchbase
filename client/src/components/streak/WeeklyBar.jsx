import { format, subDays, isEqual, parseISO } from 'date-fns'

export default function WeeklyBar({ weeklyDates = [] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    const str = format(d, 'yyyy-MM-dd')
    const done = weeklyDates.includes(str)
    const isToday = i === 6
    return { d, str, done, isToday, label: format(d, 'EEE') }
  })

  return (
    <div className="flex items-end gap-2">
      {days.map(({ str, done, isToday, label }) => (
        <div key={str} className="flex flex-col items-center gap-1.5 flex-1">
          <div className={`
            w-full rounded-lg transition-all
            ${done
              ? 'bg-amber-400 dark:bg-amber-500'
              : isToday
                ? 'bg-gray-200 dark:bg-gray-700 border-2 border-amber-400 border-dashed'
                : 'bg-gray-200 dark:bg-gray-700'
            }
            ${done ? 'h-10' : 'h-6'}
          `} />
          <span className={`text-xs ${isToday ? 'text-amber-500 font-semibold' : 'text-gray-400'}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
