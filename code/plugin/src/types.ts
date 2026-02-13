/**
 * Combat V2 Types
 *
 * Defines plugin contracts aligned with backend REST/WS schema.
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

  // Exploit (debuffs/special effects)
  'scan',
  'prompt_injection',
  'memory_bomb',
  'virus',
] as const

export type SkillId = (typeof SKILL_IDS)[number]

export type SkillCategory = 'aggressive' | 'defensive' | 'tactical' | 'exploit'

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

/**** Round start event from backend WS (before sanitization). */
export interface RawRoundStart {
  match_id: string
  round: number
  time_limit_seconds?: number
  bot1: {
    id: string
    hp: number
    energy: number
    status_effects?: string[]
    skill_cooldowns?: Record<string, number>
    disabled_skills?: string[]
  }
  bot2: {
    id: string
    hp: number
    energy: number
    status_effects?: string[]
    skill_cooldowns?: Record<string, number>
    disabled_skills?: string[]
  }
  previous_round?: {
    bot1_skill_id?: string
    bot2_skill_id?: string
    bot1_damage_dealt?: number
    bot2_damage_dealt?: number
  }
}

/**
 * Sanitized combat state - safe for agent consumption.
 */
export interface SanitizedCombatState {
  round: number
  my_hp: number
  opponent_hp: number
  my_energy: number
  available_skills: MatchSkillInfo[]
  opponent_last_skill: SkillId | null
  status_effects: string[]
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
 * Signed combat action payload sent through plugin_combat_action event.
 */
export interface SignedCombatAction {
  action: 'attack' | 'defend' | 'skill'
  target: 'opponent' | null
  skill_id?: SkillId | null
}

// ============================================================================
// EVENTS
// ============================================================================

/**** Match start event from backend WS. */
export interface MatchStartEvent {
  match_id: string
  bot1: {
    id: string
    name?: string
    skills?: Array<{
      id: string
      category?: string
      energyCost?: number
      cooldown?: number
      name?: string
    }>
  }
  bot2: {
    id: string
    name?: string
    skills?: Array<{
      id: string
      category?: string
      energyCost?: number
      cooldown?: number
      name?: string
    }>
  }
  max_rounds: number
  time_limit_seconds: number
}

/**** Round complete event from backend WS. */
export interface RoundCompleteEvent {
  round: number
  bot1_hp: number
  bot2_hp: number
  bot1_skill_id?: string
  bot2_skill_id?: string
  bot1_damage_dealt: number
  bot2_damage_dealt: number
}

/**** Match end event from backend WS. */
export interface MatchEndEvent {
  winner: {
    bot_id: string
    elo_before?: number
    elo_after?: number
    elo_change?: number
    credits_won?: number
  } | null
  loser: {
    bot_id: string
    elo_before?: number
    elo_after?: number
    elo_change?: number
    credits_lost?: number
  } | null
  rounds_fought: number
  result?: 'win' | 'loss' | 'draw'
}

// ============================================================================
// PLUGIN CONFIG
// ============================================================================

export interface ArenaPluginConfig {
  apiUrl: string
  token?: string
  botId?: string
  autoConnect?: boolean
}
