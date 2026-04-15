import { api } from './index.js'

export const listContacts    = (params) => api.get('/api/contacts', params)
export const getContact      = (id)     => api.get(`/api/contacts/${id}`)
export const createContact   = (data)   => api.post('/api/contacts', data)
export const updateContact   = (id, d)  => api.put(`/api/contacts/${id}`, d)
export const deleteContact   = (id)     => api.delete(`/api/contacts/${id}`)
export const importContacts  = (data)   => api.post('/api/contacts/import', data)
export const getAllTags       = ()       => api.get('/api/contacts/tags/all')
export const uploadPhoto     = (id, file) => {
  const form = new FormData()
  form.append('photo', file)
  return api.upload(`/api/contacts/${id}/photo`, form)
}
