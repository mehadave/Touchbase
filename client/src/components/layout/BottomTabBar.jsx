import { NavLink, useLocation } from 'react-router-dom'
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
  const { pathname } = useLocation()

  const activeIndex = tabs.findIndex(({ to }) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to)
  )

  const pct = `${(activeIndex / tabs.length) * 100}%`
  const w   = `${100 / tabs.length}%`

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-4 mb-4">
        {/* Outer pill */}
        <div className="relative flex items-stretch bg-gray-900/88 dark:bg-gray-950/90 backdrop-blur-2xl rounded-[28px] border border-white/8 shadow-2xl shadow-black/50 p-1.5">

          {/* Sliding white bubble */}
          <div
            className="absolute inset-y-1.5 pointer-events-none"
            style={{
              left:  pct,
              width: w,
              padding: '0 6px',
              transition: 'left 320ms cubic-bezier(0.34, 1.4, 0.64, 1)',
            }}
          >
            <div className="w-full h-full bg-white rounded-[20px] shadow-sm" />
          </div>

          {/* Tab items */}
          {tabs.map(({ to, icon: Icon, label }, i) => {
            const isActive = i === activeIndex
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                aria-label={label}
                className="relative z-10 flex-1 flex flex-col items-center justify-center py-2.5 gap-[3px] focus:outline-none"
              >
                <Icon
                  size={isActive ? 21 : 20}
                  strokeWidth={isActive ? 2.5 : 1.75}
                  style={{ transition: 'color 200ms, transform 320ms cubic-bezier(0.34, 1.4, 0.64, 1)' }}
                  className={isActive ? 'text-gray-900' : 'text-gray-500'}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    lineHeight: 1,
                    maxHeight: isActive ? 14 : 0,
                    opacity: isActive ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 250ms ease, opacity 200ms ease',
                  }}
                  className={isActive ? 'text-gray-900' : 'text-gray-500'}
                >
                  {label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
