import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as settingsApi from '../api/settings.js'

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      settings: {
        notification_time: '09:00',
        streak_reminder_enabled: true,
        default_follow_up_frequency: 30,
        app_tone: 'millennial',
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
        // Optimistic update — apply immediately so UI responds instantly
        const previous = get().settings
        set({ settings: { ...previous, ...updates } })
        try {
          const data = await settingsApi.updateSettings(updates)
          set({ settings: { ...get().settings, ...data } })
          return data
        } catch (err) {
          set({ settings: previous }) // roll back on failure
          throw err
        }
      },
    }),
    {
      name: 'touchbase-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
)
