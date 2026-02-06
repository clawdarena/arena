import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { Server as SocketServer } from 'socket.io'
import { connectDB } from './db'
import { connectRedis } from './redis'
import { authRoutes } from './routes/auth'
import { shopRoutes } from './routes/shop'
import { botRoutes } from './routes/bots'
import { skillRoutes } from './routes/skills'
import { matchRoutes } from './routes/matches'
import { leaderboardRoutes } from './routes/leaderboard'
import { pveRoutes } from './routes/pve'
import { gauntletRoutes } from './routes/gauntlet'
import { setupMatchmaking } from './ws/matchmaking'

const app = new Hono()

// ============================================================
// Middleware
// ============================================================

app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://5.252.22.126:3000', 'https://clawdarena-api-production.up.railway.app'],
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
app.route('/api/shop', shopRoutes)
app.route('/api/bots', botRoutes)
app.route('/api/skills', skillRoutes)
app.route('/api/matches', matchRoutes)
app.route('/api/leaderboard', leaderboardRoutes)
app.route('/api/pve', pveRoutes)
app.route('/api/gauntlet', gauntletRoutes)
app.route('/api/inventory', shopRoutes)  // /api/inventory reuses shop's inventory endpoint

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

  const server = serve({
    fetch: app.fetch,
    port: PORT,
  })

  // WebSocket server (same port)
  const io = new SocketServer(server, {
    cors: {
      origin: ['http://localhost:3000'],
      credentials: true,
    },
  })

  setupMatchmaking(io)

  console.log(`🚀 ClawdArena API running on http://localhost:${PORT}`)
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`)
  console.log(`📖 API Routes:`)
  console.log(`   Auth:        POST /api/auth/register, /login, GET /me`)
  console.log(`   Shop:        GET /api/shop/items, POST /purchase, GET /inventory`)
  console.log(`   Bots:        POST /api/bots/register, /equip, /equip-skill, /allocate-stat`)
  console.log(`   Skills:      GET /api/skills, /owned, POST /purchase`)
  console.log(`   Matches:     GET /api/matches/history, /:match_id`)
  console.log(`   Leaderboard: GET /api/leaderboard`)
  console.log(`   PvE:         GET /api/pve/bots, POST /start`)
  console.log(`   Gauntlet:    GET /api/gauntlet, POST /complete`)
  console.log(`   WebSocket:   join_queue, leave_queue, ready, combat_action, invite`)
}

start().catch(console.error)
