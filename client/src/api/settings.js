import { api } from './index.js'

export const getSettings    = ()     => api.get('/api/settings')
export const updateSettings = (data) => api.put('/api/settings', data)
