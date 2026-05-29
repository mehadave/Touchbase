import { create } from 'zustand'
import * as contactsApi from '../api/contacts.js'
import { useUIStore } from './useUIStore.js' // used by create/update/delete actions

export const useContactsStore = create((set, get) => ({
  contacts: [],
  loading: false,
  filters: {
    search: '',
    category: '',
    tag: '',
    strength: '',
    overdue: false,
    conference_id: '',
  },
  sortBy: 'name',

  setFilter: (key, value) => set(s => ({ filters: { ...s.filters, [key]: value } })),
  setSortBy: (sort) => set({ sortBy: sort }),
  clearFilters: () => set({ filters: { search: '', category: '', tag: '', strength: '', overdue: false, conference_id: '' } }),

  fetchContacts: async (params = {}) => {
    // Only show loading spinner on first load — subsequent refreshes update
    // silently so the user sees stale data rather than a blank skeleton.
    const hasData = get().contacts.length > 0
    if (!hasData) set({ loading: true })
    try {
      const { filters, sortBy } = get()
      const query = { ...filters, sort: sortBy, ...params }
      // Strip empty values
      Object.keys(query).forEach(k => {
        if (query[k] === '' || query[k] === false || query[k] === null) delete query[k]
      })
      const data = await contactsApi.listContacts(query)
      set({ contacts: data, loading: false })
    } catch {
      // Silently fail — empty state shows if contacts can't load,
      // no toast needed since the user can see nothing loaded.
      set({ loading: false })
    }
  },

  createContact: async (data) => {
    const result = await contactsApi.createContact(data)
    set(s => ({ contacts: [result, ...s.contacts] }))
    useUIStore.getState().addToast('Contact added')
    return result
  },

  updateContact: async (id, data) => {
    const result = await contactsApi.updateContact(id, data)
    set(s => ({ contacts: s.contacts.map(c => c.id === id ? result : c) }))
    useUIStore.getState().addToast('Contact saved')
    return result
  },

  deleteContact: async (id) => {
    await contactsApi.deleteContact(id)
    set(s => ({ contacts: s.contacts.filter(c => c.id !== id) }))
    // Toast is shown by the calling component (which has the contact name)
  },
}))
