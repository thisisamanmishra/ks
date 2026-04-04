import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || 'karyasaarthi-access-secret-change-me')

interface TokenPayload {
  userId: number
  email: string
  role: string
  department: string | null
  pillarRole?: string | null
  isApproved: boolean
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET)
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}

const INTERNAL_ROLES = ['super_admin', 'board_member', 'admin', 'pending_admin', 'pillar_member']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — no auth needed
  const publicPaths = [
    '/', '/login', '/signup', '/staff-login', '/forgot-password',
    '/blogs', '/services', '/about', '/contact', '/events',
    '/api/auth/login', '/api/auth/signup', '/api/auth/refresh',
    '/api/auth/forgot-password', '/api/auth/verify-otp',
    '/api/auth/reset-password', '/api/auth/send-signup-otp',
    '/api/services', '/api/events', '/api/newsletter',
  ]

  const isPublic = publicPaths.some(p =>
    pathname === p ||
    (p === '/blogs' && pathname.startsWith('/blogs/')) ||
    (p === '/services' && pathname.startsWith('/services/')) ||
    (p === '/events' && pathname.startsWith('/events/')) ||
    (p === '/api/services' && pathname.startsWith('/api/services')) ||
    (p === '/api/events' && pathname.startsWith('/api/events'))
  )

  if (isPublic) return NextResponse.next()

  // Static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/images') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // Get access token
  const accessToken = request.cookies.get('access_token')?.value
  let user: TokenPayload | null = null

  if (accessToken) {
    user = await verifyToken(accessToken)
  }

  // No valid access token
  if (!user) {
    const refreshToken = request.cookies.get('refresh_token')?.value
    if (!refreshToken) {
      if (
        pathname.startsWith('/admin') ||
        pathname.startsWith('/api/admin') ||
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/vendor')
      ) {
        const loginUrl = INTERNAL_ROLES.some(r => pathname.includes(r)) || pathname.startsWith('/admin')
          ? '/staff-login'
          : '/login'
        return NextResponse.redirect(new URL(loginUrl, request.url))
      }
      return NextResponse.next()
    }
    // Let page-level auth handle refresh for protected pages  
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/vendor')) {
      return NextResponse.next()
    }
    // Admin routes with refresh token → redirect to staff login
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/staff-login', request.url))
    }
    return NextResponse.next()
  }

  // ─── Admin / Internal routes ───────────────────────────────────
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // Super admin → full access
    if (user.role === 'super_admin') {
      return NextResponse.next()
    }

    // Board member → only /admin/board
    if (user.role === 'board_member') {
      if (pathname.startsWith('/admin/board') || pathname.startsWith('/api/admin/board')) {
        return NextResponse.next()
      }
      return NextResponse.redirect(new URL('/admin/board', request.url))
    }

    // Pillar member → only their pillar dashboard
    if (user.role === 'pillar_member' && user.pillarRole) {
      const allowed = `/admin/pillars/${user.pillarRole}`
      if (pathname.startsWith(allowed)) {
        return NextResponse.next()
      }
      return NextResponse.redirect(new URL(allowed, request.url))
    }

    // Approved admin → department-scoped access
    if (user.role === 'admin' && user.isApproved) {
      const effectiveDept = user.pillarRole === 'digital' ? 'digital' : user.department
      if (pathname === '/admin' && effectiveDept) {
        return NextResponse.redirect(new URL(`/admin/${effectiveDept}`, request.url))
      }
      // Department admins can't access other departments
      if (effectiveDept) {
        const restrictedDepts = ['hr', 'finance', 'operations', 'marketing', 'digital']
        const targetDept = restrictedDepts.find(d => pathname.startsWith(`/admin/${d}`))
        if (targetDept && targetDept !== effectiveDept) {
          return NextResponse.redirect(new URL(`/admin/${effectiveDept}`, request.url))
        }
      }
      return NextResponse.next()
    }

    // Pending admin
    if (user.role === 'pending_admin' || (user.role === 'admin' && !user.isApproved)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Admin account pending approval' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard?pending=1', request.url))
    }

    // Not an internal user → redirect based on role
    if (pathname.startsWith('/api/')) {
      if (pathname.startsWith('/api/admin/projects/tasks')) {
        return NextResponse.next()
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const fallback = user.role === 'vendor' ? '/vendor' : '/dashboard'
    return NextResponse.redirect(new URL(fallback, request.url))
  }

  // ─── Vendor routes ─────────────────────────────────────────────
  if (pathname.startsWith('/vendor')) {
    if (user.role !== 'vendor' && user.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // ─── Dashboard (customer only) ──────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (INTERNAL_ROLES.includes(user.role) && user.role !== 'pending_admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (user.role === 'vendor') {
      return NextResponse.redirect(new URL('/vendor', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/projects/:path*',
    '/api/upload',
    '/api/vendor/:path*',
    '/api/chat/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/vendor',
    '/vendor/:path*',
  ],
}
