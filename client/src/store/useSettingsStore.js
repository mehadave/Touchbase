import { create } from 'zustand'
import * as settingsApi from '../api/settings.js'

export const useSettingsStore = create((set, get) => ({
  settings: {
    notification_time: '09:00',
    streak_reminder_enabled: true,
    default_follow_up_frequency: 30,
  },
  loading: false,

  fetchSettings: async () => {
    set({ loading: true })
    try {
      const data = await settingsApi.getSettings()
      set({ settings: { ...get().settings, ...data }, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  updateSettings: async (updates) => {
    const data = await settingsApi.updateSettings(updates)
    set({ settings: { ...get().settings, ...data } })
    return data
  },
}))
