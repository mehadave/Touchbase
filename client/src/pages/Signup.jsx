import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import Logo from '../components/layout/Logo.jsx'

export default function Signup() {
  const navigate    = useNavigate()
  const [name,      setName]     = useState('')
  const [email,     setEmail]    = useState('')
  const [password,  setPassword] = useState('')
  const [showPw,    setShowPw]   = useState(false)
  const [loading,   setLoading]  = useState(false)
  const [error,     setError]    = useState('')
  const [confirmed, setConfirmed] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name.trim() } },
      })
      if (err) throw err
      setConfirmed(true)
    } catch (err) {
      setError(err.message || 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-8"><Logo size="lg" /></div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <Mail size={24} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              We sent a confirmation link to <strong className="text-gray-700 dark:text-gray-300">{email}</strong>.
              Click it to activate your account, then come back to sign in.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block py-2.5 px-6 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition"
            >
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Start building meaningful connections
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Full name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Alex Johnson"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700
                             bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
                             placeholder-gray-400 text-sm transition"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700
                             bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
                             placeholder-gray-400 text-sm transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password <span className="text-gray-400 font-normal">(min. 6 characters)</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700
                             bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
                             placeholder-gray-400 text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700
                         text-white font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-500 hover:text-amber-600 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          Your data is private — never shared, never sold.
        </p>
      </div>
    </div>
  )
}
