import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../db'
import { authMiddleware, getAuthUser } from '../middleware/auth'
import { validate, getParsedBody } from '../middleware/validate'

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

    try {
      // AUDIT FIX: Make cosmetic purchase atomic (ownership/balance/charge/grant in one transaction)
      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.userCosmetic.findUnique({
          where: { user_id_item_id: { user_id: userId, item_id } },
        })
        if (existing) throw new Error('ALREADY_OWNED')

        const user = await tx.user.findUnique({ where: { id: userId }, select: { credits: true } })
        if (!user || user.credits < cosmetic.price) throw new Error('INSUFFICIENT_CREDITS')

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { credits: { decrement: cosmetic.price } },
          select: { credits: true },
        })

        await tx.creditTransaction.create({
          data: {
            user_id: userId,
            amount: -cosmetic.price,
            balance: updatedUser.credits,
            reason: 'shop_purchase',
            reference_id: item_id,
          },
        })

        await tx.userCosmetic.create({
          data: { user_id: userId, item_id },
        })

        return { newBalance: updatedUser.credits }
      })

      return c.json({ success: true, item: cosmetic, new_balance: result.newBalance })
    } catch (err) {
      const code = err instanceof Error ? err.message : 'PURCHASE_FAILED'
      if (code === 'ALREADY_OWNED') return c.json({ error: 'Already owned', code }, 409)
      if (code === 'INSUFFICIENT_CREDITS') return c.json({ error: 'Insufficient credits', code }, 400)
      return c.json({ error: 'Purchase failed', code: 'PURCHASE_FAILED' }, 500)
    }
  }

  // Fallback: try legacy ShopItem (UUID format)
  const legacyItem = await prisma.shopItem.findUnique({ where: { id: item_id } })
  if (!legacyItem) {
    return c.json({ error: 'Item not found', code: 'NOT_FOUND' }, 404)
  }

  try {
    // AUDIT FIX: Make legacy purchase atomic (stock/balance/charge/grant/decrement in one transaction)
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.userInventory.findUnique({
        where: { user_id_item_id: { user_id: userId, item_id } },
      })
      if (existing) throw new Error('ALREADY_OWNED')

      const item = await tx.shopItem.findUnique({ where: { id: item_id } })
      if (!item) throw new Error('NOT_FOUND')

      if (item.limited_edition && item.stock_remaining !== null && item.stock_remaining <= 0) {
        throw new Error('OUT_OF_STOCK')
      }

      const user = await tx.user.findUnique({ where: { id: userId }, select: { credits: true } })
      if (!user || user.credits < item.price) throw new Error('INSUFFICIENT_CREDITS')

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: item.price } },
        select: { credits: true },
      })

      await tx.creditTransaction.create({
        data: {
          user_id: userId,
          amount: -item.price,
          balance: updatedUser.credits,
          reason: 'shop_purchase',
          reference_id: item_id,
        },
      })

      await tx.userInventory.create({ data: { user_id: userId, item_id } })

      if (item.limited_edition && item.stock_remaining !== null) {
        await tx.shopItem.update({
          where: { id: item_id },
          data: { stock_remaining: { decrement: 1 } },
        })
      }

      return { item, newBalance: updatedUser.credits }
    })

    return c.json({ success: true, item: result.item, new_balance: result.newBalance })
  } catch (err) {
    const code = err instanceof Error ? err.message : 'PURCHASE_FAILED'
    if (code === 'ALREADY_OWNED') return c.json({ error: 'Already owned', code }, 409)
    if (code === 'OUT_OF_STOCK') return c.json({ error: 'Out of stock', code }, 410)
    if (code === 'INSUFFICIENT_CREDITS') return c.json({ error: 'Insufficient credits', code }, 400)
    if (code === 'NOT_FOUND') return c.json({ error: 'Item not found', code }, 404)
    return c.json({ error: 'Purchase failed', code: 'PURCHASE_FAILED' }, 500)
  }
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
