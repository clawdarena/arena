import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../db'
import { authMiddleware, getAuthUser } from '../middleware/auth'
import { validate, getParsedBody } from '../middleware/validate'
import { recordTransaction } from '../utils/credits'
import { resolveCombat, type BotCombatState } from '../utils/combat'

export const pveRoutes = new Hono()

// PvE bot definitions
const PVE_BOTS = [
  { id: 'training_dummy', name: 'Training Dummy', difficulty: 'tutorial', hp: 50, attack: 5, defense: 5, speed: 5, strategy: 'random', reward: 10, description: 'Perfect for learning the basics' },
  { id: 'bronze_bot', name: 'Bronze Bot', difficulty: 'easy', hp: 80, attack: 10, defense: 8, speed: 8, strategy: 'attack_core', reward: 25, description: 'Attacks core every round' },
  { id: 'silver_bot', name: 'Silver Bot', difficulty: 'medium', hp: 100, attack: 15, defense: 12, speed: 10, strategy: 'alternate', reward: 50, description: 'Alternates attack and defend' },
  { id: 'gold_bot', name: 'Gold Bot', difficulty: 'hard', hp: 120, attack: 20, defense: 15, speed: 15, strategy: 'smart', reward: 100, description: 'Uses skills and targets processor' },
  { id: 'platinum_bot', name: 'Platinum Bot', difficulty: 'expert', hp: 150, attack: 25, defense: 20, speed: 20, strategy: 'adaptive', reward: 200, description: 'Adapts to player patterns' },
]

// ============================================================
// GET /api/pve/bots
// ============================================================

pveRoutes.get('/bots', (c) => {
  return c.json({
    bots: PVE_BOTS.map((b) => ({
      id: b.id,
      name: b.name,
      difficulty: b.difficulty,
      hp: b.hp,
      attack: b.attack,
      defense: b.defense,
      speed: b.speed,
      estimated_elo: { tutorial: 800, easy: 1000, medium: 1200, hard: 1400, expert: 1600 }[b.difficulty],
      reward: b.reward,
      description: b.description,
    })),
  })
})

// ============================================================
// POST /api/pve/start
// ============================================================

const startPveSchema = z.object({
  bot_id: z.string().uuid(),
  ai_bot_id: z.string(),
})

pveRoutes.post('/start', authMiddleware, validate(startPveSchema), async (c) => {
  const { userId } = getAuthUser(c)
  const { bot_id, ai_bot_id } = getParsedBody<z.infer<typeof startPveSchema>>(c)

  // Verify bot ownership
  const userBot = await prisma.bot.findFirst({
    where: { id: bot_id, user_id: userId },
    include: {
      accessories: { include: { item: true } },
      equipped_skills: { include: { skill: true } },
    },
  })
  if (!userBot) {
    return c.json({ error: 'Bot not found', code: 'NOT_FOUND' }, 404)
  }

  // Find PvE bot
  const pveBot = PVE_BOTS.find((b) => b.id === ai_bot_id)
  if (!pveBot) {
    return c.json({ error: 'AI bot not found', code: 'NOT_FOUND' }, 404)
  }

  return c.json({
    match_id: `pve_${Date.now()}`,
    message: 'PvE match ready. Connect via WebSocket to play.',
    ai_opponent: {
      id: pveBot.id,
      name: pveBot.name,
      difficulty: pveBot.difficulty,
      hp: pveBot.hp,
      attack: pveBot.attack,
      defense: pveBot.defense,
      speed: pveBot.speed,
    },
    your_bot: {
      id: userBot.id,
      name: userBot.name,
      hp: userBot.base_hp + userBot.accessories.reduce((sum, a) => sum + a.item.hp_bonus, 0),
      attack: userBot.base_attack + userBot.accessories.reduce((sum, a) => sum + a.item.attack_bonus, 0),
      defense: userBot.base_defense + userBot.accessories.reduce((sum, a) => sum + a.item.defense_bonus, 0),
      speed: userBot.base_speed + userBot.accessories.reduce((sum, a) => sum + a.item.speed_bonus, 0),
    },
  })
})

// PvE bot action generators
export function getPveAction(strategy: string, round: number, myHp: number, opponentHp: number): { action: string; target: string | null } {
  switch (strategy) {
    case 'random':
      const actions = ['attack', 'defend']
      const targets = ['core', 'armor', 'processor']
      return {
        action: actions[Math.floor(Math.random() * actions.length)],
        target: targets[Math.floor(Math.random() * targets.length)],
      }
    case 'attack_core':
      return { action: 'attack', target: 'core' }
    case 'alternate':
      return round % 2 === 1
        ? { action: 'attack', target: 'core' }
        : { action: 'defend', target: null }
    case 'smart':
      if (myHp < 30) return { action: 'defend', target: null }
      if (opponentHp < 20) return { action: 'attack', target: 'processor' }
      return { action: 'attack', target: round % 3 === 0 ? 'processor' : 'core' }
    case 'adaptive':
      if (myHp < opponentHp * 0.3) return { action: 'defend', target: null }
      if (opponentHp < 30) return { action: 'attack', target: 'processor' }
      if (round <= 2) return { action: 'attack', target: 'armor' }
      return { action: 'attack', target: round % 2 === 0 ? 'processor' : 'core' }
    default:
      return { action: 'attack', target: 'core' }
  }
}
