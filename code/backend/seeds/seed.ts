import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding database...')

  // ============================================================
  // Skills
  // ============================================================

  const skills = [
    // Starter skills (free)
    {
      id: 'power_strike',
      name: 'Power Strike',
      description: 'Deal 1.5x attack damage, ignoring 50% of defense.',
      rarity: 'common',
      price: 0,
      cooldown: 3,
      target: 'opponent',
      effect_data: { damage_mult: 1.5, defense_ignore: 0.5 },
    },
    {
      id: 'shield_wall',
      name: 'Shield Wall',
      description: 'Block 100% of incoming damage this round and heal 5 HP.',
      rarity: 'common',
      price: 0,
      cooldown: 4,
      target: 'self',
      effect_data: { block: 1.0, heal: 5 },
    },
    {
      id: 'overclock',
      name: 'Overclock',
      description: '+5 attack and +5 speed for 2 rounds.',
      rarity: 'common',
      price: 0,
      cooldown: 4,
      target: 'self',
      effect_data: { status: 'overclock', duration: 2, attack_bonus: 5, speed_bonus: 5 },
    },
    {
      id: 'scan',
      name: 'Scan',
      description: "Reveal opponent's exact stats for the rest of the match.",
      rarity: 'common',
      price: 0,
      cooldown: 5,
      target: 'opponent',
      effect_data: { reveal_stats: true },
    },
    // Shop skills
    {
      id: 'fireball',
      name: 'Fireball',
      description: 'Deal 20 flat damage (ignores defense). Apply burning (3 dmg/round for 2 rounds).',
      rarity: 'rare',
      price: 300,
      cooldown: 4,
      target: 'opponent',
      effect_data: { flat_damage: 20, status: 'burning', duration: 2, tick_damage: 3 },
    },
    {
      id: 'iron_fortress',
      name: 'Iron Fortress',
      description: '+10 defense for 3 rounds. Cannot attack while active.',
      rarity: 'rare',
      price: 300,
      cooldown: 5,
      target: 'self',
      effect_data: { status: 'iron_fortress', duration: 3, defense_bonus: 10, prevents_attack: true },
    },
    {
      id: 'emp_blast',
      name: 'EMP Blast',
      description: "Stun opponent for 1 round. Reset opponent's skill cooldowns to max.",
      rarity: 'epic',
      price: 600,
      cooldown: 6,
      target: 'opponent',
      effect_data: { status: 'stunned', duration: 1, reset_cooldowns: true },
    },
    {
      id: 'regenerate',
      name: 'Regenerate',
      description: 'Heal 8 HP per round for 3 rounds.',
      rarity: 'epic',
      price: 600,
      cooldown: 5,
      target: 'self',
      effect_data: { status: 'regenerating', duration: 3, heal_per_round: 8 },
    },
    {
      id: 'berserker',
      name: 'Berserker Rage',
      description: '+15 attack for 3 rounds, but -5 defense for same duration.',
      rarity: 'legendary',
      price: 1000,
      cooldown: 7,
      target: 'self',
      effect_data: { status: 'berserker', duration: 3, attack_bonus: 15, defense_penalty: 5 },
    },
    {
      id: 'mirror_coat',
      name: 'Mirror Coat',
      description: 'Reflect 50% of incoming damage back to attacker for 2 rounds.',
      rarity: 'legendary',
      price: 1000,
      cooldown: 6,
      target: 'self',
      effect_data: { status: 'mirror_coat', duration: 2, reflect_pct: 0.5 },
    },
  ]

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { id: skill.id },
      update: skill,
      create: skill,
    })
  }
  console.log(`  ✅ ${skills.length} skills seeded`)

  // ============================================================
  // Shop Items
  // ============================================================

  const shopItems = [
    // Skins
    { name: 'Neon Blue', description: 'Electric blue robot skin', category: 'skin', price: 500, rarity: 'common' },
    { name: 'Crimson Fury', description: 'Deep red battle-worn skin', category: 'skin', price: 500, rarity: 'common' },
    { name: 'Shadow Ops', description: 'Stealthy matte black skin', category: 'skin', price: 800, rarity: 'rare' },
    { name: 'Gold Plated', description: 'Luxurious gold chrome skin', category: 'skin', price: 2000, rarity: 'epic' },
    { name: 'Prismatic', description: 'Color-shifting holographic skin', category: 'skin', price: 5000, rarity: 'legendary' },
    // Accessories (with stat bonuses)
    { name: 'Reinforced Plating', description: '+10 HP', category: 'accessory', price: 300, rarity: 'common', hp_bonus: 10 },
    { name: 'Power Core', description: '+3 Attack', category: 'accessory', price: 300, rarity: 'common', attack_bonus: 3 },
    { name: 'Shield Module', description: '+3 Defense', category: 'accessory', price: 300, rarity: 'common', defense_bonus: 3 },
    { name: 'Turbo Booster', description: '+3 Speed', category: 'accessory', price: 300, rarity: 'common', speed_bonus: 3 },
    { name: 'Titan Armor', description: '+20 HP, +5 Defense', category: 'accessory', price: 800, rarity: 'rare', hp_bonus: 20, defense_bonus: 5 },
    { name: 'Berserker Core', description: '+8 Attack, -5 HP', category: 'accessory', price: 800, rarity: 'rare', attack_bonus: 8, hp_bonus: -5 },
    { name: 'Quantum Processor', description: '+5 Speed, +3 Attack', category: 'accessory', price: 1200, rarity: 'epic', speed_bonus: 5, attack_bonus: 3 },
    { name: 'Omega Module', description: '+5 to all stats', category: 'accessory', price: 3000, rarity: 'legendary', hp_bonus: 5, attack_bonus: 5, defense_bonus: 5, speed_bonus: 5 },
    // Emotes
    { name: 'GG', description: 'Good game emote', category: 'emote', price: 100, rarity: 'common' },
    { name: 'Taunt', description: 'Taunting emote', category: 'emote', price: 100, rarity: 'common' },
  ]

  // Clear existing items and re-seed (idempotent)
  const existingCount = await prisma.shopItem.count()
  if (existingCount === 0) {
    for (const item of shopItems) {
      await prisma.shopItem.create({
        data: {
          name: item.name,
          description: item.description,
          category: item.category,
          price: item.price,
          rarity: item.rarity,
          hp_bonus: item.hp_bonus ?? 0,
          attack_bonus: item.attack_bonus ?? 0,
          defense_bonus: item.defense_bonus ?? 0,
          speed_bonus: item.speed_bonus ?? 0,
        },
      })
    }
    console.log(`  ✅ ${shopItems.length} shop items seeded`)
  } else {
    console.log(`  ⏭️  Shop items already seeded (${existingCount} items)`)
  }
  console.log(`  ✅ ${shopItems.length} shop items seeded`)

  console.log('🌱 Seeding complete!')
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
