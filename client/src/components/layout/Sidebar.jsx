import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Network, Calendar,
  MessageSquare, Flame, Sun, Moon, Search,
} from 'lucide-react'
import Logo from './Logo.jsx'
import Footer from '../Footer.jsx'
import { useUIStore } from '../../store/useUIStore.js'
import { useStreakStore } from '../../store/useStreakStore.js'

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts',  icon: Users,           label: 'Contacts' },
  { to: '/network',   icon: Network,         label: 'Network' },
  { to: '/calendar',  icon: Calendar,        label: 'Calendar' },
  { to: '/templates', icon: MessageSquare,   label: 'Templates' },
  { to: '/streak',    icon: Flame,           label: 'Streak' },
]

export default function Sidebar() {
  const { darkMode, toggleDarkMode, setSearchOpen } = useUIStore()
  const { streak } = useStreakStore()

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <Logo size="md" />
      </div>

      {/* Search */}
      <button
        onClick={() => setSearchOpen(true)}
        className="mx-3 mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="text-xs bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 font-mono">⌘K</kbd>
      </button>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
                {label === 'Streak' && streak.currentStreak > 0 && (
                  <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-semibold">
                    {streak.currentStreak}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          {darkMode ? 'Light mode' : 'Dark mode'}
        </button>
      </div>

      {/* Copyright */}
      <Footer />
    </aside>
  )
}
