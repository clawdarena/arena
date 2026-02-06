import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { connectDB } from './db'
import { connectRedis } from './redis'
import { authRoutes } from './routes/auth'

const app = new Hono()

// ============================================================
// Middleware
// ============================================================

app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}))

// ============================================================
// Routes
// ============================================================

// Health check
app.get('/', (c) => c.json({ status: 'ok', service: 'clawdarena-api', version: '0.2.0' }))
app.get('/health', (c) => c.json({ status: 'ok' }))

// API routes
app.route('/api/auth', authRoutes)

// TODO: Add more routes
// app.route('/api/shop', shopRoutes)
// app.route('/api/bots', botRoutes)
// app.route('/api/matchmaking', matchmakingRoutes)
// app.route('/api/matches', matchRoutes)
// app.route('/api/leaderboard', leaderboardRoutes)
// app.route('/api/skills', skillRoutes)
// app.route('/api/pve', pveRoutes)

// ============================================================
// Error handling
// ============================================================

app.notFound((c) => c.json({ error: 'Not found', code: 'NOT_FOUND' }, 404))

app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
})

// ============================================================
// Start
// ============================================================

const PORT = parseInt(process.env.PORT || '3001')

async function start() {
  await connectDB()
  await connectRedis()

  serve({
    fetch: app.fetch,
    port: PORT,
  })

  console.log(`🚀 ClawdArena API running on http://localhost:${PORT}`)
  console.log(`📖 Routes:`)
  console.log(`   POST /api/auth/register`)
  console.log(`   POST /api/auth/login`)
  console.log(`   POST /api/auth/login-username`)
  console.log(`   GET  /api/auth/me`)
}

start().catch(console.error)
