// Central API client — attaches the Supabase JWT to every request automatically.
import { useAuthStore } from '../store/authStore.js'

const BASE = import.meta.env.VITE_API_URL || '/api'

async function request(method, path, body, options = {}) {
  const token = useAuthStore.getState().getToken()
  const isFormData = body instanceof FormData

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  // Build query string for GET params
  let url = `${BASE}${path}`
  if (options.params) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(options.params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
    ).toString()
    if (qs) url += '?' + qs
  }

  const res = await fetch(url, {
    method,
    headers,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw Object.assign(new Error(err.error || 'Request failed'), { status: res.status, body: err })
  }

  return res.json()
}

export const api = {
  get:    (path, params)     => request('GET',    path, undefined, { params }),
  post:   (path, body)       => request('POST',   path, body),
  put:    (path, body)       => request('PUT',    path, body),
  delete: (path)             => request('DELETE', path),
  upload: (path, formData)   => request('POST',   path, formData),
}
