import { Search, Sun, Moon, Menu } from 'lucide-react'
import { useUIStore } from '../../store/useUIStore.js'
import Logo from './Logo.jsx'

export default function TopBar() {
  const { darkMode, toggleDarkMode, setSearchOpen } = useUIStore()

  return (
    <header className="md:hidden sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
      <Logo size="sm" />
      <div className="flex-1" />
      <button
        onClick={() => setSearchOpen(true)}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Search"
      >
        <Search size={20} />
      </button>
      <button
        onClick={toggleDarkMode}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </header>
  )
}
