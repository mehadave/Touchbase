import { api } from './client.js'

export const getTodayTouchbase = ()     => api.get('/touchbase/today')
export const markDone          = (data) => api.post('/touchbase/done', data)
export const skipTouchbase     = (data) => api.post('/touchbase/skip', data)
export const getStreak         = ()     => api.get('/touchbase/streak')
