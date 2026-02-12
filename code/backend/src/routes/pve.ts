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

// PvE bot skill loadouts by difficulty
export const PVE_BOT_SKILLS: Record<string, string[]> = {
  training_dummy: ['power_strike', 'firewall'],
  bronze_bot:     ['power_strike', 'firewall', 'scan'],
  silver_bot:     ['power_strike', 'firewall', 'sleep_bomb', 'scan'],
  gold_bot:       ['reasoning_burst', 'mirror_coat', 'emp_pulse', 'overclock'],
  platinum_bot:   ['berserker_rush', 'iron_fortress', 'time_bomb', 'virus'],
}

// PvE bot action generators — now uses skills
export function getPveAction(
  strategy: string,
  round: number,
  myHp: number,
  opponentHp: number,
  myEnergy?: number,
  myMaxHp?: number,
  cooldowns?: Map<string, number>,
  botId?: string
): { action: string; target: string | null; skill_id?: string } {
  const energy = myEnergy ?? 100
  const maxHp = myMaxHp ?? 100
  const cd = cooldowns ?? new Map()
  const skills = PVE_BOT_SKILLS[botId || ''] || []

  // Helper: check if skill is available (off cooldown + enough energy)
  const canUse = (id: string, cost: number) =>
    skills.includes(id) && (cd.get(id) || 0) <= 0 && energy >= cost

  switch (strategy) {
    case 'random': {
      // 30% chance to use a skill if available
      if (Math.random() < 0.3 && canUse('power_strike', 10)) {
        return { action: 'skill', target: 'opponent', skill_id: 'power_strike' }
      }
      if (Math.random() < 0.2 && canUse('firewall', 15)) {
        return { action: 'skill', target: null, skill_id: 'firewall' }
      }
      return Math.random() < 0.6
        ? { action: 'attack', target: 'opponent' }
        : { action: 'defend', target: null }
    }

    case 'attack_core': {
      // Aggressive — prefers power_strike, falls back to basic attack
      if (canUse('power_strike', 10) && Math.random() < 0.5) {
        return { action: 'skill', target: 'opponent', skill_id: 'power_strike' }
      }
      if (myHp < maxHp * 0.3 && canUse('firewall', 15)) {
        return { action: 'skill', target: null, skill_id: 'firewall' }
      }
      return { action: 'attack', target: 'opponent' }
    }

    case 'alternate': {
      // Alternates attack/defend with occasional skills
      if (round % 3 === 0 && canUse('sleep_bomb', 20)) {
        return { action: 'skill', target: 'opponent', skill_id: 'sleep_bomb' }
      }
      if (round % 2 === 1) {
        if (canUse('power_strike', 10) && Math.random() < 0.4) {
          return { action: 'skill', target: 'opponent', skill_id: 'power_strike' }
        }
        return { action: 'attack', target: 'opponent' }
      }
      if (canUse('firewall', 15) && Math.random() < 0.5) {
        return { action: 'skill', target: null, skill_id: 'firewall' }
      }
      return { action: 'defend', target: null }
    }

    case 'smart': {
      // Uses skills strategically
      if (myHp < maxHp * 0.25 && canUse('mirror_coat', 25)) {
        return { action: 'skill', target: null, skill_id: 'mirror_coat' }
      }
      if (round === 1 && canUse('overclock', 10)) {
        return { action: 'skill', target: null, skill_id: 'overclock' }
      }
      if (opponentHp > maxHp * 0.5 && canUse('emp_pulse', 15)) {
        return { action: 'skill', target: 'opponent', skill_id: 'emp_pulse' }
      }
      if (canUse('reasoning_burst', 30) && opponentHp < 40) {
        return { action: 'skill', target: 'opponent', skill_id: 'reasoning_burst' }
      }
      if (myHp < maxHp * 0.3) return { action: 'defend', target: null }
      return { action: 'attack', target: 'opponent' }
    }

    case 'adaptive': {
      // Most dangerous — adapts to situation
      const hpRatio = myHp / maxHp
      const oppHpRatio = opponentHp / (maxHp * 1.5) // approx

      // Opening: plant time bomb
      if (round <= 2 && canUse('time_bomb', 20)) {
        return { action: 'skill', target: 'opponent', skill_id: 'time_bomb' }
      }
      // Low HP: fortress up
      if (hpRatio < 0.3 && canUse('iron_fortress', 20)) {
        return { action: 'skill', target: null, skill_id: 'iron_fortress' }
      }
      // Apply virus for DOT pressure
      if (round >= 3 && canUse('virus', 15)) {
        return { action: 'skill', target: 'opponent', skill_id: 'virus' }
      }
      // Finish with berserker rush
      if (opponentHp < 35 && canUse('berserker_rush', 15)) {
        return { action: 'skill', target: 'opponent', skill_id: 'berserker_rush' }
      }
      // Otherwise play safe
      if (hpRatio < 0.4) return { action: 'defend', target: null }
      return { action: 'attack', target: 'opponent' }
    }

    default:
      return { action: 'attack', target: 'opponent' }
  }
}
