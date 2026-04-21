import { api } from './client.js'
export const listNotes      = (params = {}) => api.get('/notes?' + new URLSearchParams(params))
export const getNote        = (id)          => api.get(`/notes/${id}`)
export const createNote     = (data)        => api.post('/notes', data)
export const updateNote     = (id, data)    => api.put(`/notes/${id}`, data)
export const deleteNote     = (id)          => api.delete(`/notes/${id}`)
