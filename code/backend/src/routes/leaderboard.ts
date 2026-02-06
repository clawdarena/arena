import { Hono } from 'hono'
import { prisma } from '../db'
import { authMiddleware, getAuthUser } from '../middleware/auth'

export const leaderboardRoutes = new Hono()

// ============================================================
// GET /api/leaderboard
// ============================================================

leaderboardRoutes.get('/', async (c) => {
  const timeframe = c.req.query('timeframe') || 'all_time'
  const limit = Math.min(parseInt(c.req.query('limit') || '100'), 100)
  const offset = parseInt(c.req.query('offset') || '0')

  // For MVP, just use all_time ELO ranking
  const leaderboard = await prisma.user.findMany({
    where: { total_matches: { gt: 0 } },
    select: {
      id: true,
      username: true,
      current_elo: true,
      peak_elo: true,
      total_matches: true,
      wins: true,
      losses: true,
      draws: true,
    },
    orderBy: { current_elo: 'desc' },
    take: limit,
    skip: offset,
  })

  const total = await prisma.user.count({ where: { total_matches: { gt: 0 } } })

  // Try to get requester's rank
  let myRank: number | null = null
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const { verifyToken } = await import('../middleware/auth')
      const payload = verifyToken(authHeader.slice(7))
      const user = await prisma.user.findUnique({ where: { id: payload.userId } })
      if (user && user.total_matches > 0) {
        const aboveMe = await prisma.user.count({
          where: {
            total_matches: { gt: 0 },
            current_elo: { gt: user.current_elo },
          },
        })
        myRank = aboveMe + 1
      }
    } catch {
      // Not authenticated, no rank
    }
  }

  return c.json({
    leaderboard: leaderboard.map((u, i) => ({
      rank: offset + i + 1,
      user: { id: u.id, username: u.username },
      elo: u.current_elo,
      peak_elo: u.peak_elo,
      wins: u.wins,
      losses: u.losses,
      draws: u.draws,
      win_rate: u.total_matches > 0 ? Math.round((u.wins / u.total_matches) * 100) / 100 : 0,
    })),
    my_rank: myRank,
    total_players: total,
  })
})
