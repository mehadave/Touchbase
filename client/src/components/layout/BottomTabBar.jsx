import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Network, Calendar, Flame, Settings } from 'lucide-react'

const tabs = [
  { to: '/',         icon: LayoutDashboard, label: 'Home'     },
  { to: '/contacts', icon: Users,           label: 'Contacts' },
  { to: '/network',  icon: Network,         label: 'Network'  },
  { to: '/calendar', icon: Calendar,        label: 'Calendar' },
  { to: '/streak',   icon: Flame,           label: 'Streak'   },
  { to: '/settings', icon: Settings,        label: 'Settings' },
]

export default function BottomTabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 safe-area-inset-bottom"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-3 mb-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg shadow-black/10 dark:shadow-black/30">
        <div className="flex px-1 py-1">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 gap-0.5 rounded-xl transition-all text-xs ${
                  isActive
                    ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-500'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={19} strokeWidth={isActive ? 2.5 : 1.75} />
                  <span className={`font-medium tracking-tight ${isActive ? 'text-amber-500' : ''}`} style={{ fontSize: 10 }}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
