import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding database...')

  // ============================================================
  // Skills
  // ============================================================

  const skills = [
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
  // Cosmetic Items (36 items across 5 categories)
  // ============================================================

  const cosmetics = [
    // --- SKINS ---
    { id: 'skin_neon_blue', name: 'Neon Blue', description: 'Standard-issue cyan combat chassis. The classic.', category: 'skin', price: 0, rarity: 'common', metadata: { color: '#00f0ff', colorAlt: '#001a33' } },
    { id: 'skin_crimson_fury', name: 'Crimson Fury', description: 'Blood-red armor for those who fight without mercy.', category: 'skin', price: 200, rarity: 'common', metadata: { color: '#ff2020', colorAlt: '#330808' } },
    { id: 'skin_shadow_ops', name: 'Shadow Ops', description: 'Matte black stealth plating. Disappear into the dark.', category: 'skin', price: 200, rarity: 'common', metadata: { color: '#444444', colorAlt: '#111111' } },
    { id: 'skin_toxic_waste', name: 'Toxic Waste', description: 'Radioactive green glow. Handle with extreme caution.', category: 'skin', price: 500, rarity: 'rare', metadata: { color: '#39ff14', colorAlt: '#0a3300' } },
    { id: 'skin_royal_gold', name: 'Royal Gold', description: 'Gilded bronze finish. Fight like royalty.', category: 'skin', price: 500, rarity: 'rare', metadata: { color: '#ffd700', colorAlt: '#332b00' } },
    { id: 'skin_arctic_frost', name: 'Arctic Frost', description: 'Ice-white crystalline shell. Cold as the void.', category: 'skin', price: 500, rarity: 'rare', metadata: { color: '#b0e0ff', colorAlt: '#1a2a33' } },
    { id: 'skin_sunset_blaze', name: 'Sunset Blaze', description: 'Burning orange like a dying star.', category: 'skin', price: 1000, rarity: 'epic', metadata: { color: '#ff6b00', colorAlt: '#331500' } },
    { id: 'skin_phantom_purple', name: 'Phantom Purple', description: 'Dark violet wraith plating. Now you see me...', category: 'skin', price: 1000, rarity: 'epic', metadata: { color: '#9b30ff', colorAlt: '#1f0a33' } },
    { id: 'skin_prismatic', name: 'Prismatic', description: 'Holographic rainbow shift. The rarest chassis in the arena.', category: 'skin', price: 5000, rarity: 'legendary', metadata: { color: '#ff69b4', colorAlt: '#330a1f', effect: 'rainbow' } },
    { id: 'skin_obsidian', name: 'Obsidian', description: 'Pure black with a subtle death glow. Fear incarnate.', category: 'skin', price: 5000, rarity: 'legendary', metadata: { color: '#1a1a1a', colorAlt: '#080808', effect: 'glow' } },

    // --- TAUNTS ---
    { id: 'taunt_gg_ez', name: 'GG EZ', description: '"GG EZ" — The timeless classic.', category: 'taunt', price: 100, rarity: 'common', metadata: { text: 'GG EZ', emoji: '😏' } },
    { id: 'taunt_get_rekt', name: 'Get Rekt', description: '"Get rekt" — Short. Brutal. Effective.', category: 'taunt', price: 100, rarity: 'common', metadata: { text: 'Get rekt', emoji: '💀' } },
    { id: 'taunt_calculated', name: 'Calculated.', description: '"Calculated." — Even when it clearly wasn\'t.', category: 'taunt', price: 100, rarity: 'common', metadata: { text: 'Calculated.', emoji: '🧠' } },
    { id: 'taunt_fighting', name: 'You Call That Fighting?', description: '"You call that fighting?" — Maximum disrespect.', category: 'taunt', price: 500, rarity: 'rare', metadata: { text: 'You call that fighting?', emoji: '🤨' } },
    { id: 'taunt_grandma', name: 'Grandma Hits Harder', description: '"My grandma hits harder" — Devastating.', category: 'taunt', price: 500, rarity: 'rare', metadata: { text: 'My grandma hits harder', emoji: '👵' } },
    { id: 'taunt_barely_tried', name: 'I Barely Tried', description: '"I barely tried" — Whether true or not.', category: 'taunt', price: 1200, rarity: 'epic', metadata: { text: 'I barely tried', emoji: '🥱' } },
    { id: 'taunt_overlord', name: 'Bow Before Your Overlord', description: '"Bow before your overlord" — Absolute dominance.', category: 'taunt', price: 3000, rarity: 'legendary', metadata: { text: 'Bow before your overlord', emoji: '👑' } },

    // --- VICTORY DANCES ---
    { id: 'dance_basic', name: 'Basic Victory', description: 'A simple celebratory pose. You won. That\'s enough.', category: 'dance', price: 0, rarity: 'common', metadata: { animation: 'basic', emoji: '✌️' } },
    { id: 'dance_robot_spin', name: 'Robot Spin', description: '360° mechanical rotation. Classic bot move.', category: 'dance', price: 300, rarity: 'common', metadata: { animation: 'robot_spin', emoji: '🔄' } },
    { id: 'dance_claw_snap', name: 'Claw Snap', description: 'Dramatic claw clacking in the opponent\'s face.', category: 'dance', price: 300, rarity: 'common', metadata: { animation: 'claw_snap', emoji: '🦀' } },
    { id: 'dance_moonwalk', name: 'Moonwalk', description: 'Smooth backwards glide. MJ would be proud.', category: 'dance', price: 800, rarity: 'rare', metadata: { animation: 'moonwalk', emoji: '🕺' } },
    { id: 'dance_breakdance', name: 'Breakdance', description: 'Full-body spin on the arena floor. Stylish.', category: 'dance', price: 800, rarity: 'rare', metadata: { animation: 'breakdance', emoji: '💃' } },
    { id: 'dance_dab', name: 'Dab', description: 'The dab. Still hits in the robot arena.', category: 'dance', price: 1500, rarity: 'epic', metadata: { animation: 'dab', emoji: '🙅' } },
    { id: 'dance_floss', name: 'Floss', description: 'Side-to-side arm swing. Annoyingly good.', category: 'dance', price: 1500, rarity: 'epic', metadata: { animation: 'floss', emoji: '🪥' } },
    { id: 'dance_tpose', name: 'T-Pose Dominance', description: 'Assert dominance with the ultimate power stance.', category: 'dance', price: 4000, rarity: 'legendary', metadata: { animation: 'tpose', emoji: '✝️' } },

    // --- ARENA THEMES ---
    { id: 'arena_default', name: 'Default Arena', description: 'Standard industrial combat zone.', category: 'arena', price: 0, rarity: 'common', metadata: { theme: 'default', gradient: 'from-gray-900 to-gray-800' } },
    { id: 'arena_neon_city', name: 'Neon City', description: 'Cyberpunk streets. Holographic billboards. Rain.', category: 'arena', price: 500, rarity: 'rare', metadata: { theme: 'neon_city', color1: '#ff00ff', color2: '#00ffff' } },
    { id: 'arena_space_station', name: 'Space Station', description: 'Zero-gravity arena in orbit. Stars all around.', category: 'arena', price: 500, rarity: 'rare', metadata: { theme: 'space_station', color1: '#0a0a2e', color2: '#1a1a4e' } },
    { id: 'arena_volcanic', name: 'Volcanic', description: 'Fight over flowing lava. Extreme heat.', category: 'arena', price: 1000, rarity: 'epic', metadata: { theme: 'volcanic', color1: '#ff4500', color2: '#8b0000' } },
    { id: 'arena_underwater', name: 'Underwater', description: 'Deep sea arena. Bioluminescent creatures swim by.', category: 'arena', price: 1000, rarity: 'epic', metadata: { theme: 'underwater', color1: '#004080', color2: '#001a33' } },
    { id: 'arena_matrix', name: 'Matrix', description: 'Green code rain. Reality is a simulation anyway.', category: 'arena', price: 3500, rarity: 'legendary', metadata: { theme: 'matrix', color1: '#003300', color2: '#00ff00' } },

    // --- ENTRANCE EFFECTS ---
    { id: 'entrance_standard', name: 'Standard', description: 'Walk in. Simple.', category: 'entrance', price: 0, rarity: 'common', metadata: { effect: 'standard', emoji: '🚶' } },
    { id: 'entrance_lightning', name: 'Lightning Strike', description: 'Arrive in a bolt of electricity.', category: 'entrance', price: 300, rarity: 'common', metadata: { effect: 'lightning', emoji: '⚡' } },
    { id: 'entrance_teleport', name: 'Teleport Glitch', description: 'Glitchy digital materialization.', category: 'entrance', price: 500, rarity: 'rare', metadata: { effect: 'teleport', emoji: '📡' } },
    { id: 'entrance_fire', name: 'Fire Rise', description: 'Emerge from a pillar of flames.', category: 'entrance', price: 1000, rarity: 'epic', metadata: { effect: 'fire', emoji: '🔥' } },
    { id: 'entrance_portal', name: 'Portal', description: 'Step through a dimensional rift. Terrifying.', category: 'entrance', price: 3000, rarity: 'legendary', metadata: { effect: 'portal', emoji: '🌀' } },
  ]

  for (const item of cosmetics) {
    await prisma.cosmeticItem.upsert({
      where: { id: item.id },
      update: { name: item.name, description: item.description, category: item.category, price: item.price, rarity: item.rarity, metadata: item.metadata },
      create: item,
    })
  }
  console.log(`  ✅ ${cosmetics.length} cosmetic items seeded`)

  // ============================================================
  // Legacy Shop Items (kept for backwards compat, all stat bonuses zeroed)
  // ============================================================

  const existingCount = await prisma.shopItem.count()
  if (existingCount === 0) {
    const legacyItems = [
      { name: 'Neon Blue', description: 'Electric blue robot skin', category: 'skin', price: 500, rarity: 'common' },
      { name: 'Crimson Fury', description: 'Deep red battle-worn skin', category: 'skin', price: 500, rarity: 'common' },
      { name: 'GG', description: 'Good game emote', category: 'emote', price: 100, rarity: 'common' },
      { name: 'Taunt', description: 'Taunting emote', category: 'emote', price: 100, rarity: 'common' },
    ]
    for (const item of legacyItems) {
      await prisma.shopItem.create({ data: item })
    }
    console.log(`  ✅ ${legacyItems.length} legacy shop items seeded`)
  } else {
    console.log(`  ⏭️  Legacy shop items already exist (${existingCount} items)`)
  }

  console.log('🌱 Seeding complete!')
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
