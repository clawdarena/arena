/**
 * Combat V2 Types
 *
 * Defines all types for the 16-skill Combat V2 system with energy,
 * cooldowns, and 4-skill loadouts.
 */

// ============================================================================
// SKILLS
// ============================================================================

/**
 * All available Combat V2 skills.
 * Each bot has 4 equipped skills + basic_attack (always available).
 */
export const SKILL_IDS = [
  // Always available
  'basic_attack',

  // Aggressive (damage focused)
  'power_strike',
  'reasoning_burst',
  'spawn_attack',
  'berserker_rush',

  // Defensive (survival focused)
  'firewall',
  'iron_fortress',
  'mirror_coat',
  'rollback',

  // Tactical (utility/control)
  'sleep_bomb',
  'emp_pulse',
  'time_bomb',
  'overclock',
  'agent_overflow',

  // Exploit (debuffs/special effects)
  'scan',
  'prompt_injection',
  'memory_bomb',
  'virus',
] as const

export type SkillId = (typeof SKILL_IDS)[number]

export type SkillCategory = 'aggressive' | 'defensive' | 'tactical' | 'exploit'

/**
 * Skill definition with all combat properties.
 */
export interface SkillDefinition {
  id: SkillId
  name: string
  category: SkillCategory
  energyCost: number
  cooldown: number // rounds
  description: string
  damage?: number
  effect?: string
}

/**
 * Runtime skill info during a match (with cooldown state).
 */
export interface MatchSkillInfo {
  id: SkillId
  name: string
  category: SkillCategory
  energyCost: number
  cooldownLeft: number
  disabled: boolean
}

// ============================================================================
// COMBAT STATE
// ============================================================================

/**
 * Full match state from server (before sanitization).
 */
export interface RawMatchState {
  match_id: string
  bot1: {
    id: string
    name?: string // UNTRUSTED - never pass to agent
    hp: number
    energy: number
  }
  bot2: {
    id: string
    name?: string // UNTRUSTED - never pass to agent
    hp: number
    energy: number
  }
  skills: Array<{
    id: string
    name?: string
    energyCost?: number
    cooldownLeft?: number
    category?: string
  }>
}

/**
 * Round start event from server (before sanitization).
 */
export interface RawRoundStart {
  match_id: string
  round: number
  bot1_hp: number
  bot2_hp: number
  energy: number
  skill_cooldowns: Record<string, number>
  disabled_skills: string[]
  time_limit_seconds?: number
  status_effects?: string[]
  previous_round?: {
    bot1_skill_id?: string
    bot2_skill_id?: string
    bot1_damage_dealt?: number
    bot2_damage_dealt?: number
  }
}

/**
 * Sanitized combat state - safe for agent consumption.
 * Contains ONLY structured data: numbers, known enums.
 * NEVER contains raw strings from server.
 */
export interface SanitizedCombatState {
  round: number
  my_hp: number
  opponent_hp: number
  my_energy: number
  available_skills: MatchSkillInfo[]
  opponent_last_skill: SkillId | null
  status_effects: string[] // Only from known enum
  round_history: RoundHistoryEntry[]
}

export interface RoundHistoryEntry {
  round: number
  my_skill: SkillId
  opponent_skill: SkillId
  damage_dealt: number
  damage_taken: number
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Combat action submitted to server.
 */
export interface CombatAction {
  match_id: string
  action: 'skill'
  skill_id: SkillId
}

/**
 * Signed combat action envelope.
 */
export interface SignedCombatAction {
  match_id: string
  round: number
  bot_id: string
  action: 'skill'
  skill_id: SkillId
  timestamp: number
  nonce: string
}

/**
 * Parsed action from agent response.
 */
export interface ParsedSkillAction {
  skill_id: SkillId
  reasoning: string | null // Stays LOCAL
}

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Match start event from server.
 */
export interface MatchStartEvent {
  match_id: string
  bot1: { id: string; name?: string }
  bot2: { id: string; name?: string }
  skills: MatchSkillInfo[]
  max_rounds: number
  time_limit_seconds: number
}

/**
 * Round complete event from server.
 */
export interface RoundCompleteEvent {
  round: number
  bot1_hp_after: number
  bot2_hp_after: number
  bot1_skill_id: string
  bot2_skill_id: string
  bot1_damage_dealt: number
  bot2_damage_dealt: number
}

/**
 * Match end event from server.
 */
export interface MatchEndEvent {
  winner: {
    bot_id: string
    elo_before: number
    elo_after: number
    elo_change: number
    credits_won: number
    xp_earned: number
  }
  loser: {
    bot_id: string
    elo_before: number
    elo_after: number
    elo_change: number
    credits_lost: number
    xp_earned: number
  }
  rounds_fought: number
}

// ============================================================================
// PLUGIN CONFIG
// ============================================================================

/**
 * Plugin configuration from openclaw.json.
 */
export interface ArenaPluginConfig {
  apiUrl: string
  token?: string
  botId?: string
  autoConnect?: boolean
}
