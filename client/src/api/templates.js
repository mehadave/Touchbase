import { api } from './client.js'

export const listTemplates  = ()     => api.get('/templates')
export const createTemplate = (data) => api.post('/templates', data)
export const updateTemplate = (id,d) => api.put(`/templates/${id}`, d)
export const deleteTemplate = (id)   => api.delete(`/templates/${id}`)
