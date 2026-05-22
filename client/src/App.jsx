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
import Landing from './pages/Landing.jsx'
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
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-amber-500 transition-all duration-500 ease-in-out ${fading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
    >
      <div className="flex flex-col items-center gap-5">
        {/* Logo mark — matches Logo.jsx exactly */}
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="splashGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
              <linearGradient id="splashGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#F97316" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <circle cx="18" cy="24" r="14" fill="url(#splashGrad1)" />
            <circle cx="30" cy="24" r="14" fill="url(#splashGrad2)" />
            <path
              d="M 18 24 Q 20 18 24 24 Q 28 30 30 24"
              stroke="white" strokeWidth="2.5" fill="none"
              strokeLinecap="round" strokeLinejoin="round"
            />
            <circle cx="18" cy="24" r="2" fill="white" opacity="0.9" />
            <circle cx="30" cy="24" r="2" fill="white" opacity="0.9" />
          </svg>
        </div>
        {/* Wordmark */}
        <div className="text-center">
          <p className="text-2xl font-bold text-white tracking-tight">Touchbase</p>
          <p className="text-amber-200 text-sm mt-1">relationships that last</p>
        </div>
        {/* Staggered pulse dots */}
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/60"
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
  const splashStart = useState(() => Date.now())[0]

  useEffect(() => {
    initDarkMode()

    // onAuthStateChange fires INITIAL_SESSION immediately with the current
    // session — no need for a separate getSession() call, which would double-
    // invoke setSession and render the loading screen twice.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fade out splash once auth resolves, but always show for at least 2.5s
  useEffect(() => {
    if (!isLoading && splashVisible) {
      const elapsed   = Date.now() - splashStart
      const remaining = Math.max(0, 2500 - elapsed)
      const t = setTimeout(() => {
        setSplashFading(true)
        setTimeout(() => setSplashVisible(false), 520)
      }, remaining)
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
        {/* Public routes */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/signup"  element={<Signup />} />

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
