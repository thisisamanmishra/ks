/**
 * Input sanitisation and validation utilities.
 * Used in all API routes to prevent XSS, injection, and malformed data.
 */

// ── String sanitisation ─────────────────────────────────────────────────────

/** Strip HTML tags to prevent stored XSS */
export function stripHtml(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/<[^>]*>/g, '')          // strip HTML tags
    .replace(/javascript:/gi, '')      // remove JS protocol
    .replace(/on\w+\s*=/gi, '')        // remove inline event handlers
    .replace(/data:/gi, '')            // remove data URIs
    .trim()
}

/** Normalize and validate an email address */
export function sanitizeEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const email = input.trim().toLowerCase()
  // RFC-compliant basic check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return null
  if (email.length > 254) return null
  return email
}

/** Sanitize a name — letters, spaces, hyphens, apostrophes only */
export function sanitizeName(input: unknown, maxLen = 100): string | null {
  if (typeof input !== 'string') return null
  const name = input.trim()
  if (name.length === 0 || name.length > maxLen) return null
  if (!/^[\p{L}\s'\-\.]+$/u.test(name)) return null
  return name
}

/** Sanitize a phone number — digits, +, -, spaces, parens only */
export function sanitizePhone(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const phone = input.trim().replace(/\s/g, '')
  if (!/^\+?[\d\-()\s]{7,20}$/.test(phone)) return null
  return phone
}

/** Clamp a string to max length (no stripping, just truncation as safety net) */
export function truncate(input: unknown, maxLen: number): string {
  if (typeof input !== 'string') return ''
  return input.slice(0, maxLen)
}

/** Validate password strength */
export function validatePassword(password: unknown): { valid: boolean; reason?: string } {
  if (typeof password !== 'string') return { valid: false, reason: 'Password must be a string' }
  if (password.length < 8) return { valid: false, reason: 'Password must be at least 8 characters' }
  if (password.length > 128) return { valid: false, reason: 'Password too long' }
  return { valid: true }
}

/** Validate a URL — must be http or https */
export function sanitizeUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null
  try {
    const url = new URL(input.trim())
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return url.href
  } catch {
    return null
  }
}

// ── JSON body utilities ─────────────────────────────────────────────────────

/** Safely parse a request body with a max byte limit */
export async function safeJson(
  request: Request,
  maxBytes = 50_000,
): Promise<{ data: Record<string, unknown> | null; error?: string }> {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return { data: null, error: 'Content-Type must be application/json' }
  }

  const contentLength = parseInt(request.headers.get('content-length') || '0', 10)
  if (contentLength > maxBytes) {
    return { data: null, error: 'Request body too large' }
  }

  try {
    // Clone and read with a size guard
    const text = await request.text()
    if (text.length > maxBytes) {
      return { data: null, error: 'Request body too large' }
    }
    const data = JSON.parse(text) as Record<string, unknown>
    // Prevent prototype pollution
    if (Object.prototype.hasOwnProperty.call(data, '__proto__') ||
        Object.prototype.hasOwnProperty.call(data, 'constructor') ||
        Object.prototype.hasOwnProperty.call(data, 'prototype')) {
      return { data: null, error: 'Invalid request' }
    }
    return { data }
  } catch {
    return { data: null, error: 'Invalid JSON' }
  }
}

// ── Common field validators ─────────────────────────────────────────────────

export function assertString(val: unknown, field: string, maxLen = 500): string {
  if (typeof val !== 'string' || val.trim().length === 0) {
    throw new Error(`VALIDATION:${field} is required`)
  }
  if (val.length > maxLen) {
    throw new Error(`VALIDATION:${field} exceeds maximum length`)
  }
  return val.trim()
}

export function assertOptionalString(val: unknown, maxLen = 500): string | null {
  if (val === null || val === undefined || val === '') return null
  if (typeof val !== 'string') return null
  return val.trim().slice(0, maxLen)
}

export function assertPositiveInt(val: unknown, field: string): number {
  const n = Number(val)
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`VALIDATION:${field} must be a positive integer`)
  }
  return n
}
