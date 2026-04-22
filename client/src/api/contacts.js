import { api } from './client.js'

export const listContacts   = (params) => api.get('/contacts', params)
export const getContact     = (id)     => api.get(`/contacts/${id}`)
export const createContact  = (data)   => api.post('/contacts', data)
export const updateContact  = (id, d)  => api.put(`/contacts/${id}`, d)
export const deleteContact  = (id)     => api.delete(`/contacts/${id}`)
export const importContacts = (data)   => api.post('/contacts/import', data)
export const getAllTags      = ()       => api.get('/contacts/tags/all')
export const uploadPhoto    = (id, file) => {
  const form = new FormData()
  form.append('photo', file)
  return api.upload(`/contacts/${id}/photo`, form)
}
