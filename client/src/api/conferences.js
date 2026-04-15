import { api } from './index.js'

export const listConferences  = ()       => api.get('/api/conferences')
export const getConference    = (id)     => api.get(`/api/conferences/${id}`)
export const createConference = (data)   => api.post('/api/conferences', data)
export const updateConference = (id, d)  => api.put(`/api/conferences/${id}`, d)
export const deleteConference = (id)     => api.delete(`/api/conferences/${id}`)
