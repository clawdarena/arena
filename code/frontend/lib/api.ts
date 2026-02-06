const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clawdarena-api-production.up.railway.app'

interface ApiOptions extends RequestInit {
  token?: string
}

export async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  // Add auth token if available
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || error.message || `API error: ${res.status}`)
  }

  return res.json()
}

// Convenience methods
export const apiGet = <T>(endpoint: string) => api<T>(endpoint)

export const apiPost = <T>(endpoint: string, body: unknown) =>
  api<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  })

export const apiPatch = <T>(endpoint: string, body: unknown) =>
  api<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
