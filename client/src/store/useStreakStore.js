import { create } from 'zustand'
import { getStreak } from '../api/touchbase.js'

export const useStreakStore = create((set) => ({
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    total: 0,
    weeklyDates: [],
    nextMilestone: 7,
  },
  loading: false,

  fetchStreak: async () => {
    set({ loading: true })
    try {
      const data = await getStreak()
      set({ streak: data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  setStreak: (data) => set({ streak: data }),
}))
