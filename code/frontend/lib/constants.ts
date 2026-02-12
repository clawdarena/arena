/**
 * Shared constants and types for Combat V2.
 * 16 skills across 4 categories.
 */

import type { Skill, SkillId, MatchType, RoundResult } from '../../shared/types'

// ============================================================
// V2 Skills Database (16 skills)
// ============================================================

export const ALL_SKILLS: Record<SkillId, Skill> = {
  // Defensive
  firewall: { id: 'firewall', name: 'Firewall', description: 'Block 100% of next incoming attack.', rarity: 'common', price: 0, cooldown: 3, target: 'self' },
  iron_fortress: { id: 'iron_fortress', name: 'Iron Fortress', description: '+80% DEF for 2 rounds. Cannot attack while active.', rarity: 'epic', price: 600, cooldown: 5, target: 'self' },
  mirror_coat: { id: 'mirror_coat', name: 'Mirror Coat', description: 'Reflect 50% incoming damage for 1 round.', rarity: 'epic', price: 600, cooldown: 5, target: 'self' },
  rollback: { id: 'rollback', name: 'Rollback', description: 'Heal 15-20 HP. Max 2 uses per match.', rarity: 'rare', price: 300, cooldown: 4, target: 'self' },
  // Aggressive
  power_strike: { id: 'power_strike', name: 'Power Strike', description: 'Reliable damage (12-18).', rarity: 'common', price: 0, cooldown: 2, target: 'opponent' },
  reasoning_burst: { id: 'reasoning_burst', name: 'Reasoning Burst', description: 'High damage energy beam (20-28).', rarity: 'rare', price: 300, cooldown: 4, target: 'opponent' },
  spawn_attack: { id: 'spawn_attack', name: 'Spawn Attack', description: 'Multi-hit 3x (5-8 each). Breaks shields.', rarity: 'rare', price: 300, cooldown: 3, target: 'opponent' },
  berserker_rush: { id: 'berserker_rush', name: 'Berserker Rush', description: '25 damage + 8 self-damage.', rarity: 'epic', price: 600, cooldown: 3, target: 'opponent' },
  // Tactical
  sleep_bomb: { id: 'sleep_bomb', name: 'Sleep Bomb', description: '60% chance opponent skips next turn.', rarity: 'common', price: 0, cooldown: 4, target: 'opponent' },
  emp_pulse: { id: 'emp_pulse', name: 'EMP Pulse', description: 'Drain 30 energy from opponent.', rarity: 'rare', price: 300, cooldown: 3, target: 'opponent' },
  time_bomb: { id: 'time_bomb', name: 'Time Bomb', description: 'Plant bomb. Explodes in 2 rounds for 25 damage.', rarity: 'epic', price: 600, cooldown: 5, target: 'opponent' },
  overclock: { id: 'overclock', name: 'Overclock', description: 'Skip turn. Next attack does +50% damage.', rarity: 'epic', price: 600, cooldown: 4, target: 'self' },
  // Exploit
  scan: { id: 'scan', name: 'Scan', description: "Reveal opponent's next move for 1 round.", rarity: 'common', price: 0, cooldown: 5, target: 'opponent' },
  prompt_injection: { id: 'prompt_injection', name: 'Prompt Injection', description: "40% chance opponent's move targets themselves.", rarity: 'legendary', price: 1000, cooldown: 5, target: 'opponent' },
  memory_bomb: { id: 'memory_bomb', name: 'Memory Bomb', description: "Disable opponent's last-used move for 2 rounds.", rarity: 'legendary', price: 1000, cooldown: 5, target: 'opponent' },
  virus: { id: 'virus', name: 'Virus', description: '5 damage/round for 3 rounds (DOT).', rarity: 'epic', price: 600, cooldown: 4, target: 'opponent' },
}

// Legacy skill IDs → V2 mapping
export const LEGACY_SKILL_MAP: Record<string, SkillId> = {
  shield_wall: 'firewall',
  fireball: 'reasoning_burst',
  emp_blast: 'emp_pulse',
  regenerate: 'rollback',
  berserker: 'berserker_rush',
}

// Free starter skills (auto-owned by all users)
export const STARTER_SKILLS: SkillId[] = ['firewall', 'power_strike', 'sleep_bomb', 'scan']

// Skill categories
export const SKILL_CATEGORIES = ['defensive', 'aggressive', 'tactical', 'exploit'] as const

// ============================================================
// Match History
// ============================================================

export interface MatchHistoryEntry {
  id: string
  created_at: string
  my_bot: { id: string; name: string; elo_before: number; elo_after: number }
  opponent: { id: string; name: string; elo_before: number; elo_after: number }
  winner_id: string | null
  rounds_fought: number
  duration_seconds: number
  credits_won: number
  match_type: MatchType
  replay: RoundResult[]
}

// ============================================================
// ELO Tiers
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
  epic: { text: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-600/50', glow: 'shadow-[0_0_10px_rgba(155,89,182,0.2)]' },
  legendary: { text: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-600/50', glow: 'shadow-[0_0_15px_rgba(243,156,18,0.3)]' },
}

// ============================================================
// Leaderboard
// ============================================================

export interface LeaderboardEntry {
  rank: number
  user: { id: string; username: string }
  elo: number
  wins: number
  losses: number
  win_rate: number
}

// Skill energy costs
export const SKILL_ENERGY: Record<string, number> = {
  firewall: 15, iron_fortress: 20, mirror_coat: 25, rollback: 20,
  power_strike: 10, reasoning_burst: 30, spawn_attack: 20, berserker_rush: 15,
  sleep_bomb: 20, emp_pulse: 15, time_bomb: 20, overclock: 10,
  scan: 15, prompt_injection: 25, memory_bomb: 20, virus: 15,
}
