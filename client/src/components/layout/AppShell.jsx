import Sidebar from './Sidebar.jsx'
import BottomTabBar from './BottomTabBar.jsx'
import TopBar from './TopBar.jsx'
import PWAInstallBanner from '../PWAInstallBanner.jsx'
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut.js'
import { useUIStore } from '../../store/useUIStore.js'

export default function AppShell({ children }) {
  const setSearchOpen = useUIStore(s => s.setSearchOpen)

  useKeyboardShortcut('k', () => setSearchOpen(true), { meta: true })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      {/* Mobile top bar */}
      <TopBar />

      {/* Main content area — offset by sidebar on desktop */}
      <main className="md:ml-60 min-h-screen pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <BottomTabBar />

      {/* PWA install prompt */}
      <PWAInstallBanner />
    </div>
  )
}
