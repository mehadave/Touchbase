import { api } from './client.js'

export const listConferences  = ()     => api.get('/conferences')
export const getConference    = (id)   => api.get(`/conferences/${id}`)
export const createConference = (data) => api.post('/conferences', data)
export const updateConference = (id,d) => api.put(`/conferences/${id}`, d)
export const deleteConference = (id)   => api.delete(`/conferences/${id}`)
