import { create } from 'zustand'
import * as contactsApi from '../api/contacts.js'
import { useUIStore } from './useUIStore.js'

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
    set({ loading: true })
    try {
      const { filters, sortBy } = get()
      const query = { ...filters, sort: sortBy, ...params }
      // Strip empty values
      Object.keys(query).forEach(k => {
        if (query[k] === '' || query[k] === false || query[k] === null) delete query[k]
      })
      const data = await contactsApi.listContacts(query)
      set({ contacts: data, loading: false })
    } catch (err) {
      set({ loading: false })
      // Don't show error for 404 or empty results — just means no contacts yet
      const status = err?.status ?? err?.statusCode ?? err?.response?.status
      if (status !== 404 && err?.message !== 'No contacts found') {
        useUIStore.getState().addToast('Failed to load contacts', 'error')
      }
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
    useUIStore.getState().addToast('Contact deleted')
  },
}))
