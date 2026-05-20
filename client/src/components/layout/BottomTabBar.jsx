import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Network, Calendar, Settings, StickyNote } from 'lucide-react'

const tabs = [
  { to: '/',         icon: LayoutDashboard, label: 'Home'     },
  { to: '/contacts', icon: Users,           label: 'Contacts' },
  { to: '/network',  icon: Network,         label: 'Network'  },
  { to: '/notes',    icon: StickyNote,      label: 'Notes'    },
  { to: '/calendar', icon: Calendar,        label: 'Calendar' },
  { to: '/settings', icon: Settings,        label: 'Settings' },
]

export default function BottomTabBar() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 safe-area-inset-bottom"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-3 mb-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg shadow-black/10 dark:shadow-black/30">
        <div className="flex px-1 py-1">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              aria-label={label}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center min-h-[56px] gap-0.5 rounded-xl
                 transition-all duration-150 active:scale-95 cursor-pointer
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset
                 ${isActive ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-5 h-0.5 rounded-full mb-0.5 transition-all duration-150 ${isActive ? 'bg-amber-500' : 'bg-transparent'}`} />
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
                  <span className={`text-[11px] font-medium tracking-tight mt-0.5 ${isActive ? 'text-amber-500' : ''}`}>
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
