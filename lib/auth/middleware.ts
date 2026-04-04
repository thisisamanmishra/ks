import { cookies } from 'next/headers'
import { verifyAccessToken, type TokenPayload } from './jwt'

export type Role = 'super_admin' | 'admin' | 'vendor' | 'customer' | 'pending_admin' | 'pillar_member' | 'board_member'
export type Department = 'hr' | 'finance' | 'operations' | 'marketing' | null

/**
 * Get current authenticated user from JWT cookie.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) return null
  return verifyAccessToken(token)
}

/**
 * Require authentication. Throws if not authenticated.
 */
export async function requireAuth(): Promise<TokenPayload> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}

/**
 * Require specific role(s). Throws if role doesn't match.
 */
export async function requireRole(...roles: Role[]): Promise<TokenPayload> {
  const user = await requireAuth()
  if (!roles.includes(user.role as Role)) {
    throw new Error('FORBIDDEN')
  }
  // For admin role, also check approval
  if (user.role === 'admin' && !user.isApproved) {
    throw new Error('PENDING_APPROVAL')
  }
  return user
}

/**
 * Require specific department. Throws if department doesn't match.
 * Super admin bypasses department check.
 */
export async function requireDepartment(...departments: NonNullable<Department>[]): Promise<TokenPayload> {
  const user = await requireRole('super_admin', 'admin')
  if (user.role === 'super_admin') return user // super admin has all access
  if (!user.department || !departments.includes(user.department as NonNullable<Department>)) {
    throw new Error('FORBIDDEN')
  }
  return user
}

/**
 * Helper to create error response based on auth errors
 */
export function authErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  switch (message) {
    case 'UNAUTHORIZED':
      return { error: 'Authentication required', status: 401 }
    case 'FORBIDDEN':
      return { error: 'You do not have permission to access this resource', status: 403 }
    case 'PENDING_APPROVAL':
      return { error: 'Your admin account is pending approval', status: 403 }
    default:
      return { error: 'Internal server error', status: 500 }
  }
}
