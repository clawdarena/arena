/**
 * Shared constants and types extracted from mock-api.ts.
 * Pages should import from here instead of mock-api.
 */

import type { Skill, SkillId } from '../../shared/types'

// ============================================================
// Skills Database (all 10 from COMBAT_SYSTEM.md)
// ============================================================

export const ALL_SKILLS: Record<SkillId, Skill> = {
  power_strike: {
    id: 'power_strike',
    name: 'Power Strike',
    description: 'Deal 1.5x attack damage, ignoring 50% of defense.',
    rarity: 'common',
    price: 0,
    cooldown: 3,
    target: 'opponent',
  },
  shield_wall: {
    id: 'shield_wall',
    name: 'Shield Wall',
    description: 'Block 100% of incoming damage this round and heal 5 HP.',
    rarity: 'common',
    price: 0,
    cooldown: 4,
    target: 'self',
  },
  overclock: {
    id: 'overclock',
    name: 'Overclock',
    description: '+5 attack and +5 speed for 2 rounds.',
    rarity: 'common',
    price: 0,
    cooldown: 4,
    target: 'self',
  },
  scan: {
    id: 'scan',
    name: 'Scan',
    description: "Reveal opponent's exact stats for the rest of the match.",
    rarity: 'common',
    price: 0,
    cooldown: 5,
    target: 'opponent',
  },
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    description: 'Deal 20 flat damage (ignores defense). Apply burning (3 dmg/round for 2 rounds).',
    rarity: 'rare',
    price: 300,
    cooldown: 4,
    target: 'opponent',
  },
  iron_fortress: {
    id: 'iron_fortress',
    name: 'Iron Fortress',
    description: '+10 defense for 3 rounds. Cannot attack while active.',
    rarity: 'rare',
    price: 300,
    cooldown: 5,
    target: 'self',
  },
  emp_blast: {
    id: 'emp_blast',
    name: 'EMP Blast',
    description: "Stun opponent for 1 round. Reset opponent's skill cooldowns to max.",
    rarity: 'epic',
    price: 600,
    cooldown: 6,
    target: 'opponent',
  },
  regenerate: {
    id: 'regenerate',
    name: 'Regenerate',
    description: 'Heal 8 HP per round for 3 rounds.',
    rarity: 'epic',
    price: 600,
    cooldown: 5,
    target: 'self',
  },
  berserker: {
    id: 'berserker',
    name: 'Berserker Rage',
    description: '+15 attack for 3 rounds, but -5 defense for same duration.',
    rarity: 'legendary',
    price: 1000,
    cooldown: 7,
    target: 'self',
  },
  mirror_coat: {
    id: 'mirror_coat',
    name: 'Mirror Coat',
    description: 'Reflect 50% of incoming damage back to attacker for 2 rounds.',
    rarity: 'legendary',
    price: 1000,
    cooldown: 6,
    target: 'self',
  },
}

export const SKILL_LIST = Object.values(ALL_SKILLS)

// ============================================================
// Leaderboard types
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

// ============================================================
// Match History types
// ============================================================

import type { MatchType, RoundResult } from '../../shared/types'

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
  legendary: { text: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-600/50', glow: 'shadow-[0_0_15px_rgba(243,156,18,0.3)]' },
}
