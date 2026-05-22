import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'

export default function ProtectedRoute({ children }) {
  const { session, isLoading } = useAuthStore()

  // While auth resolves, render nothing — the SplashScreen in App.jsx
  // covers mobile, and the INITIAL_SESSION event is fast enough on desktop
  // that no visible flash occurs.
  if (isLoading) return null

  if (!session) {
    return <Navigate to="/landing" replace />
  }

  return children
}
