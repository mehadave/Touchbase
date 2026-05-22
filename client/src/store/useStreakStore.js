import { create } from 'zustand'
import { getStreak } from '../api/touchbase.js'

export const useStreakStore = create((set, get) => ({
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    total: 0,
    weeklyDates: [],
    nextMilestone: 7,
  },
  loading: false,

  fetchStreak: async () => {
    // Only block on first load; subsequent re-fetches update silently.
    const hasData = get().streak.total > 0 || get().streak.currentStreak > 0
    if (!hasData) set({ loading: true })
    try {
      const data = await getStreak()
      set({ streak: data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  setStreak: (data) => set({ streak: data }),
}))
