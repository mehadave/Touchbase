import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Contacts from './pages/Contacts.jsx'
import Network from './pages/Network.jsx'
import Calendar from './pages/Calendar.jsx'
import Templates from './pages/Templates.jsx'
import StreakPage from './pages/StreakPage.jsx'
import Settings from './pages/Settings.jsx'
import Notes from './pages/Notes.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { ToastContainer } from './components/ui/Toast.jsx'
import SearchModal from './components/SearchModal.jsx'
import OnboardingTour from './components/OnboardingTour.jsx'
import { useUIStore } from './store/useUIStore.js'
import { useSettingsStore } from './store/useSettingsStore.js'
import { useStreakStore } from './store/useStreakStore.js'
import { useAuthStore } from './store/authStore.js'
import { supabase } from './lib/supabase.js'

function SplashScreen({ fading }) {
  return (
    <div
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-amber-500 ${fading ? 'animate-splash-fade' : 'animate-fade-in'}`}
    >
      <div className="flex flex-col items-center gap-5">
        {/* Logo mark */}
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="22" r="11" fill="#F59E0B" opacity="0.9" />
            <circle cx="29" cy="22" r="11" fill="#EF4444" opacity="0.8" />
            <path d="M22 14 Q26 22 22 30 Q18 22 22 14Z" fill="white" opacity="0.9" />
          </svg>
        </div>
        {/* Wordmark */}
        <div className="text-center">
          <p className="text-2xl font-bold text-white tracking-tight">Touchbase</p>
          <p className="text-amber-200 text-sm mt-1">relationships that last</p>
        </div>
        {/* Pulse loader */}
        <div className="flex gap-1.5 mt-2">
          {[0,1,2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-amber-200"
              style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const initDarkMode  = useUIStore(s => s.initDarkMode)
  const fetchSettings = useSettingsStore(s => s.fetchSettings)
  const fetchStreak   = useStreakStore(s => s.fetchStreak)
  const { setSession, session, isLoading } = useAuthStore()
  const [splashVisible, setSplashVisible] = useState(true)
  const [splashFading, setSplashFading]   = useState(false)

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

  // Fade out splash once auth resolves
  useEffect(() => {
    if (!isLoading && splashVisible) {
      setSplashFading(true)
      const t = setTimeout(() => setSplashVisible(false), 380)
      return () => clearTimeout(t)
    }
  }, [isLoading])

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
                <Route path="/notes"     element={<Notes />} />
                <Route path="/settings"  element={<Settings />} />
                <Route path="*"          element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        } />
      </Routes>

      <SearchModal />
      <ToastContainer />
      <OnboardingTour />
      {splashVisible && <SplashScreen fading={splashFading} />}
    </BrowserRouter>
  )
}
