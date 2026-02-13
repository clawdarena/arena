/**
 * ADR-003 Trust Boundary Sanitizer
 *
 * This module enforces the security boundary between server messages and
 * agent prompts. It whitelists allowed fields and validates all data types.
 *
 * CRITICAL SECURITY RULES:
 * - NEVER forward raw strings from server to agent
 * - NEVER include opponent names, chat messages, or custom text
 * - ONLY pass structured data: numbers and known enum values
 * - Validate all incoming data against expected types
 */

import {
  type SkillId,
  type MatchSkillInfo,
  type SanitizedCombatState,
  type RawRoundStart,
  type RoundHistoryEntry,
  SKILL_IDS,
} from './types.js'

// ============================================================================
// KNOWN ENUMS - Only these values are allowed through
// ============================================================================

const VALID_SKILL_IDS = new Set<string>(SKILL_IDS)

const VALID_STATUS_EFFECTS = new Set([
  'stunned',
  'burning',
  'poisoned',
  'slowed',
  'weakened',
  'shielded',
  'overclocked',
  'scanned',
  'infected',
])

const VALID_SKILL_CATEGORIES = new Set([
  'aggressive',
  'defensive',
  'tactical',
  'exploit',
])

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if a value is a valid skill ID.
 */
export function isValidSkillId(value: unknown): value is SkillId {
  return typeof value === 'string' && VALID_SKILL_IDS.has(value)
}

/**
 * Check if a value is a valid status effect.
 */
export function isValidStatusEffect(value: unknown): value is string {
  return typeof value === 'string' && VALID_STATUS_EFFECTS.has(value)
}

/**
 * Check if a value is a valid skill category.
 */
export function isValidSkillCategory(value: unknown): value is string {
  return typeof value === 'string' && VALID_SKILL_CATEGORIES.has(value)
}

/**
 * Validate and clamp a number to safe bounds.
 */
function sanitizeNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }
  return Math.max(min, Math.min(max, Math.round(value)))
}

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitize skill cooldowns from server data.
 * Only allows known skill IDs and validates cooldown values.
 */
function sanitizeSkillCooldowns(
  raw: unknown
): Record<SkillId, number> {
  const result: Record<string, number> = {}

  if (!raw || typeof raw !== 'object') {
    return result as Record<SkillId, number>
  }

  for (const [key, value] of Object.entries(raw)) {
    if (isValidSkillId(key)) {
      result[key] = sanitizeNumber(value, 0, 10, 0)
    }
    // Unknown keys are silently dropped (security)
  }

  return result as Record<SkillId, number>
}

/**
 * Sanitize disabled skills list.
 * Only allows known skill IDs.
 */
function sanitizeDisabledSkills(raw: unknown): SkillId[] {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw.filter(isValidSkillId)
}

/**
 * Sanitize status effects list.
 * Only allows known effect names.
 */
function sanitizeStatusEffects(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw.filter(isValidStatusEffect)
}

/**
 * Sanitize skill info for agent consumption.
 * Strips any untrusted fields and validates all values.
 */
export function sanitizeSkillInfo(raw: unknown): MatchSkillInfo | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const obj = raw as Record<string, unknown>

  // Validate skill ID (required)
  if (!isValidSkillId(obj.id)) {
    return null
  }

  // Get known skill name (from our definitions, not server)
  const name = getKnownSkillName(obj.id)

  // Validate category
  const category = isValidSkillCategory(obj.category)
    ? obj.category
    : 'aggressive'

  return {
    id: obj.id,
    name,
    category: category as MatchSkillInfo['category'],
    energyCost: sanitizeNumber(obj.energyCost, 0, 100, 10),
    cooldownLeft: sanitizeNumber(obj.cooldownLeft, 0, 10, 0),
    disabled: obj.disabled === true,
  }
}

/**
 * Get the known name for a skill ID.
 * We use our own definitions, never trust server-provided names.
 */
function getKnownSkillName(skillId: SkillId): string {
  const SKILL_NAMES: Record<SkillId, string> = {
    basic_attack: 'Basic Attack',
    power_strike: 'Power Strike',
    reasoning_burst: 'Reasoning Burst',
    spawn_attack: 'Spawn Attack',
    berserker_rush: 'Berserker Rush',
    firewall: 'Firewall',
    iron_fortress: 'Iron Fortress',
    mirror_coat: 'Mirror Coat',
    rollback: 'Rollback',
    sleep_bomb: 'Sleep Bomb',
    emp_pulse: 'EMP Pulse',
    time_bomb: 'Time Bomb',
    overclock: 'Overclock',
    agent_overflow: 'Agent Overflow',
    scan: 'Scan',
    prompt_injection: 'Prompt Injection',
    memory_bomb: 'Memory Bomb',
    virus: 'Virus',
  }

  return SKILL_NAMES[skillId] || skillId
}

// ============================================================================
// MAIN SANITIZATION ENTRY POINT
// ============================================================================

/**
 * Sanitize raw round start data into a safe combat state.
 *
 * This is the MAIN TRUST BOUNDARY. All server data passes through here
 * before being sent to the agent.
 *
 * @param raw - Raw round_start event from server
 * @param myBotId - Our bot's ID to determine which data is "ours"
 * @param equippedSkills - List of equipped skill definitions
 * @param roundHistory - Previous rounds (already sanitized)
 */
export function sanitizeRoundStart(
  raw: RawRoundStart,
  myBotId: string,
  equippedSkills: MatchSkillInfo[],
  roundHistory: RoundHistoryEntry[]
): SanitizedCombatState {
  // Validate required fields
  const round = sanitizeNumber(raw.round, 1, 100, 1)

  // Determine which HP values are ours vs opponent's
  // The server tells us bot1/bot2 HP - we need to know which we are
  // For now, assume bot1 is always "us" - service layer handles the mapping
  const myHp = sanitizeNumber(raw.bot1_hp, 0, 999, 100)
  const opponentHp = sanitizeNumber(raw.bot2_hp, 0, 999, 100)
  const myEnergy = sanitizeNumber(raw.energy, 0, 200, 100)

  // Sanitize skill cooldowns
  const cooldowns = sanitizeSkillCooldowns(raw.skill_cooldowns)
  const disabledSkills = sanitizeDisabledSkills(raw.disabled_skills)

  // Build available skills with current cooldown state
  const availableSkills = equippedSkills.map((skill) => ({
    ...skill,
    cooldownLeft: cooldowns[skill.id] ?? 0,
    disabled: disabledSkills.includes(skill.id),
  }))

  // Get opponent's last skill (validated)
  let opponentLastSkill: SkillId | null = null
  if (raw.previous_round?.bot2_skill_id) {
    const skillId = raw.previous_round.bot2_skill_id
    if (isValidSkillId(skillId)) {
      opponentLastSkill = skillId
    }
  }

  // Sanitize status effects
  const statusEffects = sanitizeStatusEffects(raw.status_effects)

  return {
    round,
    my_hp: myHp,
    opponent_hp: opponentHp,
    my_energy: myEnergy,
    available_skills: availableSkills,
    opponent_last_skill: opponentLastSkill,
    status_effects: statusEffects,
    round_history: roundHistory, // Already sanitized
  }
}

/**
 * Validate an agent's skill choice.
 * Ensures the chosen skill is valid and available.
 */
export function validateSkillChoice(
  skillId: unknown,
  availableSkills: MatchSkillInfo[],
  currentEnergy: number
): { valid: true; skillId: SkillId } | { valid: false; reason: string; fallback: SkillId } {
  // Must be a valid skill ID
  if (!isValidSkillId(skillId)) {
    return {
      valid: false,
      reason: `Invalid skill ID: ${String(skillId)}`,
      fallback: 'basic_attack',
    }
  }

  // Find the skill in available skills
  const skill = availableSkills.find((s) => s.id === skillId)
  if (!skill) {
    return {
      valid: false,
      reason: `Skill not equipped: ${skillId}`,
      fallback: 'basic_attack',
    }
  }

  // Check cooldown
  if (skill.cooldownLeft > 0) {
    return {
      valid: false,
      reason: `Skill on cooldown: ${skillId} (${skill.cooldownLeft} rounds left)`,
      fallback: 'basic_attack',
    }
  }

  // Check disabled
  if (skill.disabled) {
    return {
      valid: false,
      reason: `Skill disabled: ${skillId}`,
      fallback: 'basic_attack',
    }
  }

  // Check energy
  if (skill.energyCost > currentEnergy) {
    return {
      valid: false,
      reason: `Not enough energy for ${skillId} (need ${skill.energyCost}, have ${currentEnergy})`,
      fallback: 'basic_attack',
    }
  }

  return { valid: true, skillId }
}

/**
 * Sanitize a round history entry from server data.
 */
export function sanitizeRoundHistoryEntry(
  round: number,
  mySkillId: unknown,
  opponentSkillId: unknown,
  damageDealt: unknown,
  damageTaken: unknown
): RoundHistoryEntry | null {
  if (!isValidSkillId(mySkillId) || !isValidSkillId(opponentSkillId)) {
    return null
  }

  return {
    round: sanitizeNumber(round, 1, 100, 1),
    my_skill: mySkillId,
    opponent_skill: opponentSkillId,
    damage_dealt: sanitizeNumber(damageDealt, 0, 999, 0),
    damage_taken: sanitizeNumber(damageTaken, 0, 999, 0),
  }
}
