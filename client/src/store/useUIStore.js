import { create } from 'zustand'

let toastId = 0

export const useUIStore = create((set, get) => ({
  // Dark mode
  darkMode: false,
  initDarkMode: () => {
    const saved = localStorage.getItem('touchbase-dark')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = saved !== null ? saved === 'true' : prefersDark
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    set({ darkMode: dark })
  },
  toggleDarkMode: () => {
    const dark = !get().darkMode
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('touchbase-dark', String(dark))
    set({ darkMode: dark })
  },

  // Toasts
  toasts: [],
  addToast: (message, type = 'success', duration = 3500) => {
    const id = ++toastId
    set(s => ({ toasts: [...s.toasts, { id, message, type, duration }] }))
    setTimeout(() => get().removeToast(id), duration + 300)
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  // Global search
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),

  // Modals / drawers
  activeModal: null,
  modalPayload: null,
  openModal: (modal, payload = null) => set({ activeModal: modal, modalPayload: payload }),
  closeModal: () => set({ activeModal: null, modalPayload: null }),
}))
