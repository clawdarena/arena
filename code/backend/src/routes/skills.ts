import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../db'
import { authMiddleware, getAuthUser } from '../middleware/auth'
import { validate, getParsedBody } from '../middleware/validate'
import { recordTransaction } from '../utils/credits'
import { SKILL_DEFS } from '../utils/combat'

export const skillRoutes = new Hono()

// ============================================================
// GET /api/skills
// ============================================================

skillRoutes.get('/', async (c) => {
  const skills = await prisma.skill.findMany({ orderBy: { price: 'asc' } })

  // Enrich with unlock level from combat engine
  const enriched = skills.map(s => ({
    ...s,
    unlock_level: SKILL_DEFS[s.id]?.unlockLevel ?? 1,
    category: SKILL_DEFS[s.id]?.category ?? 'unknown',
    energy_cost: SKILL_DEFS[s.id]?.energyCost ?? 20,
  }))

  return c.json({ skills: enriched })
})

// ============================================================
// GET /api/skills/owned
// ============================================================

skillRoutes.get('/owned', authMiddleware, async (c) => {
  const { userId } = getAuthUser(c)

  const owned = await prisma.userSkill.findMany({
    where: { user_id: userId },
    include: { skill: true },
    orderBy: { acquired_at: 'desc' },
  })

  return c.json({
    skills: owned.map((o) => ({
      ...o.skill,
      acquired_at: o.acquired_at,
    })),
  })
})

// ============================================================
// POST /api/skills/purchase
// ============================================================

const purchaseSchema = z.object({
  skill_id: z.string(),
})

skillRoutes.post('/purchase', authMiddleware, validate(purchaseSchema), async (c) => {
  const { userId } = getAuthUser(c)
  const { skill_id } = getParsedBody<z.infer<typeof purchaseSchema>>(c)

  const skill = await prisma.skill.findUnique({ where: { id: skill_id } })
  if (!skill) {
    return c.json({ error: 'Skill not found', code: 'NOT_FOUND' }, 404)
  }

  if (skill.price === 0) {
    return c.json({ error: 'Starter skills cannot be purchased — they are free', code: 'FREE_SKILL' }, 400)
  }

  // Check level requirement
  const skillDef = SKILL_DEFS[skill_id]
  if (skillDef?.unlockLevel) {
    // Need at least one bot at the required level
    const maxLevelBot = await prisma.bot.findFirst({
      where: { user_id: userId },
      orderBy: { level: 'desc' },
      select: { level: true },
    })
    if (!maxLevelBot || maxLevelBot.level < skillDef.unlockLevel) {
      return c.json({
        error: `Requires bot level ${skillDef.unlockLevel}. Your highest is ${maxLevelBot?.level || 1}.`,
        code: 'LEVEL_TOO_LOW',
        required_level: skillDef.unlockLevel,
      }, 403)
    }
  }

  // Check if already owned
  const existing = await prisma.userSkill.findUnique({
    where: { user_id_skill_id: { user_id: userId, skill_id } },
  })
  if (existing) {
    return c.json({ error: 'Skill already owned', code: 'ALREADY_OWNED' }, 409)
  }

  // Check credits
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.credits < skill.price) {
    return c.json({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' }, 400)
  }

  // Purchase
  await recordTransaction(userId, -skill.price, 'skill_purchase', skill_id)

  await prisma.userSkill.create({
    data: { user_id: userId, skill_id },
  })

  return c.json({
    success: true,
    skill,
    new_balance: user.credits - skill.price,
  })
})
