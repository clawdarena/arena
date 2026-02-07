import { Hono } from 'hono'
import { prisma } from '../db'
import { authMiddleware, getAuthUser } from '../middleware/auth'

export const matchRoutes = new Hono()

// ============================================================
// GET /api/matches/history
// ============================================================

matchRoutes.get('/history', authMiddleware, async (c) => {
  const { userId } = getAuthUser(c)
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100)
  const offset = parseInt(c.req.query('offset') || '0')
  const botId = c.req.query('bot_id')

  // Get user's bot IDs
  const userBots = await prisma.bot.findMany({
    where: { user_id: userId },
    select: { id: true },
  })
  const botIds = botId ? [botId] : userBots.map((b) => b.id)

  const where = {
    status: 'completed',
    OR: [
      { bot1_id: { in: botIds } },
      { bot2_id: { in: botIds } },
    ],
  }

  const [matches, total] = await Promise.all([
    prisma.match.findMany({
      where,
      include: {
        bot1: { select: { id: true, name: true, user_id: true } },
        bot2: { select: { id: true, name: true, user_id: true } },
      },
      orderBy: { completed_at: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.match.count({ where }),
  ])

  return c.json({
    matches: matches.map((m) => {
      const isBot1 = botIds.includes(m.bot1_id)
      const myBot = isBot1 ? m.bot1 : m.bot2
      const opponent = isBot1 ? m.bot2 : m.bot1

      return {
        id: m.id,
        created_at: m.created_at,
        match_type: m.match_type,
        my_bot: {
          id: myBot.id,
          name: myBot.name,
          elo_before: isBot1 ? m.bot1_elo_before : m.bot2_elo_before,
          elo_after: isBot1 ? m.bot1_elo_after : m.bot2_elo_after,
        },
        opponent: {
          id: opponent.id,
          name: opponent.name,
          elo_before: isBot1 ? m.bot2_elo_before : m.bot1_elo_before,
          elo_after: isBot1 ? m.bot2_elo_after : m.bot1_elo_after,
        },
        winner_id: m.winner_id,
        rounds_fought: m.rounds_fought,
        duration_seconds: m.duration_seconds,
        replay: m.replay,
      }
    }),
    total,
    has_more: offset + limit < total,
  })
})

// ============================================================
// GET /api/matches/active — Live matches for spectators
// ============================================================

matchRoutes.get('/active', async (c) => {
  const matches = await prisma.match.findMany({
    where: {
      status: 'in_progress',
    },
    include: {
      bot1: { select: { id: true, name: true, base_hp: true } },
      bot2: { select: { id: true, name: true, base_hp: true } },
    },
    orderBy: { started_at: 'desc' },
    take: 20,
  })

  return c.json({
    matches: matches.map((m) => ({
      id: m.id,
      match_type: m.match_type,
      bot1: {
        name: m.bot1.name,
        hp: m.bot1.base_hp,   // Current HP would come from Redis in real-time
      },
      bot2: {
        name: m.bot2.name,
        hp: m.bot2.base_hp,
      },
      round: m.rounds_fought || 1,
      started_at: m.started_at,
    })),
    total: matches.length,
  })
})

// ============================================================
// GET /api/matches/:match_id
// ============================================================

matchRoutes.get('/:match_id', async (c) => {
  const matchId = c.req.param('match_id')

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      bot1: { select: { id: true, name: true, base_hp: true, base_attack: true, base_defense: true, base_speed: true } },
      bot2: { select: { id: true, name: true, base_hp: true, base_attack: true, base_defense: true, base_speed: true } },
    },
  })

  if (!match) {
    return c.json({ error: 'Match not found', code: 'NOT_FOUND' }, 404)
  }

  return c.json({
    id: match.id,
    match_type: match.match_type,
    status: match.status,
    bot1: match.bot1,
    bot2: match.bot2,
    winner_id: match.winner_id,
    bot1_elo_before: match.bot1_elo_before,
    bot1_elo_after: match.bot1_elo_after,
    bot2_elo_before: match.bot2_elo_before,
    bot2_elo_after: match.bot2_elo_after,
    rounds_fought: match.rounds_fought,
    duration_seconds: match.duration_seconds,
    entry_fee: match.entry_fee,
    winner_payout: match.winner_payout,
    replay: match.replay,
    started_at: match.started_at,
    completed_at: match.completed_at,
    created_at: match.created_at,
  })
})
