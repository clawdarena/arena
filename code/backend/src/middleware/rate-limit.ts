import { Context, Next } from 'hono'

interface RateLimitConfig {
  windowMs: number
  max: number
  message: string
  standardHeaders?: boolean
  legacyHeaders?: boolean
}

interface RateLimitStore {
  [ip: string]: {
    count: number
    resetTime: number
  }
}

/**
 * Create a Hono-compatible rate limiter middleware
 */
function createRateLimiter(config: RateLimitConfig) {
  const store: RateLimitStore = {}

  // Clean up old entries periodically
  setInterval(() => {
    const now = Date.now()
    Object.keys(store).forEach(ip => {
      if (store[ip].resetTime < now) {
        delete store[ip]
      }
    })
  }, config.windowMs)

  return async (c: Context, next: Next) => {
    // Get client IP from various headers
    const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
               c.req.header('x-real-ip') ||
               c.req.header('cf-connecting-ip') ||
               'unknown'

    const now = Date.now()

    // Initialize or reset if window expired
    if (!store[ip] || store[ip].resetTime < now) {
      store[ip] = {
        count: 0,
        resetTime: now + config.windowMs
      }
    }

    // Increment request count
    store[ip].count++

    const current = store[ip].count
    const resetTime = store[ip].resetTime

    // Set rate limit headers
    if (config.standardHeaders !== false) {
      c.header('RateLimit-Limit', config.max.toString())
      c.header('RateLimit-Remaining', Math.max(0, config.max - current).toString())
      c.header('RateLimit-Reset', new Date(resetTime).toISOString())
    }

    if (config.legacyHeaders !== false) {
      c.header('X-RateLimit-Limit', config.max.toString())
      c.header('X-RateLimit-Remaining', Math.max(0, config.max - current).toString())
      c.header('X-RateLimit-Reset', Math.floor(resetTime / 1000).toString())
    }

    // Check if limit exceeded
    if (current > config.max) {
      const retryAfter = Math.ceil((resetTime - now) / 1000)
      c.header('Retry-After', retryAfter.toString())
      
      return c.json({
        error: config.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter
      }, 429)
    }

    await next()
  }
}

// Auth endpoints (login, register)
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
})

// API endpoints (general)
export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests from this IP, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
})

// Shop/purchase endpoints (prevent spam purchases)
export const purchaseLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 purchases per minute
  message: 'Too many purchase attempts, please wait',
  standardHeaders: true,
  legacyHeaders: false,
})
