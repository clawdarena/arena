import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../db'
import { authMiddleware, getAuthUser } from '../middleware/auth'
import { validate, getParsedBody } from '../middleware/validate'
import { recordTransaction } from '../utils/credits'

export const shopRoutes = new Hono()

// ============================================================
// GET /api/shop/items
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
// POST /api/shop/purchase
// ============================================================

const purchaseSchema = z.object({
  item_id: z.string().uuid(),
})

shopRoutes.post('/purchase', authMiddleware, validate(purchaseSchema), async (c) => {
  const { userId } = getAuthUser(c)
  const { item_id } = getParsedBody<z.infer<typeof purchaseSchema>>(c)

  const item = await prisma.shopItem.findUnique({ where: { id: item_id } })
  if (!item) {
    return c.json({ error: 'Item not found', code: 'NOT_FOUND' }, 404)
  }

  // Check if already owned (non-consumables)
  const existing = await prisma.userInventory.findUnique({
    where: { user_id_item_id: { user_id: userId, item_id } },
  })
  if (existing) {
    return c.json({ error: 'Already owned', code: 'ALREADY_OWNED' }, 409)
  }

  // Check stock
  if (item.limited_edition && item.stock_remaining !== null && item.stock_remaining <= 0) {
    return c.json({ error: 'Out of stock', code: 'OUT_OF_STOCK' }, 410)
  }

  // Check credits
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.credits < item.price) {
    return c.json({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' }, 400)
  }

  // Purchase transaction
  await recordTransaction(userId, -item.price, 'shop_purchase', item_id)

  // Add to inventory
  await prisma.userInventory.create({
    data: { user_id: userId, item_id },
  })

  // Decrement stock if limited
  if (item.limited_edition && item.stock_remaining !== null) {
    await prisma.shopItem.update({
      where: { id: item_id },
      data: { stock_remaining: { decrement: 1 } },
    })
  }

  const newBalance = user.credits - item.price

  return c.json({ success: true, item, new_balance: newBalance })
})

// ============================================================
// GET /api/inventory
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
