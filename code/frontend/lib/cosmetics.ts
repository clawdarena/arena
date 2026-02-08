/**
 * Cosmetic Shop Data — Pure cosmetic items, ZERO gameplay advantages.
 * Categories: skin, taunt, dance, arena, entrance, accessory
 */

export type CosmeticCategory = 'skin' | 'taunt' | 'dance' | 'arena' | 'entrance' | 'accessory'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'super_rare' | 'legendary'

export interface CosmeticItem {
  id: string
  name: string
  description: string
  category: CosmeticCategory
  price: number // 0 = free/default
  rarity: Rarity
  metadata: Record<string, string>
  isDefault?: boolean
}

// Rarity display helpers
export const RARITY_ORDER: Record<Rarity, number> = {
  legendary: 0,
  super_rare: 1,
  rare: 2,
  uncommon: 3,
  common: 4,
}

export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'COMMON',
  uncommon: 'UNCOMMON',
  rare: 'RARE',
  super_rare: 'SUPER RARE',
  legendary: 'LEGENDARY',
}

export const RARITY_HEX: Record<Rarity, string> = {
  common: '#888888',
  uncommon: '#2ecc71',
  rare: '#3498db',
  super_rare: '#9b59b6',
  legendary: '#f39c12',
}

// ============================================================
// SKINS — Color schemes for the CrabBot 3D model
// ============================================================

export const SKINS: CosmeticItem[] = [
  {
    id: 'skin_neon_blue',
    name: 'Neon Blue',
    description: 'Standard-issue cyan combat chassis. The classic.',
    category: 'skin',
    price: 0,
    rarity: 'common',
    metadata: { color: '#00f0ff', colorAlt: '#001a33' },
    isDefault: true,
  },
  {
    id: 'skin_crimson_fury',
    name: 'Crimson Fury',
    description: 'Blood-red armor for those who fight without mercy.',
    category: 'skin',
    price: 200,
    rarity: 'uncommon',
    metadata: { color: '#ff2020', colorAlt: '#330808' },
  },
  {
    id: 'skin_shadow_ops',
    name: 'Shadow Ops',
    description: 'Matte black stealth plating. Disappear into the dark.',
    category: 'skin',
    price: 200,
    rarity: 'uncommon',
    metadata: { color: '#444444', colorAlt: '#111111' },
  },
  {
    id: 'skin_toxic_waste',
    name: 'Toxic Waste',
    description: 'Radioactive green glow. Handle with extreme caution.',
    category: 'skin',
    price: 500,
    rarity: 'rare',
    metadata: { color: '#39ff14', colorAlt: '#0a3300' },
  },
  {
    id: 'skin_royal_gold',
    name: 'Royal Gold',
    description: 'Gilded bronze finish. Fight like royalty.',
    category: 'skin',
    price: 500,
    rarity: 'rare',
    metadata: { color: '#ffd700', colorAlt: '#332b00' },
  },
  {
    id: 'skin_arctic_frost',
    name: 'Arctic Frost',
    description: 'Ice-white crystalline shell. Cold as the void.',
    category: 'skin',
    price: 500,
    rarity: 'rare',
    metadata: { color: '#b0e0ff', colorAlt: '#1a2a33' },
  },
  {
    id: 'skin_sunset_blaze',
    name: 'Sunset Blaze',
    description: 'Burning orange like a dying star.',
    category: 'skin',
    price: 1000,
    rarity: 'super_rare',
    metadata: { color: '#ff6b00', colorAlt: '#331500' },
  },
  {
    id: 'skin_phantom_purple',
    name: 'Phantom Purple',
    description: 'Dark violet wraith plating. Now you see me...',
    category: 'skin',
    price: 1000,
    rarity: 'super_rare',
    metadata: { color: '#9b30ff', colorAlt: '#1f0a33' },
  },
  {
    id: 'skin_prismatic',
    name: 'Prismatic',
    description: 'Holographic rainbow shift. The rarest chassis in the arena.',
    category: 'skin',
    price: 5000,
    rarity: 'legendary',
    metadata: { color: '#ff69b4', colorAlt: '#330a1f', effect: 'rainbow' },
  },
  {
    id: 'skin_obsidian',
    name: 'Obsidian',
    description: 'Pure black with a subtle death glow. Fear incarnate.',
    category: 'skin',
    price: 5000,
    rarity: 'legendary',
    metadata: { color: '#1a1a1a', colorAlt: '#080808', effect: 'glow' },
  },
]

// ============================================================
// TAUNTS — Text displayed before/after matches
// ============================================================

export const TAUNTS: CosmeticItem[] = [
  {
    id: 'taunt_gg_ez',
    name: 'GG EZ',
    description: '"GG EZ" — The timeless classic.',
    category: 'taunt',
    price: 100,
    rarity: 'common',
    metadata: { text: 'GG EZ', emoji: '😏' },
  },
  {
    id: 'taunt_get_rekt',
    name: 'Get Rekt',
    description: '"Get rekt" — Short. Brutal. Effective.',
    category: 'taunt',
    price: 100,
    rarity: 'common',
    metadata: { text: 'Get rekt', emoji: '💀' },
  },
  {
    id: 'taunt_calculated',
    name: 'Calculated.',
    description: '"Calculated." — Even when it clearly wasn\'t.',
    category: 'taunt',
    price: 100,
    rarity: 'common',
    metadata: { text: 'Calculated.', emoji: '🧠' },
  },
  {
    id: 'taunt_fighting',
    name: 'You Call That Fighting?',
    description: '"You call that fighting?" — Maximum disrespect.',
    category: 'taunt',
    price: 500,
    rarity: 'rare',
    metadata: { text: 'You call that fighting?', emoji: '🤨' },
  },
  {
    id: 'taunt_grandma',
    name: 'Grandma Hits Harder',
    description: '"My grandma hits harder" — Devastating.',
    category: 'taunt',
    price: 500,
    rarity: 'rare',
    metadata: { text: 'My grandma hits harder', emoji: '👵' },
  },
  {
    id: 'taunt_barely_tried',
    name: 'I Barely Tried',
    description: '"I barely tried" — Whether true or not.',
    category: 'taunt',
    price: 1200,
    rarity: 'super_rare',
    metadata: { text: 'I barely tried', emoji: '🥱' },
  },
  {
    id: 'taunt_overlord',
    name: 'Bow Before Your Overlord',
    description: '"Bow before your overlord" — Absolute dominance.',
    category: 'taunt',
    price: 3000,
    rarity: 'legendary',
    metadata: { text: 'Bow before your overlord', emoji: '👑' },
  },
]

// ============================================================
// VICTORY DANCES — Animations played on win
// ============================================================

export const DANCES: CosmeticItem[] = [
  {
    id: 'dance_basic',
    name: 'Basic Victory',
    description: 'A simple celebratory pose. You won. That\'s enough.',
    category: 'dance',
    price: 0,
    rarity: 'common',
    metadata: { animation: 'basic', emoji: '✌️' },
    isDefault: true,
  },
  {
    id: 'dance_robot_spin',
    name: 'Robot Spin',
    description: '360° mechanical rotation. Classic bot move.',
    category: 'dance',
    price: 300,
    rarity: 'uncommon',
    metadata: { animation: 'robot_spin', emoji: '🔄' },
  },
  {
    id: 'dance_claw_snap',
    name: 'Claw Snap',
    description: 'Dramatic claw clacking in the opponent\'s face.',
    category: 'dance',
    price: 300,
    rarity: 'uncommon',
    metadata: { animation: 'claw_snap', emoji: '🦀' },
  },
  {
    id: 'dance_moonwalk',
    name: 'Moonwalk',
    description: 'Smooth backwards glide. MJ would be proud.',
    category: 'dance',
    price: 800,
    rarity: 'rare',
    metadata: { animation: 'moonwalk', emoji: '🕺' },
  },
  {
    id: 'dance_breakdance',
    name: 'Breakdance',
    description: 'Full-body spin on the arena floor. Stylish.',
    category: 'dance',
    price: 800,
    rarity: 'rare',
    metadata: { animation: 'breakdance', emoji: '💃' },
  },
  {
    id: 'dance_dab',
    name: 'Dab',
    description: 'The dab. Still hits in the robot arena.',
    category: 'dance',
    price: 1500,
    rarity: 'super_rare',
    metadata: { animation: 'dab', emoji: '🙅' },
  },
  {
    id: 'dance_floss',
    name: 'Floss',
    description: 'Side-to-side arm swing. Annoyingly good.',
    category: 'dance',
    price: 1500,
    rarity: 'super_rare',
    metadata: { animation: 'floss', emoji: '🪥' },
  },
  {
    id: 'dance_tpose',
    name: 'T-Pose Dominance',
    description: 'Assert dominance with the ultimate power stance.',
    category: 'dance',
    price: 4000,
    rarity: 'legendary',
    metadata: { animation: 'tpose', emoji: '✝️' },
  },
]

// ============================================================
// ARENA THEMES — Background environments
// ============================================================

export const ARENAS: CosmeticItem[] = [
  {
    id: 'arena_default',
    name: 'Default Arena',
    description: 'Standard industrial combat zone.',
    category: 'arena',
    price: 0,
    rarity: 'common',
    metadata: { theme: 'default', gradient: 'from-gray-900 to-gray-800' },
    isDefault: true,
  },
  {
    id: 'arena_neon_city',
    name: 'Neon City',
    description: 'Cyberpunk streets. Holographic billboards. Rain.',
    category: 'arena',
    price: 500,
    rarity: 'rare',
    metadata: { theme: 'neon_city', color1: '#ff00ff', color2: '#00ffff' },
  },
  {
    id: 'arena_space_station',
    name: 'Space Station',
    description: 'Zero-gravity arena in orbit. Stars all around.',
    category: 'arena',
    price: 500,
    rarity: 'rare',
    metadata: { theme: 'space_station', color1: '#0a0a2e', color2: '#1a1a4e' },
  },
  {
    id: 'arena_volcanic',
    name: 'Volcanic',
    description: 'Fight over flowing lava. Extreme heat.',
    category: 'arena',
    price: 1000,
    rarity: 'super_rare',
    metadata: { theme: 'volcanic', color1: '#ff4500', color2: '#8b0000' },
  },
  {
    id: 'arena_underwater',
    name: 'Underwater',
    description: 'Deep sea arena. Bioluminescent creatures swim by.',
    category: 'arena',
    price: 1000,
    rarity: 'super_rare',
    metadata: { theme: 'underwater', color1: '#004080', color2: '#001a33' },
  },
  {
    id: 'arena_matrix',
    name: 'Matrix',
    description: 'Green code rain. Reality is a simulation anyway.',
    category: 'arena',
    price: 3500,
    rarity: 'legendary',
    metadata: { theme: 'matrix', color1: '#003300', color2: '#00ff00' },
  },
]

// ============================================================
// ENTRANCE EFFECTS — How your bot appears
// ============================================================

export const ENTRANCES: CosmeticItem[] = [
  {
    id: 'entrance_standard',
    name: 'Standard',
    description: 'Walk in. Simple.',
    category: 'entrance',
    price: 0,
    rarity: 'common',
    metadata: { effect: 'standard', emoji: '🚶' },
    isDefault: true,
  },
  {
    id: 'entrance_lightning',
    name: 'Lightning Strike',
    description: 'Arrive in a bolt of electricity.',
    category: 'entrance',
    price: 300,
    rarity: 'uncommon',
    metadata: { effect: 'lightning', emoji: '⚡' },
  },
  {
    id: 'entrance_teleport',
    name: 'Teleport Glitch',
    description: 'Glitchy digital materialization.',
    category: 'entrance',
    price: 500,
    rarity: 'rare',
    metadata: { effect: 'teleport', emoji: '📡' },
  },
  {
    id: 'entrance_fire',
    name: 'Fire Rise',
    description: 'Emerge from a pillar of flames.',
    category: 'entrance',
    price: 1000,
    rarity: 'super_rare',
    metadata: { effect: 'fire', emoji: '🔥' },
  },
  {
    id: 'entrance_portal',
    name: 'Portal',
    description: 'Step through a dimensional rift. Terrifying.',
    category: 'entrance',
    price: 3000,
    rarity: 'legendary',
    metadata: { effect: 'portal', emoji: '🌀' },
  },
]

// ============================================================
// ACCESSORIES — Back / Head / Face attachments
// ============================================================

export const ACCESSORIES: CosmeticItem[] = [
  // Back attachments
  {
    id: 'acc_antenna_array',
    name: 'Antenna Array',
    description: 'Satellite dish mounted on back. Better signal, better style.',
    category: 'accessory',
    price: 150,
    rarity: 'common',
    metadata: { slot: 'back', emoji: '📡', attachment: 'Mounted on the back panel' },
  },
  {
    id: 'acc_cape',
    name: 'Cape',
    description: 'A flowing battle cape. Every hero needs one.',
    category: 'accessory',
    price: 300,
    rarity: 'uncommon',
    metadata: { slot: 'back', emoji: '🦸', attachment: 'Draped from the shoulder joints' },
  },
  {
    id: 'acc_rocket_launcher',
    name: 'Rocket Launcher',
    description: 'Bulky rocket launcher strapped to back. Cosmetic only... for now.',
    category: 'accessory',
    price: 600,
    rarity: 'rare',
    metadata: { slot: 'back', emoji: '🚀', attachment: 'Strapped across the back armor plate' },
  },
  {
    id: 'acc_jetpack',
    name: 'Jetpack',
    description: 'Thruster pack with flame effect hint. Ready for takeoff.',
    category: 'accessory',
    price: 1500,
    rarity: 'super_rare',
    metadata: { slot: 'back', emoji: '🔥', attachment: 'Bolted onto the dorsal chassis' },
  },
  {
    id: 'acc_angel_wings',
    name: 'Angel Wings',
    description: 'Glowing ethereal wings. Angelic warfare.',
    category: 'accessory',
    price: 4000,
    rarity: 'legendary',
    metadata: { slot: 'back', emoji: '👼', attachment: 'Projecting from the shoulder blades' },
  },

  // Head accessories
  {
    id: 'acc_sunglasses',
    name: 'Sunglasses',
    description: 'Cool shades for a cool bot. Deal with it.',
    category: 'accessory',
    price: 100,
    rarity: 'common',
    metadata: { slot: 'head', emoji: '😎', attachment: 'Resting on the optical sensors' },
  },
  {
    id: 'acc_party_hat',
    name: 'Party Hat',
    description: 'Colorful cone with a pompom. Party in the arena.',
    category: 'accessory',
    price: 100,
    rarity: 'common',
    metadata: { slot: 'head', emoji: '🥳', attachment: 'Strapped to the top of the cranial unit' },
  },
  {
    id: 'acc_top_hat',
    name: 'Top Hat',
    description: 'Classy top hat. Distinguished combat.',
    category: 'accessory',
    price: 250,
    rarity: 'uncommon',
    metadata: { slot: 'head', emoji: '🎩', attachment: 'Balanced atop the head casing' },
  },
  {
    id: 'acc_ninja_headband',
    name: 'Ninja Headband',
    description: 'Tied bandana flowing in the wind. Silent but deadly.',
    category: 'accessory',
    price: 250,
    rarity: 'uncommon',
    metadata: { slot: 'head', emoji: '🥷', attachment: 'Wrapped around the cranial armor' },
  },
  {
    id: 'acc_devil_horns',
    name: 'Devil Horns',
    description: 'Red pointy horns. Devilishly good-looking.',
    category: 'accessory',
    price: 300,
    rarity: 'uncommon',
    metadata: { slot: 'head', emoji: '😈', attachment: 'Sprouting from the top of the head unit' },
  },
  {
    id: 'acc_viking_horns',
    name: 'Viking Horns',
    description: 'Horned helmet for the warrior in you.',
    category: 'accessory',
    price: 700,
    rarity: 'rare',
    metadata: { slot: 'head', emoji: '⚔️', attachment: 'Welded onto the helmet plating' },
  },
  {
    id: 'acc_crown',
    name: 'Crown',
    description: 'Golden crown. Rule the arena.',
    category: 'accessory',
    price: 800,
    rarity: 'rare',
    metadata: { slot: 'head', emoji: '👑', attachment: 'Resting atop the cranial unit' },
  },
  {
    id: 'acc_halo',
    name: 'Halo',
    description: 'Glowing ring hovering above. Saintly combatant.',
    category: 'accessory',
    price: 1200,
    rarity: 'super_rare',
    metadata: { slot: 'head', emoji: '😇', attachment: 'Floating above the head unit' },
  },

  // Face accessories
  {
    id: 'acc_clown_nose',
    name: 'Clown Nose',
    description: 'Red honking nose. Maximum disrespect.',
    category: 'accessory',
    price: 80,
    rarity: 'common',
    metadata: { slot: 'face', emoji: '🤡', attachment: 'Clipped onto the front sensor array' },
  },
  {
    id: 'acc_monocle',
    name: 'Monocle',
    description: 'Fancy single eyepiece. Sophisticated violence.',
    category: 'accessory',
    price: 200,
    rarity: 'uncommon',
    metadata: { slot: 'face', emoji: '🧐', attachment: 'Fitted over the right optical sensor' },
  },
  {
    id: 'acc_gas_mask',
    name: 'Gas Mask',
    description: 'Tactical face mask. Breathe easy in the chaos.',
    category: 'accessory',
    price: 500,
    rarity: 'rare',
    metadata: { slot: 'face', emoji: '😷', attachment: 'Clamped over the lower face plate' },
  },
]

// ============================================================
// Helpers
// ============================================================

export const ALL_COSMETICS: CosmeticItem[] = [
  ...SKINS,
  ...TAUNTS,
  ...DANCES,
  ...ARENAS,
  ...ENTRANCES,
  ...ACCESSORIES,
]

export const COSMETICS_BY_CATEGORY: Record<CosmeticCategory, CosmeticItem[]> = {
  skin: SKINS,
  taunt: TAUNTS,
  dance: DANCES,
  arena: ARENAS,
  entrance: ENTRANCES,
  accessory: ACCESSORIES,
}

export const CATEGORY_LABELS: Record<CosmeticCategory, string> = {
  skin: 'SKINS',
  taunt: 'TAUNTS',
  dance: 'DANCES',
  arena: 'ARENAS',
  entrance: 'ENTRANCES',
  accessory: 'ACCESSORIES',
}

export const CATEGORY_ICONS: Record<CosmeticCategory, string> = {
  skin: '🎨',
  taunt: '💬',
  dance: '💃',
  arena: '🏟️',
  entrance: '⚡',
  accessory: '🎒',
}

export function getDefaultForCategory(category: CosmeticCategory): CosmeticItem | undefined {
  return COSMETICS_BY_CATEGORY[category].find(i => i.isDefault)
}
