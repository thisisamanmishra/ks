/**
 * A fetch wrapper that automatically refreshes the access token on 401 and retries once.
 * Use this for any authenticated API calls in React client components.
 */
export async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options)

  if (res.status !== 401) return res

  // Token expired — attempt a silent refresh
  const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' })
  if (!refreshRes.ok) {
    // Refresh also failed (session truly expired) — return the original 401
    return res
  }

  // Retry the original request with the new cookie (browser sends it automatically)
  return fetch(url, options)
}
