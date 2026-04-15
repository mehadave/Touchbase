import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Network, Calendar, Flame } from 'lucide-react'

const tabs = [
  { to: '/',         icon: LayoutDashboard, label: 'Home' },
  { to: '/contacts', icon: Users,           label: 'Contacts' },
  { to: '/network',  icon: Network,         label: 'Network' },
  { to: '/calendar', icon: Calendar,        label: 'Calendar' },
  { to: '/streak',   icon: Flame,           label: 'Streak' },
]

export default function BottomTabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom">
      <div className="flex">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
                isActive
                  ? 'text-amber-500'
                  : 'text-gray-400 dark:text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
