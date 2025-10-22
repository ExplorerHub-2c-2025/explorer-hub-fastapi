export async function authFetch(path: string, opts: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers = {
    ...(opts.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const res = await fetch(path, { ...opts, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Request failed: ${res.status} ${res.statusText} ${text}`)
    // attach response for callers if needed
    ;(err as any).response = res
    throw err
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return res.json()
  return res.text()
}

export default authFetch
