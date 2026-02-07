import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../db'
import { authMiddleware, getAuthUser } from '../middleware/auth'
import { validate, getParsedBody } from '../middleware/validate'
import { recordTransaction } from '../utils/credits'

export const gauntletRoutes = new Hono()

// ============================================================
// Gauntlet Tier Definitions
// ============================================================

export interface GauntletTier {
  tier: number
  name: string
  description: string
  opponent: string      // PvE bot ID to fight
  winCondition: string  // Human-readable
  criteria: {
    mustWin: boolean
    maxRounds?: number
    minHpRemaining?: number  // percentage (0-100)
    noSkills?: boolean
    maxDamageTaken?: number
  }
  reward: {
    stat: 'hp' | 'attack' | 'defense' | 'speed'
    amount: number
    credits: number
  }
}

export const GAUNTLET_TIERS: GauntletTier[] = [
  {
    tier: 1,
    name: 'First Steps',
    description: 'Beat the Training Dummy to prove your bot works.',
    opponent: 'training_dummy',
    winCondition: 'Defeat Training Dummy',
    criteria: { mustWin: true },
    reward: { stat: 'hp', amount: 5, credits: 50 },
  },
  {
    tier: 2,
    name: 'Offensive Power',
    description: 'Beat Bronze Bot in 8 rounds or fewer.',
    opponent: 'bronze_bot',
    winCondition: 'Win in ≤8 rounds',
    criteria: { mustWin: true, maxRounds: 8 },
    reward: { stat: 'attack', amount: 3, credits: 75 },
  },
  {
    tier: 3,
    name: 'Pure Tactics',
    description: 'Beat Silver Bot without using any skills.',
    opponent: 'silver_bot',
    winCondition: 'Win without skills',
    criteria: { mustWin: true, noSkills: true },
    reward: { stat: 'defense', amount: 3, credits: 100 },
  },
  {
    tier: 4,
    name: 'Iron Wall',
    description: 'Beat Gold Bot while taking 30 or less total damage.',
    opponent: 'gold_bot',
    winCondition: 'Win taking ≤30 damage',
    criteria: { mustWin: true, maxDamageTaken: 30 },
    reward: { stat: 'speed', amount: 3, credits: 150 },
  },
  {
    tier: 5,
    name: 'Arena Champion',
    description: 'Beat the Platinum Bot. No restrictions — just win.',
    opponent: 'platinum_bot',
    winCondition: 'Defeat Platinum Bot',
    criteria: { mustWin: true },
    reward: { stat: 'hp', amount: 10, credits: 300 },
  },
]

// ============================================================
// GET /api/gauntlet
// ============================================================

gauntletRoutes.get('/', authMiddleware, async (c) => {
  const { userId } = getAuthUser(c)
  const botId = c.req.query('bot_id')

  let progress: { tier: number; completed_at: Date }[] = []
  if (botId) {
    // Verify ownership
    const bot = await prisma.bot.findFirst({ where: { id: botId, user_id: userId } })
    if (!bot) return c.json({ error: 'Bot not found', code: 'NOT_FOUND' }, 404)

    const completions = await prisma.gauntletProgress.findMany({
      where: { bot_id: botId },
      orderBy: { tier: 'asc' },
    })
    progress = completions.map((p) => ({ tier: p.tier, completed_at: p.completed_at }))
  }

  const completedTiers = new Set(progress.map((p) => p.tier))

  return c.json({
    tiers: GAUNTLET_TIERS.map((t) => ({
      tier: t.tier,
      name: t.name,
      description: t.description,
      opponent: t.opponent,
      win_condition: t.winCondition,
      reward: t.reward,
      completed: completedTiers.has(t.tier),
      completed_at: progress.find((p) => p.tier === t.tier)?.completed_at || null,
      locked: t.tier > 1 && !completedTiers.has(t.tier - 1),  // Must complete previous tier
    })),
    total_completed: completedTiers.size,
    total_tiers: GAUNTLET_TIERS.length,
  })
})

// ============================================================
// POST /api/gauntlet/complete
// Called after a PvE match to check if gauntlet criteria was met
// ============================================================

const completeSchema = z.object({
  bot_id: z.string().uuid(),
  tier: z.number().int().min(1).max(5),
  match_data: z.object({
    won: z.boolean(),
    rounds_fought: z.number(),
    hp_remaining: z.number(),
    max_hp: z.number(),
    damage_taken: z.number(),
    skills_used: z.number(),
    replay: z.array(z.any()).optional(),
  }),
})

gauntletRoutes.post('/complete', authMiddleware, validate(completeSchema), async (c) => {
  const { userId } = getAuthUser(c)
  const { bot_id, tier, match_data } = getParsedBody<z.infer<typeof completeSchema>>(c)

  // Verify bot ownership
  const bot = await prisma.bot.findFirst({ where: { id: bot_id, user_id: userId } })
  if (!bot) return c.json({ error: 'Bot not found', code: 'NOT_FOUND' }, 404)

  // Check not already completed
  const existing = await prisma.gauntletProgress.findUnique({
    where: { bot_id_tier: { bot_id, tier } },
  })
  if (existing) return c.json({ error: 'Tier already completed', code: 'ALREADY_COMPLETED' }, 409)

  // Check previous tier completed (except tier 1)
  if (tier > 1) {
    const prevTier = await prisma.gauntletProgress.findUnique({
      where: { bot_id_tier: { bot_id, tier: tier - 1 } },
    })
    if (!prevTier) return c.json({ error: 'Complete previous tier first', code: 'TIER_LOCKED' }, 400)
  }

  // Validate criteria
  const gauntletTier = GAUNTLET_TIERS.find((t) => t.tier === tier)
  if (!gauntletTier) return c.json({ error: 'Invalid tier', code: 'INVALID_TIER' }, 400)

  const criteria = gauntletTier.criteria
  const failures: string[] = []

  if (criteria.mustWin && !match_data.won) {
    failures.push('Must win the match')
  }
  if (criteria.maxRounds && match_data.rounds_fought > criteria.maxRounds) {
    failures.push(`Must win in ${criteria.maxRounds} rounds or fewer (took ${match_data.rounds_fought})`)
  }
  if (criteria.noSkills && match_data.skills_used > 0) {
    failures.push('Must not use any skills')
  }
  if (criteria.maxDamageTaken !== undefined && match_data.damage_taken > criteria.maxDamageTaken) {
    failures.push(`Must take ${criteria.maxDamageTaken} or less damage (took ${match_data.damage_taken})`)
  }

  if (failures.length > 0) {
    return c.json({
      success: false,
      message: 'Gauntlet criteria not met',
      failures,
    })
  }

  // Record completion
  await prisma.gauntletProgress.create({
    data: { bot_id, tier },
  })

  // Apply stat reward
  const reward = gauntletTier.reward
  const statMap: Record<string, string> = {
    hp: 'base_hp',
    attack: 'base_attack',
    defense: 'base_defense',
    speed: 'base_speed',
  }

  await prisma.bot.update({
    where: { id: bot_id },
    data: { [statMap[reward.stat]]: { increment: reward.amount } },
  })

  // Credit reward
  if (reward.credits > 0) {
    await recordTransaction(userId, reward.credits, 'gauntlet_reward', `tier_${tier}`)
  }

  return c.json({
    success: true,
    message: `Gauntlet Tier ${tier} "${gauntletTier.name}" completed!`,
    reward: {
      stat: `+${reward.amount} ${reward.stat}`,
      credits: reward.credits,
    },
  })
})
