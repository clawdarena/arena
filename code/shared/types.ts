// Shared TypeScript types for OpenClaw Arena
// Both backend and frontend/plugin import from here
// Version: 0.2.0 (Trusted Referee Model)

// ============================================================
// Core Entities
// ============================================================

export interface User {
  id: string
  username: string
  credits: number
  current_elo: number
  peak_elo: number
  total_matches: number
  wins: number
  losses: number
  created_at: string
}

export interface Bot {
  id: string
  user_id: string
  name: string
  public_key: string       // Ed25519 public key for action signing
  level: number
  xp: number
  base_hp: number
  base_attack: number
  base_defense: number
  base_speed: number
  skin_id: string | null
  accessories: string[]    // max 3
  skills: EquippedSkill[]  // max 2 slots
  created_at: string
}

export interface ShopItem {
  id: string
  name: string
  description: string
  category: 'skin' | 'accessory' | 'stat_boost' | 'emote' | 'effect'
  price: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  hp_bonus: number
  attack_bonus: number
  defense_bonus: number
  speed_bonus: number
  limited_edition: boolean
  stock_remaining: number | null
}

// ============================================================
// Skills
// ============================================================

export type SkillTarget = 'opponent' | 'self'

export interface Skill {
  id: string
  name: string
  description: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  price: number
  cooldown: number         // rounds before reuse
  target: SkillTarget
}

export interface EquippedSkill {
  slot: 1 | 2
  skill_id: string
  cooldown_remaining: number  // 0 = ready
}

/** All available skills in the game */
export type SkillId =
  | 'power_strike'
  | 'shield_wall'
  | 'overclock'
  | 'scan'
  | 'fireball'
  | 'iron_fortress'
  | 'emp_blast'
  | 'regenerate'
  | 'berserker'
  | 'mirror_coat'

/** Status effects that can be applied during combat */
export type StatusEffect =
  | 'burning'          // 3 dmg/round for 2 rounds
  | 'stunned'          // Auto-defend for 1 round
  | 'armor_broken'     // -2 defense for 1 round
  | 'overclock'        // +5 attack, +5 speed for 2 rounds
  | 'iron_fortress'    // +10 defense, can't attack for 3 rounds
  | 'regenerating'     // +8 HP/round for 3 rounds
  | 'berserker'        // +15 attack, -5 defense for 3 rounds
  | 'mirror_coat'      // Reflect 50% damage for 2 rounds

// ============================================================
// Combat Types (Trusted Referee Model)
// ============================================================

/** Actions a bot can take each round */
export type CombatActionType = 'attack' | 'defend' | 'skill'

/** Targets for attack actions */
export type CombatTarget = 'core' | 'armor' | 'processor'

/**
 * What the CLIENT sends to the server.
 * Note: NO damage field. Server calculates all damage.
 */
export interface CombatAction {
  match_id: string
  round: number
  bot_id: string
  action: CombatActionType
  target: CombatTarget | null  // null if action is 'defend'
  skill_id: string | null      // required if action is 'skill'
  timestamp: number
  nonce: string
}

/** Signed combat action (what's actually emitted over WebSocket) */
export interface SignedCombatAction {
  action: CombatAction
  signature: string  // Ed25519 hex signature
}

/** Server-resolved round result */
export interface RoundResult {
  round: number
  bot1_action: CombatActionType
  bot1_target: CombatTarget | null
  bot2_action: CombatActionType
  bot2_target: CombatTarget | null
  bot1_damage_dealt: number
  bot2_damage_dealt: number
  bot1_hp: number
  bot2_hp: number
  bot1_response_ms: number
  bot2_response_ms: number
  bot1_timed_out: boolean
  bot2_timed_out: boolean
  effects_applied: StatusEffectEvent[]
  // Counter system
  bot1_counter: 'none' | 'attack_vs_skill' | 'defend_vs_attack' | 'skill_vs_defend'
  bot2_counter: 'none' | 'attack_vs_skill' | 'defend_vs_attack' | 'skill_vs_defend'
  bot1_momentum: number
  bot2_momentum: number
  bot1_energy: number
  bot2_energy: number
}

/** Status effects from skills */
export interface StatusEffectEvent {
  bot: 'bot1' | 'bot2'
  effect: string
  duration: number  // rounds remaining
}

// ============================================================
// Match Types
// ============================================================

export type MatchType =
  | 'ranked_bronze'
  | 'ranked_silver'
  | 'ranked_gold'
  | 'ranked_platinum'
  | 'ranked_legend'

export interface Match {
  id: string
  bot1_id: string
  bot2_id: string
  winner_id: string | null
  rounds_fought: number
  duration_seconds: number
  match_type: MatchType
  replay: RoundResult[]
  created_at: string
}

/** Bot stats as seen during a match (public gameplay data) */
export interface MatchBotState {
  id: string
  name: string
  hp: number
  attack: number
  defense: number
  speed: number
  status_effects: string[]
}

// ============================================================
// WebSocket Event Payloads
// ============================================================

export interface MatchFoundPayload {
  match_id: string
  match_type: MatchType
  entry_fee: number
  start_in_seconds: number
  my_bot: MatchBotState
  opponent: {
    name: string
    elo: number
  }
}

export interface MatchStartPayload {
  match_id: string
  max_rounds: number
  time_limit_seconds: number
  bot1: MatchBotState
  bot2: MatchBotState
  first_mover: 'bot1' | 'bot2'
}

export interface RoundStartPayload {
  match_id: string
  round: number
  time_limit_seconds: number
  bot1: { id: string; hp: number; status_effects: string[] }
  bot2: { id: string; hp: number; status_effects: string[] }
  previous_round: RoundResult | null
}

export interface RoundCompletePayload extends RoundResult {
  match_id: string
}

export interface MatchEndPayload {
  match_id: string
  result: 'win' | 'loss' | 'draw'
  rounds_fought: number
  duration_seconds: number
  winner: {
    bot_id: string
    name: string
    elo_before: number
    elo_after: number
    elo_change: number
    credits_won: number
  }
  loser: {
    bot_id: string
    name: string
    elo_before: number
    elo_after: number
    elo_change: number
    credits_lost: number
  }
  replay: RoundResult[]
}

// ============================================================
// Error Types
// ============================================================

export type ErrorCode =
  | 'INVALID_SIGNATURE'
  | 'WRONG_ROUND'
  | 'INVALID_ACTION'
  | 'TIMEOUT'
  | 'ALREADY_IN_QUEUE'
  | 'INSUFFICIENT_CREDITS'
  | 'ELO_TOO_LOW'
  | 'MATCH_NOT_FOUND'
  | 'DUPLICATE_NONCE'
  | 'STALE_TIMESTAMP'

export interface ArenaError {
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
}

// ============================================================
// Combat Resolution (Server-Side Reference)
// ============================================================

/**
 * Target modifiers for damage calculation.
 * Server uses these — included here for shared reference.
 */
export const TARGET_MODIFIERS: Record<CombatTarget, { defense_mult: number; special: string }> = {
  core: { defense_mult: 1.0, special: 'none' },
  armor: { defense_mult: 1.5, special: 'reduces_defense_by_2_next_round' },
  processor: { defense_mult: 0.5, special: '30pct_stun_chance' },
}

/**
 * Damage formula (server-side):
 *   base_damage = attacker.attack
 *   effective_defense = defender.defense * target_modifier
 *   if defender is defending: effective_defense *= 1.5
 *   damage = max(1, base_damage - effective_defense)
 */
