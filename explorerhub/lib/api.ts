export async function authFetch(path: string, opts: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  // Normalize HeadersInit to a plain object so spreading works for all forms
  let incomingHeaders: Record<string, string> = {}
  const h = opts.headers as HeadersInit | undefined
  if (h instanceof Headers) {
    h.forEach((value, key) => {
      incomingHeaders[key] = value
    })
  } else if (Array.isArray(h)) {
    for (const [key, value] of h) incomingHeaders[key] = value
  } else if (h && typeof h === 'object') {
    incomingHeaders = { ...(h as Record<string, string>) }
  }

  const headers = {
    ...incomingHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  try {
    const res = await fetch(path, { ...opts, headers })

    if (!res.ok) {
      // Handle 401 Unauthorized - token expired or invalid
      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          // Only redirect if not already on auth pages
          if (!window.location.pathname.includes('/sign-in') && 
              !window.location.pathname.includes('/signup') &&
              !window.location.pathname.includes('/forgot-password')) {
            window.location.href = '/sign-in?expired=true'
          }
        }
      }

      const text = await res.text().catch(() => '')
      const err = new Error(`Request failed: ${res.status} ${res.statusText} ${text}`)
      // attach response for callers if needed
      ;(err as any).response = res
      throw err
    }

    const contentType = res.headers.get('content-type') || ''
    if (res.status === 204) {
      // No Content response - return null
      return null
    }
    if (contentType.includes('application/json')) return res.json()
    return res.text()
  } catch (err) {
    // Network errors (CORS, DNS, connection refused) surface as a TypeError from fetch.
    // Wrap them with contextual information so callers can debug more easily.
    const message = err instanceof Error ? err.message : String(err)
    const wrapped = new Error(`Network request failed for ${path}: ${message}`)
    ;(wrapped as any).original = err
    throw wrapped
  }
}

export default authFetch
