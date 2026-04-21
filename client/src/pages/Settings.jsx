import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Bell, Shield, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useSettingsStore } from '../store/useSettingsStore.js'
import { useUIStore } from '../store/useUIStore.js'
import Button from '../components/ui/Button.jsx'

export default function Settings() {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const { settings, updateSettings } = useSettingsStore()
  const [user, setUser] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setDisplayName(user?.user_metadata?.full_name || '')
    })
  }, [])

  const handleSaveName = async () => {
    setSavingName(true)
    const { error } = await supabase.auth.updateUser({ data: { full_name: displayName } })
    setSavingName(false)
    if (error) addToast('Failed to update name', 'error')
    else addToast('Name updated')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const freqOptions = [
    { value: 7,  label: 'Weekly (7 days)' },
    { value: 14, label: 'Every 2 weeks' },
    { value: 30, label: 'Monthly (30 days)' },
    { value: 60, label: 'Every 2 months' },
    { value: 90, label: 'Quarterly (90 days)' },
  ]

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <User size={16} className="text-amber-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Profile</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5">
              {user?.email || '…'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Display name</label>
            <div className="flex gap-2">
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Your name"
              />
              <Button size="sm" onClick={handleSaveName} loading={savingName}>Save</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <Bell size={16} className="text-amber-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Preferences</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Default follow-up frequency</label>
            <select
              value={settings?.default_follow_up_frequency || 30}
              onChange={e => updateSettings({ default_follow_up_frequency: Number(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {freqOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Streak reminders</p>
              <p className="text-xs text-gray-500 mt-0.5">Remind me to keep my daily streak going</p>
            </div>
            <button
              onClick={() => updateSettings({ streak_reminder_enabled: !settings?.streak_reminder_enabled })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                settings?.streak_reminder_enabled ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              role="switch"
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                settings?.streak_reminder_enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
              }`} />
            </button>
          </div>
        </div>
      </section>

      {/* Account */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <Shield size={16} className="text-amber-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Account</h2>
        </div>
        <div className="p-5">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </section>
    </div>
  )
}
