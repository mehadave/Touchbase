import { api } from './index.js'

export const listTemplates  = ()       => api.get('/api/templates')
export const createTemplate = (data)   => api.post('/api/templates', data)
export const updateTemplate = (id, d)  => api.put(`/api/templates/${id}`, d)
export const deleteTemplate = (id)     => api.delete(`/api/templates/${id}`)
