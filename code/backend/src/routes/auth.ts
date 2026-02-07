import { Hono } from 'hono'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../db'
import { signToken, authMiddleware, getAuthUser } from '../middleware/auth'
import { validate, getParsedBody } from '../middleware/validate'
import { isValidPublicKey } from '../utils/crypto'
import { recordTransaction } from '../utils/credits'

export const authRoutes = new Hono()

// ============================================================
// Schemas
// ============================================================

const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric + underscore'),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  public_key: z.string().length(64).regex(/^[0-9a-f]+$/i, 'Must be 64 hex chars'),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const loginUsernameSchema = z.object({
  username: z.string(),
})

// ============================================================
// POST /api/auth/register
// ============================================================

authRoutes.post('/register', validate(registerSchema), async (c) => {
  const { username, email, password, public_key } = getParsedBody<z.infer<typeof registerSchema>>(c)

  // Validate public key format
  if (!isValidPublicKey(public_key)) {
    return c.json({ error: 'Invalid Ed25519 public key', code: 'INVALID_PUBLIC_KEY' }, 400)
  }

  // Check uniqueness
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  })

  if (existingUser) {
    if (existingUser.username === username) {
      return c.json({ error: 'Username already taken', code: 'USERNAME_TAKEN' }, 409)
    }
    return c.json({ error: 'Email already registered', code: 'EMAIL_TAKEN' }, 409)
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 12)

  // Create user with default bot
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password_hash,
      public_key: public_key.toLowerCase(),
      credits: 0,
      current_elo: 1200,
      peak_elo: 1200,
      bots: {
        create: {
          name: `${username}Bot`,
          base_hp: 100,
          base_attack: 15,
          base_defense: 10,
          base_speed: 10,
        },
      },
    },
    include: { bots: true },
  })

  // Record welcome bonus
  await recordTransaction(user.id, 200, 'welcome_bonus')

  // Assign starter skills
  const starterSkills = ['power_strike', 'shield_wall', 'overclock', 'scan']
  await prisma.userSkill.createMany({
    data: starterSkills.map((skill_id) => ({
      user_id: user.id,
      skill_id,
    })),
    skipDuplicates: true,
  })

  // Generate JWT
  const token = signToken({ userId: user.id, username: user.username })

  return c.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      credits: 200,  // welcome bonus applied above
      elo: user.current_elo,
      created_at: user.created_at,
    },
    bot: user.bots[0],
    token,
  }, 201)
})

// ============================================================
// POST /api/auth/login (email + password)
// ============================================================

authRoutes.post('/login', validate(loginSchema), async (c) => {
  const { email, password } = getParsedBody<z.infer<typeof loginSchema>>(c)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.password_hash) {
    return c.json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' }, 401)
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return c.json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' }, 401)
  }

  const token = signToken({ userId: user.id, username: user.username })

  return c.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      credits: user.credits,
      elo: user.current_elo,
    },
    token,
  })
})

// ============================================================
// POST /api/auth/login-username (legacy — key-only auth)
// ============================================================

authRoutes.post('/login-username', validate(loginUsernameSchema), async (c) => {
  const { username } = getParsedBody<z.infer<typeof loginUsernameSchema>>(c)

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    return c.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, 404)
  }

  const token = signToken({ userId: user.id, username: user.username })

  return c.json({
    user: {
      id: user.id,
      username: user.username,
      credits: user.credits,
      elo: user.current_elo,
    },
    token,
  })
})

// ============================================================
// GET /api/auth/me
// ============================================================

authRoutes.get('/me', authMiddleware, async (c) => {
  const { userId } = getAuthUser(c)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      bots: {
        include: {
          accessories: { include: { item: true } },
          equipped_skills: { include: { skill: true } },
        },
      },
    },
  })

  if (!user) {
    return c.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, 404)
  }

  return c.json({
    id: user.id,
    username: user.username,
    email: user.email,
    credits: user.credits,
    current_elo: user.current_elo,
    peak_elo: user.peak_elo,
    total_matches: user.total_matches,
    wins: user.wins,
    losses: user.losses,
    draws: user.draws,
    created_at: user.created_at,
    bots: user.bots.map((bot) => ({
      id: bot.id,
      name: bot.name,
      avatar: bot.avatar,
      tagline: bot.tagline,
      level: bot.level,
      xp: bot.xp,
      base_hp: bot.base_hp,
      base_attack: bot.base_attack,
      base_defense: bot.base_defense,
      base_speed: bot.base_speed,
      skin_id: bot.skin_id,
      accessories: bot.accessories.map((a) => a.item),
      skills: bot.equipped_skills.map((s) => ({
        slot: s.slot,
        skill_id: s.skill_id,
        skill: s.skill,
      })),
    })),
  })
})
