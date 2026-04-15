// Central API client — attaches the Supabase JWT to every request automatically.
import { useAuthStore } from '../store/authStore.js'

const BASE = import.meta.env.VITE_API_URL || '/api'

async function request(method, path, body, options = {}) {
  const token = useAuthStore.getState().getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw Object.assign(new Error(err.error || 'Request failed'), { status: res.status, body: err })
  }

  return res.json()
}

export const api = {
  get:    (path, opts)       => request('GET',    path, undefined, opts),
  post:   (path, body, opts) => request('POST',   path, body,      opts),
  put:    (path, body, opts) => request('PUT',    path, body,      opts),
  delete: (path, opts)       => request('DELETE', path, undefined, opts),
}
