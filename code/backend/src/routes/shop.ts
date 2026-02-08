import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../db'
import { authMiddleware, getAuthUser } from '../middleware/auth'
import { validate, getParsedBody } from '../middleware/validate'
import { recordTransaction } from '../utils/credits'

export const shopRoutes = new Hono()

// ============================================================
// GET /api/shop/items — Legacy shop items
// ============================================================

shopRoutes.get('/items', async (c) => {
  const category = c.req.query('category')
  const rarity = c.req.query('rarity')
  const available = c.req.query('available')

  const where: any = {}
  if (category) where.category = category
  if (rarity) where.rarity = rarity
  if (available === 'true') {
    where.OR = [
      { limited_edition: false },
      { stock_remaining: { gt: 0 } },
    ]
  }

  const items = await prisma.shopItem.findMany({ where, orderBy: { price: 'asc' } })
  return c.json({ items })
})

// ============================================================
// GET /api/shop/cosmetics — All cosmetic items
// ============================================================

shopRoutes.get('/cosmetics', async (c) => {
  const category = c.req.query('category')
  const where: any = {}
  if (category) where.category = category

  const items = await prisma.cosmeticItem.findMany({ where, orderBy: { price: 'asc' } })
  return c.json({ items })
})

// ============================================================
// GET /api/shop/owned — Items the current user owns
// ============================================================

shopRoutes.get('/owned', authMiddleware, async (c) => {
  const { userId } = getAuthUser(c)

  const owned = await prisma.userCosmetic.findMany({
    where: { user_id: userId },
    select: { item_id: true },
  })

  // Also include all free/default items
  const freeItems = await prisma.cosmeticItem.findMany({
    where: { price: 0 },
    select: { id: true },
  })

  const allOwned = new Set([
    ...owned.map((o) => o.item_id),
    ...freeItems.map((f) => f.id),
  ])

  return c.json({ items: Array.from(allOwned) })
})

// ============================================================
// POST /api/shop/purchase — Buy a cosmetic item
// ============================================================

const purchaseCosmeticSchema = z.object({
  item_id: z.string().min(1),
})

shopRoutes.post('/purchase', authMiddleware, validate(purchaseCosmeticSchema), async (c) => {
  const { userId } = getAuthUser(c)
  const { item_id } = getParsedBody<z.infer<typeof purchaseCosmeticSchema>>(c)

  // Try cosmetic item first
  const cosmetic = await prisma.cosmeticItem.findUnique({ where: { id: item_id } })
  if (cosmetic) {
    // Free items don't need purchase
    if (cosmetic.price === 0) {
      return c.json({ error: 'This item is free by default', code: 'FREE_ITEM' }, 400)
    }

    // Check if already owned
    const existing = await prisma.userCosmetic.findUnique({
      where: { user_id_item_id: { user_id: userId, item_id } },
    })
    if (existing) {
      return c.json({ error: 'Already owned', code: 'ALREADY_OWNED' }, 409)
    }

    // Check credits
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.credits < cosmetic.price) {
      return c.json({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' }, 400)
    }

    // Deduct credits
    await recordTransaction(userId, -cosmetic.price, 'shop_purchase', item_id)

    // Add to owned
    await prisma.userCosmetic.create({
      data: { user_id: userId, item_id },
    })

    const newBalance = user.credits - cosmetic.price
    return c.json({ success: true, item: cosmetic, new_balance: newBalance })
  }

  // Fallback: try legacy ShopItem (UUID format)
  const legacyItem = await prisma.shopItem.findUnique({ where: { id: item_id } })
  if (!legacyItem) {
    return c.json({ error: 'Item not found', code: 'NOT_FOUND' }, 404)
  }

  // Legacy purchase flow
  const existing = await prisma.userInventory.findUnique({
    where: { user_id_item_id: { user_id: userId, item_id } },
  })
  if (existing) {
    return c.json({ error: 'Already owned', code: 'ALREADY_OWNED' }, 409)
  }

  if (legacyItem.limited_edition && legacyItem.stock_remaining !== null && legacyItem.stock_remaining <= 0) {
    return c.json({ error: 'Out of stock', code: 'OUT_OF_STOCK' }, 410)
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.credits < legacyItem.price) {
    return c.json({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' }, 400)
  }

  await recordTransaction(userId, -legacyItem.price, 'shop_purchase', item_id)
  await prisma.userInventory.create({ data: { user_id: userId, item_id } })

  if (legacyItem.limited_edition && legacyItem.stock_remaining !== null) {
    await prisma.shopItem.update({
      where: { id: item_id },
      data: { stock_remaining: { decrement: 1 } },
    })
  }

  const newBalance = user.credits - legacyItem.price
  return c.json({ success: true, item: legacyItem, new_balance: newBalance })
})

// ============================================================
// GET /api/inventory — Legacy inventory
// ============================================================

shopRoutes.get('/inventory', authMiddleware, async (c) => {
  const { userId } = getAuthUser(c)

  const items = await prisma.userInventory.findMany({
    where: { user_id: userId },
    include: { item: true },
    orderBy: { purchased_at: 'desc' },
  })

  return c.json({
    items: items.map((i) => ({
      id: i.id,
      item: i.item,
      purchased_at: i.purchased_at,
    })),
  })
})
