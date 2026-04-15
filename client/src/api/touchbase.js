import { api } from './index.js'

export const getTodayTouchbase = ()       => api.get('/api/touchbase/today')
export const markDone          = (data)   => api.post('/api/touchbase/done', data)
export const skipTouchbase     = (data)   => api.post('/api/touchbase/skip', data)
export const getStreak         = ()       => api.get('/api/touchbase/streak')
