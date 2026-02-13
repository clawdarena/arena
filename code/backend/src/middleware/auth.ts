import { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'

// AUDIT FIX: Remove insecure JWT fallback and fail fast when JWT_SECRET is missing/weak
const _secret = process.env.JWT_SECRET
if (!_secret || _secret.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long')
}
const JWT_SECRET: string = _secret

export interface JWTPayload {
  userId: string
  username: string
}

const AUTH_USER_KEY = '__authUser'

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export function getAuthUser(c: Context): JWTPayload {
  return (c as any)[AUTH_USER_KEY] as JWTPayload
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const payload = verifyToken(token)
    ;(c as any)[AUTH_USER_KEY] = payload
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' }, 401)
  }
}
