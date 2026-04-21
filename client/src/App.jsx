import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Contacts from './pages/Contacts.jsx'
import Network from './pages/Network.jsx'
import Calendar from './pages/Calendar.jsx'
import Templates from './pages/Templates.jsx'
import StreakPage from './pages/StreakPage.jsx'
import Settings from './pages/Settings.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { ToastContainer } from './components/ui/Toast.jsx'
import SearchModal from './components/SearchModal.jsx'
import { useUIStore } from './store/useUIStore.js'
import { useSettingsStore } from './store/useSettingsStore.js'
import { useStreakStore } from './store/useStreakStore.js'
import { useAuthStore } from './store/authStore.js'
import { supabase } from './lib/supabase.js'

export default function App() {
  const initDarkMode  = useUIStore(s => s.initDarkMode)
  const fetchSettings = useSettingsStore(s => s.fetchSettings)
  const fetchStreak   = useStreakStore(s => s.fetchStreak)
  const { setSession, session } = useAuthStore()

  useEffect(() => {
    initDarkMode()

    // Load initial session — always resolve so isLoading never stays stuck
    supabase.auth.getSession()
      .then(({ data: { session } }) => setSession(session))
      .catch(() => setSession(null))

    // Keep auth state in sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Only fetch settings/streak when logged in
  useEffect(() => {
    if (session) {
      fetchSettings()
      fetchStreak()
    }
  }, [session])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* All app routes are protected */}
        <Route path="/*" element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/"          element={<Dashboard />} />
                <Route path="/contacts"  element={<Contacts />} />
                <Route path="/network/*" element={<Network />} />
                <Route path="/calendar"  element={<Calendar />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/streak"    element={<StreakPage />} />
                <Route path="/settings"  element={<Settings />} />
                <Route path="*"          element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        } />
      </Routes>

      <SearchModal />
      <ToastContainer />
    </BrowserRouter>
  )
}
