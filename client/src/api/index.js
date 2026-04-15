async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body && typeof options.body === 'object' && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : options.body,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    const e = new Error(err.error || 'Request failed')
    e.status = res.status
    e.code = err.code
    throw e
  }
  return res.json()
}

export const api = {
  get:    (url, params) => {
    const qs = params ? '?' + new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
    ).toString() : ''
    return request(`${url}${qs}`)
  },
  post:   (url, body)   => request(url, { method: 'POST', body }),
  put:    (url, body)   => request(url, { method: 'PUT', body }),
  delete: (url)         => request(url, { method: 'DELETE' }),
  upload: (url, form)   => request(url, { method: 'POST', body: form, headers: {} }),
}
