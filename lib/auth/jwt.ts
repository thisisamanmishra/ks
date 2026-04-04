import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export interface TokenPayload extends JWTPayload {
  userId: number
  email: string
  role: string
  department: string | null
  isApproved: boolean
  pillarRole?: string | null
}

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || 'karyasaarthi-access-secret-change-me')
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'karyasaarthi-refresh-secret-change-me')

export async function signAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(ACCESS_SECRET)
}

export async function signRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(REFRESH_SECRET)
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET)
    return payload as TokenPayload
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET)
    return payload as TokenPayload
  } catch {
    return null
  }
}
