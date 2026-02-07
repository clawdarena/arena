import { Hono } from 'hono'
import { prisma } from '../db'

export const playerRoutes = new Hono()

// ============================================================
// GET /api/players/:username — Public player profile
// ============================================================

playerRoutes.get('/:username', async (c) => {
  const username = c.req.param('username')

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      created_at: true,
      current_elo: true,
      peak_elo: true,
      wins: true,
      losses: true,
      draws: true,
      bots: {
        take: 1,
        orderBy: { created_at: 'asc' },
        select: {
          id: true,
          name: true,
          avatar: true,
          tagline: true,
          level: true,
          xp: true,
          base_hp: true,
          base_attack: true,
          base_defense: true,
          base_speed: true,
        },
      },
    },
  })

  if (!user) {
    return c.json({ error: 'Player not found', code: 'NOT_FOUND' }, 404)
  }

  const bot = user.bots[0] || null
  const totalMatches = user.wins + user.losses + user.draws
  const winRate = totalMatches > 0 ? user.wins / totalMatches : 0

  // Fetch recent matches
  let recentMatches: any[] = []
  if (bot) {
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ bot1_id: bot.id }, { bot2_id: bot.id }],
        status: 'completed',
      },
      orderBy: { created_at: 'desc' },
      take: 10,
      select: {
        id: true,
        match_type: true,
        winner_id: true,
        rounds_fought: true,
        created_at: true,
        bot1_id: true,
        bot2_id: true,
        bot1_elo_before: true,
        bot1_elo_after: true,
        bot2_elo_before: true,
        bot2_elo_after: true,
        bot1: { select: { id: true, name: true } },
        bot2: { select: { id: true, name: true } },
      },
    })

    recentMatches = matches.map((m) => {
      const isBot1 = m.bot1_id === bot.id
      const opponent = isBot1 ? m.bot2 : m.bot1
      const myEloBefore = isBot1 ? m.bot1_elo_before : m.bot2_elo_before
      const myEloAfter = isBot1 ? m.bot1_elo_after : m.bot2_elo_after

      let result: 'win' | 'loss' | 'draw' = 'draw'
      if (m.winner_id === bot.id) result = 'win'
      else if (m.winner_id !== null) result = 'loss'

      return {
        id: m.id,
        result,
        opponent: { name: opponent.name },
        match_type: m.match_type,
        rounds_fought: m.rounds_fought,
        elo_change: (myEloAfter || 0) - (myEloBefore || 0),
        created_at: m.created_at,
      }
    })
  }

  // Calculate current streak
  let streak = 0
  let streakType: 'win' | 'loss' | null = null
  for (const m of recentMatches) {
    if (streakType === null) {
      streakType = m.result === 'draw' ? null : m.result
      if (streakType) streak = 1
    } else if (m.result === streakType) {
      streak++
    } else {
      break
    }
  }

  return c.json({
    user: {
      id: user.id,
      username: user.username,
      created_at: user.created_at,
    },
    bot,
    stats: {
      elo: user.current_elo,
      peak_elo: user.peak_elo,
      wins: user.wins,
      losses: user.losses,
      draws: user.draws,
      win_rate: winRate,
      matches_played: totalMatches,
      streak: streakType === 'win' ? streak : streakType === 'loss' ? -streak : 0,
    },
    recent_matches: recentMatches,
  })
})
