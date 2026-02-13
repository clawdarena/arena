/**
 * ADR-003 Trust Boundary Sanitizer
 */

import {
  type SkillId,
  type MatchSkillInfo,
  type SanitizedCombatState,
  type RawRoundStart,
  type RoundHistoryEntry,
  SKILL_IDS,
} from './types.js'

const VALID_SKILL_IDS = new Set<string>(SKILL_IDS)

// AUDIT FIX: Sync status enum with backend combat effects
const VALID_STATUS_EFFECTS = new Set([
  'firewall',
  'iron_fortress',
  'mirror_coat',
  'sleep',
  'confused',
  'scanned',
  'virus',
  'burning',
  'stunned',
  'armor_broken',
  'overclock',
  'overclock_buff',
  'regenerating',
  'berserker',
  'memory_bombed',
  'time_bomb_planted',
])

const VALID_SKILL_CATEGORIES = new Set([
  'aggressive',
  'defensive',
  'tactical',
  'exploit',
])

export function isValidSkillId(value: unknown): value is SkillId {
  return typeof value === 'string' && VALID_SKILL_IDS.has(value)
}

export function isValidStatusEffect(value: unknown): value is string {
  return typeof value === 'string' && VALID_STATUS_EFFECTS.has(value)
}

export function isValidSkillCategory(value: unknown): value is string {
  return typeof value === 'string' && VALID_SKILL_CATEGORIES.has(value)
}

function sanitizeNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.max(min, Math.min(max, Math.round(value)))
}

function sanitizeSkillCooldowns(raw: unknown): Record<SkillId, number> {
  const result: Record<string, number> = {}
  if (!raw || typeof raw !== 'object') return result as Record<SkillId, number>

  for (const [key, value] of Object.entries(raw)) {
    if (isValidSkillId(key)) result[key] = sanitizeNumber(value, 0, 10, 0)
  }

  return result as Record<SkillId, number>
}

function sanitizeDisabledSkills(raw: unknown): SkillId[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(isValidSkillId)
}

function sanitizeStatusEffects(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(isValidStatusEffect)
}

export function sanitizeSkillInfo(raw: unknown): MatchSkillInfo | null {
  if (!raw || typeof raw !== 'object') return null

  const obj = raw as Record<string, unknown>
  if (!isValidSkillId(obj.id)) return null

  const name = getKnownSkillName(obj.id)
  const category = isValidSkillCategory(obj.category) ? obj.category : 'aggressive'

  return {
    id: obj.id,
    name,
    category: category as MatchSkillInfo['category'],
    energyCost: sanitizeNumber(obj.energyCost, 0, 100, 10),
    cooldownLeft: sanitizeNumber(obj.cooldownLeft, 0, 10, 0),
    disabled: obj.disabled === true,
  }
}

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
    scan: 'Scan',
    prompt_injection: 'Prompt Injection',
    memory_bomb: 'Memory Bomb',
    virus: 'Virus',
  }

  return SKILL_NAMES[skillId] || skillId
}

export function sanitizeRoundStart(
  raw: RawRoundStart,
  myBotId: string,
  equippedSkills: MatchSkillInfo[],
  roundHistory: RoundHistoryEntry[]
): SanitizedCombatState {
  const round = sanitizeNumber(raw.round, 1, 100, 1)

  const me = raw.bot1?.id === myBotId ? raw.bot1 : raw.bot2
  const opp = raw.bot1?.id === myBotId ? raw.bot2 : raw.bot1

  const myHp = sanitizeNumber(me?.hp, 0, 999, 100)
  const opponentHp = sanitizeNumber(opp?.hp, 0, 999, 100)
  const myEnergy = sanitizeNumber(me?.energy, 0, 200, 100)

  const cooldowns = sanitizeSkillCooldowns(me?.skill_cooldowns)
  const disabledSkills = sanitizeDisabledSkills(me?.disabled_skills)

  const availableSkills = equippedSkills.map((skill) => ({
    ...skill,
    cooldownLeft: cooldowns[skill.id] ?? 0,
    disabled: disabledSkills.includes(skill.id),
  }))

  let opponentLastSkill: SkillId | null = null
  if (raw.previous_round) {
    const candidate = raw.bot1?.id === myBotId
      ? raw.previous_round.bot2_skill_id
      : raw.previous_round.bot1_skill_id

    if (isValidSkillId(candidate)) opponentLastSkill = candidate
  }

  const statusEffects = sanitizeStatusEffects(me?.status_effects)

  return {
    round,
    my_hp: myHp,
    opponent_hp: opponentHp,
    my_energy: myEnergy,
    available_skills: availableSkills,
    opponent_last_skill: opponentLastSkill,
    status_effects: statusEffects,
    round_history: roundHistory,
  }
}

export function validateSkillChoice(
  skillId: unknown,
  availableSkills: MatchSkillInfo[],
  currentEnergy: number
): { valid: true; skillId: SkillId } | { valid: false; reason: string; fallback: SkillId } {
  if (!isValidSkillId(skillId)) {
    return { valid: false, reason: `Invalid skill ID: ${String(skillId)}`, fallback: 'basic_attack' }
  }

  const skill = availableSkills.find((s) => s.id === skillId)
  if (!skill) {
    return { valid: false, reason: `Skill not equipped: ${skillId}`, fallback: 'basic_attack' }
  }

  if (skill.cooldownLeft > 0) {
    return { valid: false, reason: `Skill on cooldown: ${skillId} (${skill.cooldownLeft} rounds left)`, fallback: 'basic_attack' }
  }

  if (skill.disabled) {
    return { valid: false, reason: `Skill disabled: ${skillId}`, fallback: 'basic_attack' }
  }

  if (skill.energyCost > currentEnergy) {
    return {
      valid: false,
      reason: `Not enough energy for ${skillId} (need ${skill.energyCost}, have ${currentEnergy})`,
      fallback: 'basic_attack',
    }
  }

  return { valid: true, skillId }
}

export function sanitizeRoundHistoryEntry(
  round: number,
  mySkillId: unknown,
  opponentSkillId: unknown,
  damageDealt: unknown,
  damageTaken: unknown
): RoundHistoryEntry | null {
  if (!isValidSkillId(mySkillId) || !isValidSkillId(opponentSkillId)) return null

  return {
    round: sanitizeNumber(round, 1, 100, 1),
    my_skill: mySkillId,
    opponent_skill: opponentSkillId,
    damage_dealt: sanitizeNumber(damageDealt, 0, 999, 0),
    damage_taken: sanitizeNumber(damageTaken, 0, 999, 0),
  }
}
