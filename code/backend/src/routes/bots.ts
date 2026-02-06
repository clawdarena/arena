import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../db'
import { authMiddleware, getAuthUser } from '../middleware/auth'
import { validate, getParsedBody } from '../middleware/validate'

export const botRoutes = new Hono()

// ============================================================
// POST /api/bots/register
// ============================================================

const registerBotSchema = z.object({
  bot_name: z.string().min(2).max(30),
  public_key: z.string().length(64).regex(/^[0-9a-f]+$/i).optional(),
})

botRoutes.post('/register', authMiddleware, validate(registerBotSchema), async (c) => {
  const { userId } = getAuthUser(c)
  const { bot_name, public_key } = getParsedBody<z.infer<typeof registerBotSchema>>(c)

  // Limit bots per user
  const botCount = await prisma.bot.count({ where: { user_id: userId } })
  if (botCount >= 5) {
    return c.json({ error: 'Maximum 5 bots per user', code: 'MAX_BOTS' }, 400)
  }

  const bot = await prisma.bot.create({
    data: {
      user_id: userId,
      name: bot_name,
      public_key: public_key?.toLowerCase() || null,
      base_hp: 100,
      base_attack: 15,
      base_defense: 10,
      base_speed: 10,
    },
  })

  return c.json({ bot }, 201)
})

// ============================================================
// GET /api/bots/:bot_id
// ============================================================

botRoutes.get('/:bot_id', authMiddleware, async (c) => {
  const { userId } = getAuthUser(c)
  const botId = c.req.param('bot_id')

  const bot = await prisma.bot.findFirst({
    where: { id: botId, user_id: userId },
    include: {
      accessories: { include: { item: true } },
      equipped_skills: { include: { skill: true } },
    },
  })

  if (!bot) {
    return c.json({ error: 'Bot not found', code: 'NOT_FOUND' }, 404)
  }

  return c.json({
    bot: {
      ...bot,
      accessories: bot.accessories.map((a) => a.item),
      skills: bot.equipped_skills.map((s) => ({
        slot: s.slot,
        skill_id: s.skill_id,
        skill: s.skill,
      })),
    },
  })
})

// ============================================================
// PATCH /api/bots/:bot_id — Update bot identity
// ============================================================

const updateBotSchema = z.object({
  name: z.string().min(2).max(30).regex(/^[a-zA-Z0-9_\- ]+$/, 'Letters, numbers, spaces, hyphens, underscores').optional(),
  avatar: z.string().min(1).max(8).optional(),   // Emoji (1-2 chars) or preset ID
  tagline: z.string().max(60).optional(),         // Short battle tagline
})

botRoutes.patch('/:bot_id', authMiddleware, validate(updateBotSchema), async (c) => {
  const { userId } = getAuthUser(c)
  const botId = c.req.param('bot_id')
  const updates = getParsedBody<z.infer<typeof updateBotSchema>>(c)

  const bot = await prisma.bot.findFirst({ where: { id: botId, user_id: userId } })
  if (!bot) {
    return c.json({ error: 'Bot not found', code: 'NOT_FOUND' }, 404)
  }

  // Filter out undefined values
  const data: Record<string, unknown> = {}
  if (updates.name !== undefined) data.name = updates.name
  if (updates.avatar !== undefined) data.avatar = updates.avatar
  if (updates.tagline !== undefined) data.tagline = updates.tagline

  if (Object.keys(data).length === 0) {
    return c.json({ error: 'No fields to update', code: 'NO_CHANGES' }, 400)
  }

  const updated = await prisma.bot.update({
    where: { id: botId },
    data,
  })

  return c.json({
    bot: {
      id: updated.id,
      name: updated.name,
      avatar: updated.avatar,
      tagline: updated.tagline,
    },
  })
})

// ============================================================
// POST /api/bots/equip
// ============================================================

const equipSchema = z.object({
  bot_id: z.string().uuid(),
  item_id: z.string().uuid(),
})

botRoutes.post('/equip', authMiddleware, validate(equipSchema), async (c) => {
  const { userId } = getAuthUser(c)
  const { bot_id, item_id } = getParsedBody<z.infer<typeof equipSchema>>(c)

  // Verify bot ownership
  const bot = await prisma.bot.findFirst({
    where: { id: bot_id, user_id: userId },
    include: { accessories: true },
  })
  if (!bot) {
    return c.json({ error: 'Bot not found', code: 'NOT_FOUND' }, 404)
  }

  // Verify item ownership
  const owned = await prisma.userInventory.findUnique({
    where: { user_id_item_id: { user_id: userId, item_id } },
    include: { item: true },
  })
  if (!owned) {
    return c.json({ error: 'Item not owned', code: 'NOT_OWNED' }, 403)
  }

  if (owned.item.category !== 'accessory' && owned.item.category !== 'skin') {
    return c.json({ error: 'Item cannot be equipped', code: 'INVALID_ITEM_TYPE' }, 400)
  }

  // Handle skin (replace existing)
  if (owned.item.category === 'skin') {
    await prisma.bot.update({
      where: { id: bot_id },
      data: { skin_id: item_id },
    })
    return c.json({ success: true, message: 'Skin equipped' })
  }

  // Handle accessory (max 3)
  if (bot.accessories.length >= 3) {
    return c.json({ error: 'Maximum 3 accessories equipped', code: 'MAX_ACCESSORIES' }, 400)
  }

  // Check if already equipped
  const alreadyEquipped = bot.accessories.find((a) => a.item_id === item_id)
  if (alreadyEquipped) {
    return c.json({ error: 'Item already equipped on this bot', code: 'ALREADY_EQUIPPED' }, 409)
  }

  await prisma.botAccessory.create({
    data: { bot_id, item_id },
  })

  return c.json({ success: true, message: 'Accessory equipped' })
})

// ============================================================
// POST /api/bots/unequip
// ============================================================

const unequipSchema = z.object({
  bot_id: z.string().uuid(),
  item_id: z.string().uuid(),
})

botRoutes.post('/unequip', authMiddleware, validate(unequipSchema), async (c) => {
  const { userId } = getAuthUser(c)
  const { bot_id, item_id } = getParsedBody<z.infer<typeof unequipSchema>>(c)

  const bot = await prisma.bot.findFirst({ where: { id: bot_id, user_id: userId } })
  if (!bot) {
    return c.json({ error: 'Bot not found', code: 'NOT_FOUND' }, 404)
  }

  const accessory = await prisma.botAccessory.findUnique({
    where: { bot_id_item_id: { bot_id, item_id } },
  })
  if (!accessory) {
    return c.json({ error: 'Item not equipped', code: 'NOT_EQUIPPED' }, 404)
  }

  await prisma.botAccessory.delete({ where: { id: accessory.id } })

  return c.json({ success: true, message: 'Accessory unequipped' })
})

// ============================================================
// POST /api/bots/equip-skill
// ============================================================

const equipSkillSchema = z.object({
  bot_id: z.string().uuid(),
  skill_id: z.string(),
  slot: z.number().int().min(1).max(2),
})

botRoutes.post('/equip-skill', authMiddleware, validate(equipSkillSchema), async (c) => {
  const { userId } = getAuthUser(c)
  const { bot_id, skill_id, slot } = getParsedBody<z.infer<typeof equipSkillSchema>>(c)

  const bot = await prisma.bot.findFirst({ where: { id: bot_id, user_id: userId } })
  if (!bot) {
    return c.json({ error: 'Bot not found', code: 'NOT_FOUND' }, 404)
  }

  // Check skill ownership
  const owned = await prisma.userSkill.findUnique({
    where: { user_id_skill_id: { user_id: userId, skill_id } },
  })
  if (!owned) {
    return c.json({ error: 'Skill not owned', code: 'NOT_OWNED' }, 403)
  }

  // Upsert skill slot
  await prisma.botSkill.upsert({
    where: { bot_id_slot: { bot_id, slot } },
    update: { skill_id },
    create: { bot_id, skill_id, slot },
  })

  return c.json({ success: true, message: `Skill equipped in slot ${slot}` })
})

// ============================================================
// POST /api/bots/unequip-skill
// ============================================================

const unequipSkillSchema = z.object({
  bot_id: z.string().uuid(),
  slot: z.number().int().min(1).max(2),
})

botRoutes.post('/unequip-skill', authMiddleware, validate(unequipSkillSchema), async (c) => {
  const { userId } = getAuthUser(c)
  const { bot_id, slot } = getParsedBody<z.infer<typeof unequipSkillSchema>>(c)

  const bot = await prisma.bot.findFirst({ where: { id: bot_id, user_id: userId } })
  if (!bot) {
    return c.json({ error: 'Bot not found', code: 'NOT_FOUND' }, 404)
  }

  await prisma.botSkill.deleteMany({ where: { bot_id, slot } })

  return c.json({ success: true, message: `Skill slot ${slot} cleared` })
})

// ============================================================
// POST /api/bots/allocate-stat
// ============================================================

const allocateStatSchema = z.object({
  bot_id: z.string().uuid(),
  stat: z.enum(['hp', 'attack', 'defense', 'speed']),
})

botRoutes.post('/allocate-stat', authMiddleware, validate(allocateStatSchema), async (c) => {
  const { userId } = getAuthUser(c)
  const { bot_id, stat } = getParsedBody<z.infer<typeof allocateStatSchema>>(c)

  const bot = await prisma.bot.findFirst({ where: { id: bot_id, user_id: userId } })
  if (!bot) {
    return c.json({ error: 'Bot not found', code: 'NOT_FOUND' }, 404)
  }

  // Check if bot has pending stat points (1 per level, level 1 has 0 pending)
  const statPointsUsed = (bot.base_hp - 100) + (bot.base_attack - 15) + (bot.base_defense - 10) + (bot.base_speed - 10)
  const statPointsAvailable = (bot.level - 1) * 2  // 2 points per level
  const pending = statPointsAvailable - statPointsUsed

  if (pending <= 0) {
    return c.json({ error: 'No stat points available', code: 'NO_STAT_POINTS' }, 400)
  }

  const statMap: Record<string, string> = {
    hp: 'base_hp',
    attack: 'base_attack',
    defense: 'base_defense',
    speed: 'base_speed',
  }

  const increment = stat === 'hp' ? 5 : 2  // HP gets +5, others get +2

  await prisma.bot.update({
    where: { id: bot_id },
    data: { [statMap[stat]]: { increment } },
  })

  return c.json({ success: true, message: `+${increment} ${stat}`, points_remaining: pending - 1 })
})
