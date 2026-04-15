import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase.js'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      session:   null,
      user:      null,
      isLoading: true,

      setSession: (session) => set({
        session,
        user: session?.user ?? null,
        isLoading: false,
      }),

      signOut: async () => {
        await supabase.auth.signOut()
        set({ session: null, user: null })
      },

      // Returns the current access token for API calls
      getToken: () => get().session?.access_token ?? null,
    }),
    {
      name:    'touchbase-auth-store',
      partialize: (state) => ({ session: state.session, user: state.user }),
    }
  )
)
