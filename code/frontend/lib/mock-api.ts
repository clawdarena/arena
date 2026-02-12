/**
 * Mock API Layer for ClawdArena frontend development.
 * Provides realistic data matching all API contract types
 * so the UI works without a real backend.
 */

import type {
  User,
  Bot,
  ShopItem,
  Skill,
  SkillId,
  MatchType,
  RoundResult,
  MatchEndPayload,
  MatchBotState,
  StatusEffectEvent,
  RoundCompletePayload,
} from '../../shared/types'

// Re-export from constants (V2 skills)
import { ALL_SKILLS } from './constants'
export { ALL_SKILLS }

export const SKILL_LIST = Object.values(ALL_SKILLS)

// ============================================================
// Mock User
// ============================================================

export const MOCK_USER: User = {
  id: 'usr_001',
  username: 'NightStrike',
  credits: 2450,
  current_elo: 1523,
  peak_elo: 1587,
  total_matches: 87,
  wins: 52,
  losses: 35,
  created_at: '2025-12-15T10:30:00Z',
}

// ============================================================
// Mock Bot
// ============================================================

export const MOCK_BOT: Bot = {
  id: 'bot_001',
  user_id: 'usr_001',
  name: 'ShadowFang',
  public_key: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  level: 7,
  xp: 340,
  base_hp: 120,
  base_attack: 22,
  base_defense: 14,
  base_speed: 16,
  skin_id: 'skin_shadow',
  accessories: ['acc_power_core', 'acc_nano_shield'],
  skills: [
    { slot: 1, skill_id: 'fireball', cooldown_remaining: 0 },
    { slot: 2, skill_id: 'shield_wall', cooldown_remaining: 0 },
  ],
  created_at: '2025-12-15T10:35:00Z',
}

// ============================================================
// Mock Shop Items
// ============================================================

export const MOCK_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'item_001',
    name: 'Crimson Chassis',
    description: 'A sleek red armor plating that boosts your bot\'s defenses.',
    category: 'accessory',
    price: 200,
    rarity: 'common',
    hp_bonus: 0,
    attack_bonus: 0,
    defense_bonus: 3,
    speed_bonus: 0,
    limited_edition: false,
    stock_remaining: null,
  },
  {
    id: 'item_002',
    name: 'Plasma Core',
    description: 'Supercharged energy core that amplifies attack output.',
    category: 'accessory',
    price: 350,
    rarity: 'rare',
    hp_bonus: 0,
    attack_bonus: 5,
    defense_bonus: 0,
    speed_bonus: 0,
    limited_edition: false,
    stock_remaining: null,
  },
  {
    id: 'item_003',
    name: 'Quantum Accelerator',
    description: 'Bends spacetime to increase bot speed dramatically.',
    category: 'accessory',
    price: 500,
    rarity: 'epic',
    hp_bonus: 0,
    attack_bonus: 0,
    defense_bonus: 0,
    speed_bonus: 8,
    limited_edition: false,
    stock_remaining: null,
  },
  {
    id: 'item_004',
    name: 'Titan Plating',
    description: 'Legendary armor forged from collapsed star material. Massive HP boost.',
    category: 'accessory',
    price: 1200,
    rarity: 'legendary',
    hp_bonus: 30,
    attack_bonus: 0,
    defense_bonus: 5,
    speed_bonus: 0,
    limited_edition: true,
    stock_remaining: 5,
  },
  {
    id: 'item_005',
    name: 'Neon Skin: Viper',
    description: 'Glowing green neon skin with snake-eye patterns.',
    category: 'skin',
    price: 150,
    rarity: 'common',
    hp_bonus: 0,
    attack_bonus: 0,
    defense_bonus: 0,
    speed_bonus: 0,
    limited_edition: false,
    stock_remaining: null,
  },
  {
    id: 'item_006',
    name: 'Nano Shield',
    description: 'A lightweight shield that provides minor defense and HP.',
    category: 'accessory',
    price: 250,
    rarity: 'rare',
    hp_bonus: 10,
    attack_bonus: 0,
    defense_bonus: 2,
    speed_bonus: 0,
    limited_edition: false,
    stock_remaining: null,
  },
  {
    id: 'item_007',
    name: 'Victory Emote: Dab',
    description: 'Celebrate your wins in style.',
    category: 'emote',
    price: 100,
    rarity: 'common',
    hp_bonus: 0,
    attack_bonus: 0,
    defense_bonus: 0,
    speed_bonus: 0,
    limited_edition: false,
    stock_remaining: null,
  },
  {
    id: 'item_008',
    name: 'Void Skin: Abyss',
    description: 'Dark matter skin that warps light around your bot.',
    category: 'skin',
    price: 800,
    rarity: 'epic',
    hp_bonus: 0,
    attack_bonus: 0,
    defense_bonus: 0,
    speed_bonus: 0,
    limited_edition: false,
    stock_remaining: null,
  },
]

// ============================================================
// Mock Leaderboard
// ============================================================

export interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    username: string
  }
  elo: number
  wins: number
  losses: number
  win_rate: number
}

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, user: { id: 'usr_100', username: 'QuantumKill3r' }, elo: 1956, wins: 203, losses: 42, win_rate: 0.83 },
  { rank: 2, user: { id: 'usr_101', username: 'ByteStorm' }, elo: 1901, wins: 178, losses: 51, win_rate: 0.78 },
  { rank: 3, user: { id: 'usr_102', username: 'NeuralDeath' }, elo: 1877, wins: 165, losses: 55, win_rate: 0.75 },
  { rank: 4, user: { id: 'usr_103', username: 'SilentForge' }, elo: 1812, wins: 144, losses: 48, win_rate: 0.75 },
  { rank: 5, user: { id: 'usr_104', username: 'RustBucket99' }, elo: 1788, wins: 132, losses: 60, win_rate: 0.69 },
  { rank: 6, user: { id: 'usr_105', username: 'VoidWalker' }, elo: 1745, wins: 120, losses: 55, win_rate: 0.69 },
  { rank: 7, user: { id: 'usr_106', username: 'IronJaws' }, elo: 1698, wins: 115, losses: 67, win_rate: 0.63 },
  { rank: 8, user: { id: 'usr_107', username: 'DarkMatter_X' }, elo: 1665, wins: 110, losses: 70, win_rate: 0.61 },
  { rank: 9, user: { id: 'usr_108', username: 'CyberPunch' }, elo: 1634, wins: 102, losses: 68, win_rate: 0.60 },
  { rank: 10, user: { id: 'usr_109', username: 'BladeRunner42' }, elo: 1600, wins: 98, losses: 71, win_rate: 0.58 },
  { rank: 11, user: { id: 'usr_001', username: 'NightStrike' }, elo: 1523, wins: 52, losses: 35, win_rate: 0.60 },
  { rank: 12, user: { id: 'usr_110', username: 'TurboFlux' }, elo: 1498, wins: 88, losses: 72, win_rate: 0.55 },
  { rank: 13, user: { id: 'usr_111', username: 'GhostPilot' }, elo: 1455, wins: 80, losses: 70, win_rate: 0.53 },
  { rank: 14, user: { id: 'usr_112', username: 'NanoSwarm' }, elo: 1420, wins: 75, losses: 68, win_rate: 0.52 },
  { rank: 15, user: { id: 'usr_113', username: 'PixelSmash' }, elo: 1389, wins: 70, losses: 70, win_rate: 0.50 },
  { rank: 16, user: { id: 'usr_114', username: 'SteelVenom' }, elo: 1350, wins: 65, losses: 67, win_rate: 0.49 },
  { rank: 17, user: { id: 'usr_115', username: 'ZeroGravity' }, elo: 1290, wins: 58, losses: 62, win_rate: 0.48 },
  { rank: 18, user: { id: 'usr_116', username: 'ThunderByte' }, elo: 1245, wins: 50, losses: 55, win_rate: 0.48 },
  { rank: 19, user: { id: 'usr_117', username: 'CrashCode' }, elo: 1200, wins: 42, losses: 50, win_rate: 0.46 },
  { rank: 20, user: { id: 'usr_118', username: 'NewbSlayer' }, elo: 1150, wins: 30, losses: 40, win_rate: 0.43 },
]

// ============================================================
// Mock Match History
// ============================================================

export interface MatchHistoryEntry {
  id: string
  created_at: string
  my_bot: {
    id: string
    name: string
    elo_before: number
    elo_after: number
  }
  opponent: {
    id: string
    name: string
    elo_before: number
    elo_after: number
  }
  winner_id: string | null
  rounds_fought: number
  duration_seconds: number
  credits_won: number
  match_type: MatchType
  replay: RoundResult[]
}

function generateReplay(rounds: number, bot1StartHp: number, bot2StartHp: number): RoundResult[] {
  const results: RoundResult[] = []
  let b1hp = bot1StartHp
  let b2hp = bot2StartHp

  const actions: Array<'attack' | 'defend' | 'skill'> = ['attack', 'attack', 'attack', 'defend', 'skill']
  const targets: Array<'core' | 'armor' | 'processor'> = ['core', 'core', 'armor', 'processor']

  for (let i = 1; i <= rounds; i++) {
    const b1Action = actions[Math.floor(Math.random() * actions.length)]
    const b2Action = actions[Math.floor(Math.random() * actions.length)]
    const b1Target = b1Action === 'defend' ? null : targets[Math.floor(Math.random() * targets.length)]
    const b2Target = b2Action === 'defend' ? null : targets[Math.floor(Math.random() * targets.length)]

    const b1Dmg = b1Action === 'defend' ? 0 : Math.floor(Math.random() * 12) + 1
    const b2Dmg = b2Action === 'defend' ? 0 : Math.floor(Math.random() * 12) + 1

    b2hp = Math.max(0, b2hp - b1Dmg)
    b1hp = Math.max(0, b1hp - b2Dmg)

    const effects: StatusEffectEvent[] = []
    if (b1Action === 'skill') {
      effects.push({ bot: 'bot1', effect: 'fireball', duration: 2 })
      effects.push({ bot: 'bot2', effect: 'burning', duration: 2 })
    }
    if (b2Action === 'skill') {
      effects.push({ bot: 'bot2', effect: 'shield_wall', duration: 1 })
    }

    results.push({
      round: i,
      bot1_action: b1Action,
      bot1_target: b1Target,
      bot2_action: b2Action,
      bot2_target: b2Target,
      bot1_damage_dealt: b1Dmg,
      bot2_damage_dealt: b2Dmg,
      bot1_hp: b1hp,
      bot2_hp: b2hp,
      bot1_response_ms: Math.floor(Math.random() * 5000) + 500,
      bot2_response_ms: Math.floor(Math.random() * 5000) + 500,
      bot1_timed_out: false,
      bot2_timed_out: false,
      effects_applied: effects,
      bot1_counter: 'none' as const,
      bot2_counter: 'none' as const,
      bot1_momentum: 0,
      bot2_momentum: 0,
      bot1_energy: 100,
      bot2_energy: 100,
    })
  }

  return results
}

export const MOCK_MATCH_HISTORY: MatchHistoryEntry[] = [
  {
    id: 'match_001',
    created_at: '2026-02-06T12:30:00Z',
    my_bot: { id: 'bot_001', name: 'ShadowFang', elo_before: 1510, elo_after: 1523 },
    opponent: { id: 'bot_201', name: 'IronClad', elo_before: 1498, elo_after: 1485 },
    winner_id: 'bot_001',
    rounds_fought: 7,
    duration_seconds: 145,
    credits_won: 90,
    match_type: 'ranked_gold',
    replay: generateReplay(7, 120, 100),
  },
  {
    id: 'match_002',
    created_at: '2026-02-06T10:15:00Z',
    my_bot: { id: 'bot_001', name: 'ShadowFang', elo_before: 1530, elo_after: 1510 },
    opponent: { id: 'bot_202', name: 'PlasmaViper', elo_before: 1545, elo_after: 1565 },
    winner_id: 'bot_202',
    rounds_fought: 10,
    duration_seconds: 200,
    credits_won: 0,
    match_type: 'ranked_gold',
    replay: generateReplay(10, 120, 110),
  },
  {
    id: 'match_003',
    created_at: '2026-02-05T22:45:00Z',
    my_bot: { id: 'bot_001', name: 'ShadowFang', elo_before: 1495, elo_after: 1530 },
    opponent: { id: 'bot_203', name: 'NanoSwarm_v2', elo_before: 1510, elo_after: 1475 },
    winner_id: 'bot_001',
    rounds_fought: 6,
    duration_seconds: 120,
    credits_won: 180,
    match_type: 'ranked_silver',
    replay: generateReplay(6, 120, 100),
  },
  {
    id: 'match_004',
    created_at: '2026-02-05T18:30:00Z',
    my_bot: { id: 'bot_001', name: 'ShadowFang', elo_before: 1495, elo_after: 1495 },
    opponent: { id: 'bot_204', name: 'RustBucket_Jr', elo_before: 1500, elo_after: 1500 },
    winner_id: null,
    rounds_fought: 10,
    duration_seconds: 240,
    credits_won: 0,
    match_type: 'ranked_gold',
    replay: generateReplay(10, 120, 120),
  },
  {
    id: 'match_005',
    created_at: '2026-02-05T14:00:00Z',
    my_bot: { id: 'bot_001', name: 'ShadowFang', elo_before: 1480, elo_after: 1495 },
    opponent: { id: 'bot_205', name: 'CyberFist', elo_before: 1470, elo_after: 1455 },
    winner_id: 'bot_001',
    rounds_fought: 8,
    duration_seconds: 160,
    credits_won: 90,
    match_type: 'ranked_bronze',
    replay: generateReplay(8, 120, 100),
  },
  {
    id: 'match_006',
    created_at: '2026-02-04T20:00:00Z',
    my_bot: { id: 'bot_001', name: 'ShadowFang', elo_before: 1500, elo_after: 1480 },
    opponent: { id: 'bot_206', name: 'StormBreaker', elo_before: 1520, elo_after: 1540 },
    winner_id: 'bot_206',
    rounds_fought: 9,
    duration_seconds: 195,
    credits_won: 0,
    match_type: 'ranked_silver',
    replay: generateReplay(9, 120, 110),
  },
  {
    id: 'match_007',
    created_at: '2026-02-04T16:30:00Z',
    my_bot: { id: 'bot_001', name: 'ShadowFang', elo_before: 1465, elo_after: 1500 },
    opponent: { id: 'bot_207', name: 'DeathLoop', elo_before: 1490, elo_after: 1455 },
    winner_id: 'bot_001',
    rounds_fought: 5,
    duration_seconds: 100,
    credits_won: 90,
    match_type: 'ranked_bronze',
    replay: generateReplay(5, 120, 80),
  },
  {
    id: 'match_008',
    created_at: '2026-02-03T12:00:00Z',
    my_bot: { id: 'bot_001', name: 'ShadowFang', elo_before: 1445, elo_after: 1465 },
    opponent: { id: 'bot_208', name: 'GlitchBot', elo_before: 1430, elo_after: 1410 },
    winner_id: 'bot_001',
    rounds_fought: 4,
    duration_seconds: 85,
    credits_won: 90,
    match_type: 'ranked_bronze',
    replay: generateReplay(4, 120, 80),
  },
]

// ============================================================
// Mock Live Match Data (for match page simulation)
// ============================================================

export const MOCK_LIVE_MATCH_ROUNDS: RoundResult[] = [
  {
    round: 1,
    bot1_action: 'attack',
    bot1_target: 'core',
    bot2_action: 'defend',
    bot2_target: null,
    bot1_damage_dealt: 1,
    bot2_damage_dealt: 0,
    bot1_hp: 120,
    bot2_hp: 99,
    bot1_response_ms: 2100,
    bot2_response_ms: 1800,
    bot1_timed_out: false,
    bot2_timed_out: false,
    bot1_counter: 'none',
    bot2_counter: 'none',
    bot1_momentum: 0,
    bot2_momentum: 0,
    bot1_energy: 100,
    bot2_energy: 100,
    effects_applied: [],
  },
  {
    round: 2,
    bot1_action: 'skill',
    bot1_target: null,
    bot2_action: 'attack',
    bot2_target: 'processor',
    bot1_damage_dealt: 20,
    bot2_damage_dealt: 12,
    bot1_hp: 108,
    bot2_hp: 79,
    bot1_response_ms: 3200,
    bot2_response_ms: 2500,
    bot1_timed_out: false,
    bot2_timed_out: false,
    bot1_counter: 'none',
    bot2_counter: 'none',
    bot1_momentum: 0,
    bot2_momentum: 0,
    bot1_energy: 100,
    bot2_energy: 100,
    effects_applied: [
      { bot: 'bot2', effect: 'burning', duration: 2 },
    ],
  },
  {
    round: 3,
    bot1_action: 'attack',
    bot1_target: 'armor',
    bot2_action: 'skill',
    bot2_target: null,
    bot1_damage_dealt: 3,
    bot2_damage_dealt: 0,
    bot1_hp: 108,
    bot2_hp: 73,
    bot1_response_ms: 1500,
    bot2_response_ms: 4200,
    bot1_timed_out: false,
    bot2_timed_out: false,
    bot1_counter: 'none',
    bot2_counter: 'none',
    bot1_momentum: 0,
    bot2_momentum: 0,
    bot1_energy: 100,
    bot2_energy: 100,
    effects_applied: [
      { bot: 'bot2', effect: 'armor_broken', duration: 1 },
      { bot: 'bot2', effect: 'shield_wall', duration: 1 },
    ],
  },
  {
    round: 4,
    bot1_action: 'attack',
    bot1_target: 'core',
    bot2_action: 'attack',
    bot2_target: 'core',
    bot1_damage_dealt: 10,
    bot2_damage_dealt: 5,
    bot1_hp: 103,
    bot2_hp: 63,
    bot1_response_ms: 2800,
    bot2_response_ms: 3100,
    bot1_timed_out: false,
    bot2_timed_out: false,
    bot1_counter: 'none',
    bot2_counter: 'none',
    bot1_momentum: 0,
    bot2_momentum: 0,
    bot1_energy: 100,
    bot2_energy: 100,
    effects_applied: [],
  },
  {
    round: 5,
    bot1_action: 'defend',
    bot1_target: null,
    bot2_action: 'skill',
    bot2_target: null,
    bot1_damage_dealt: 0,
    bot2_damage_dealt: 0,
    bot1_hp: 103,
    bot2_hp: 71,
    bot1_response_ms: 1200,
    bot2_response_ms: 5500,
    bot1_timed_out: false,
    bot2_timed_out: false,
    bot1_counter: 'none',
    bot2_counter: 'none',
    bot1_momentum: 0,
    bot2_momentum: 0,
    bot1_energy: 100,
    bot2_energy: 100,
    effects_applied: [
      { bot: 'bot2', effect: 'regenerating', duration: 3 },
    ],
  },
  {
    round: 6,
    bot1_action: 'attack',
    bot1_target: 'processor',
    bot2_action: 'attack',
    bot2_target: 'armor',
    bot1_damage_dealt: 15,
    bot2_damage_dealt: 4,
    bot1_hp: 99,
    bot2_hp: 64,
    bot1_response_ms: 2200,
    bot2_response_ms: 2700,
    bot1_timed_out: false,
    bot2_timed_out: false,
    bot1_counter: 'none',
    bot2_counter: 'none',
    bot1_momentum: 0,
    bot2_momentum: 0,
    bot1_energy: 100,
    bot2_energy: 100,
    effects_applied: [
      { bot: 'bot2', effect: 'stunned', duration: 1 },
    ],
  },
  {
    round: 7,
    bot1_action: 'skill',
    bot1_target: null,
    bot2_action: 'defend',
    bot2_target: null,
    bot1_damage_dealt: 20,
    bot2_damage_dealt: 0,
    bot1_hp: 99,
    bot2_hp: 44,
    bot1_response_ms: 3800,
    bot2_response_ms: 0,
    bot1_timed_out: false,
    bot2_timed_out: true,
    bot1_counter: 'none',
    bot2_counter: 'none',
    bot1_momentum: 0,
    bot2_momentum: 0,
    bot1_energy: 100,
    bot2_energy: 100,
    effects_applied: [
      { bot: 'bot2', effect: 'burning', duration: 2 },
    ],
  },
  {
    round: 8,
    bot1_action: 'attack',
    bot1_target: 'core',
    bot2_action: 'attack',
    bot2_target: 'core',
    bot1_damage_dealt: 8,
    bot2_damage_dealt: 7,
    bot1_hp: 92,
    bot2_hp: 33,
    bot1_response_ms: 1800,
    bot2_response_ms: 2400,
    bot1_timed_out: false,
    bot2_timed_out: false,
    bot1_counter: 'none',
    bot2_counter: 'none',
    bot1_momentum: 0,
    bot2_momentum: 0,
    bot1_energy: 100,
    bot2_energy: 100,
    effects_applied: [],
  },
  {
    round: 9,
    bot1_action: 'attack',
    bot1_target: 'processor',
    bot2_action: 'defend',
    bot2_target: null,
    bot1_damage_dealt: 6,
    bot2_damage_dealt: 0,
    bot1_hp: 92,
    bot2_hp: 27,
    bot1_response_ms: 2100,
    bot2_response_ms: 3300,
    bot1_timed_out: false,
    bot2_timed_out: false,
    bot1_counter: 'none',
    bot2_counter: 'none',
    bot1_momentum: 0,
    bot2_momentum: 0,
    bot1_energy: 100,
    bot2_energy: 100,
    effects_applied: [],
  },
  {
    round: 10,
    bot1_action: 'attack',
    bot1_target: 'core',
    bot2_action: 'attack',
    bot2_target: 'core',
    bot1_damage_dealt: 27,
    bot2_damage_dealt: 5,
    bot1_hp: 87,
    bot2_hp: 0,
    bot1_response_ms: 1500,
    bot2_response_ms: 2900,
    bot1_timed_out: false,
    bot2_timed_out: false,
    bot1_counter: 'none',
    bot2_counter: 'none',
    bot1_momentum: 0,
    bot2_momentum: 0,
    bot1_energy: 100,
    bot2_energy: 100,
    effects_applied: [],
  },
]

export const MOCK_MATCH_END: MatchEndPayload = {
  match_id: 'match_live_001',
  result: 'win',
  rounds_fought: 10,
  duration_seconds: 210,
  winner: {
    bot_id: 'bot_001',
    name: 'ShadowFang',
    elo_before: 1510,
    elo_after: 1534,
    elo_change: 24,
    credits_won: 360,
  },
  loser: {
    bot_id: 'bot_opp_001',
    name: 'ChromeReaper',
    elo_before: 1540,
    elo_after: 1516,
    elo_change: -24,
    credits_lost: 200,
  },
  replay: MOCK_LIVE_MATCH_ROUNDS,
}

// ============================================================
// Tier helpers
// ============================================================

export type EloTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legend'

export function getEloTier(elo: number): EloTier {
  if (elo >= 1800) return 'legend'
  if (elo >= 1600) return 'platinum'
  if (elo >= 1400) return 'gold'
  if (elo >= 1200) return 'silver'
  return 'bronze'
}

export const TIER_COLORS: Record<EloTier, string> = {
  bronze: 'text-amber-600',
  silver: 'text-gray-400',
  gold: 'text-yellow-500',
  platinum: 'text-cyan-400',
  legend: 'text-yellow-400',
}

export const TIER_BG_COLORS: Record<EloTier, string> = {
  bronze: 'bg-amber-900/20 border-amber-700/30',
  silver: 'bg-gray-800/40 border-gray-600/30',
  gold: 'bg-yellow-900/20 border-yellow-700/30',
  platinum: 'bg-cyan-900/20 border-cyan-700/30',
  legend: 'bg-yellow-900/30 border-yellow-500/40',
}

export const RARITY_COLORS: Record<string, { text: string; bg: string; border: string; glow: string }> = {
  common: { text: 'text-gray-400', bg: 'bg-gray-800/50', border: 'border-gray-600/50', glow: '' },
  uncommon: { text: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-600/50', glow: '' },
  rare: { text: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-600/50', glow: 'shadow-[0_0_8px_rgba(52,152,219,0.15)]' },
  super_rare: { text: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-600/50', glow: 'shadow-[0_0_10px_rgba(155,89,182,0.2)]' },
  epic: { text: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-600/50', glow: 'shadow-purple-500/10' },
  legendary: { text: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-600/50', glow: 'shadow-[0_0_15px_rgba(243,156,18,0.3)]' },
}

// ============================================================
// Helper: load mock data into stores for dev
// ============================================================

export function loadMockData() {
  return {
    user: MOCK_USER,
    bots: [MOCK_BOT],
    token: 'mock_jwt_token_dev',
  }
}
