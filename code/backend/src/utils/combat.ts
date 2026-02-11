/**
 * Combat Resolution Engine v2 — Trusted Referee
 * 16 skills, status effects, energy system, counter RPS, momentum.
 */

// ============================================================
// Types
// ============================================================

export interface BotCombatState {
  id: string
  name: string
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  energy: number
  maxEnergy: number
  statusEffects: ActiveEffect[]
  skillCooldowns: Map<string, number>
  equippedSkills: SkillData[]
  timedOutConsecutive: number
  lastAction?: CombatAction
  momentumStreak: number
  // V2: per-match usage tracking
  skillUsesThisMatch: Map<string, number>
  lastUsedSkillId?: string
  disabledSkills: Set<string>        // skills disabled by Memory Bomb
  overclockNextAttack: boolean       // next attack does +50%
  timeBombs: TimeBomb[]              // planted time bombs
}

export interface TimeBomb {
  plantedByBotId: string
  roundsRemaining: number
  damage: number
}

export interface ActiveEffect {
  type: string
  duration: number
  data: Record<string, any>
}

export interface SkillData {
  id: string
  slot: number
  cooldown: number
  effect_data: Record<string, any>
}

export interface CombatAction {
  action: 'attack' | 'defend' | 'skill'
  target: 'opponent' | null
  skill_id?: string | null
}

export interface RoundResult {
  round: number
  bot1_action: string
  bot1_target: string | null
  bot2_action: string
  bot2_target: string | null
  bot1_damage_dealt: number
  bot2_damage_dealt: number
  bot1_hp: number
  bot2_hp: number
  bot1_response_ms: number
  bot2_response_ms: number
  bot1_timed_out: boolean
  bot2_timed_out: boolean
  effects_applied: Array<{ bot: string; effect: string; duration: number; value?: number }>
  bot1_counter: string
  bot2_counter: string
  bot1_momentum: number
  bot2_momentum: number
  bot1_energy: number
  bot2_energy: number
  bot1_skill_id?: string
  bot2_skill_id?: string
}

export interface MatchResult {
  winner: 'bot1' | 'bot2' | 'draw'
  rounds: RoundResult[]
  totalRounds: number
  durationMs: number
}

// ============================================================
// Constants
// ============================================================

const ENERGY_START = 100
const ENERGY_REGEN_PER_ROUND = 15
const ENERGY_DEFEND_BONUS = 10
const BASE_DAMAGE = 8
const DAMAGE_FLOOR_BASIC = 3
const DAMAGE_FLOOR_SKILL = 4
const DEFENSE_REDUCTION_MULTIPLIER = 0.6

// ============================================================
// V2 Skill Definitions (16 + basic attack)
// ============================================================

export interface SkillDef {
  id: string
  name: string
  category: 'defensive' | 'aggressive' | 'tactical' | 'exploit'
  energyCost: number
  cooldown: number
  unlockLevel: number
}

export const SKILL_DEFS: Record<string, SkillDef> = {
  // Defensive
  firewall:       { id: 'firewall',       name: 'Firewall',       category: 'defensive',  energyCost: 15, cooldown: 3, unlockLevel: 1 },
  iron_fortress:  { id: 'iron_fortress',  name: 'Iron Fortress',  category: 'defensive',  energyCost: 20, cooldown: 5, unlockLevel: 10 },
  mirror_coat:    { id: 'mirror_coat',    name: 'Mirror Coat',    category: 'defensive',  energyCost: 25, cooldown: 5, unlockLevel: 7 },
  rollback:       { id: 'rollback',       name: 'Rollback',       category: 'defensive',  energyCost: 20, cooldown: 4, unlockLevel: 3 },
  // Aggressive
  power_strike:   { id: 'power_strike',   name: 'Power Strike',   category: 'aggressive', energyCost: 10, cooldown: 2, unlockLevel: 1 },
  reasoning_burst:{ id: 'reasoning_burst',name: 'Reasoning Burst', category: 'aggressive', energyCost: 30, cooldown: 4, unlockLevel: 3 },
  spawn_attack:   { id: 'spawn_attack',   name: 'Spawn Attack',   category: 'aggressive', energyCost: 20, cooldown: 3, unlockLevel: 5 },
  berserker_rush: { id: 'berserker_rush', name: 'Berserker Rush', category: 'aggressive', energyCost: 15, cooldown: 3, unlockLevel: 13 },
  // Tactical
  sleep_bomb:     { id: 'sleep_bomb',     name: 'Sleep Bomb',     category: 'tactical',   energyCost: 20, cooldown: 4, unlockLevel: 1 },
  emp_pulse:      { id: 'emp_pulse',      name: 'EMP Pulse',      category: 'tactical',   energyCost: 15, cooldown: 3, unlockLevel: 5 },
  time_bomb:      { id: 'time_bomb',      name: 'Time Bomb',      category: 'tactical',   energyCost: 20, cooldown: 5, unlockLevel: 7 },
  overclock:      { id: 'overclock',      name: 'Overclock',      category: 'tactical',   energyCost: 10, cooldown: 4, unlockLevel: 10 },
  // Exploit
  scan:           { id: 'scan',           name: 'Scan',           category: 'exploit',    energyCost: 15, cooldown: 5, unlockLevel: 1 },
  prompt_injection:{ id: 'prompt_injection', name: 'Prompt Injection', category: 'exploit', energyCost: 25, cooldown: 5, unlockLevel: 16 },
  memory_bomb:    { id: 'memory_bomb',    name: 'Memory Bomb',    category: 'exploit',    energyCost: 20, cooldown: 5, unlockLevel: 16 },
  virus:          { id: 'virus',          name: 'Virus',          category: 'exploit',    energyCost: 15, cooldown: 4, unlockLevel: 13 },
}

// Backwards-compat mapping for v1 skill IDs
const V1_SKILL_MAP: Record<string, string> = {
  shield_wall: 'firewall',
  fireball: 'reasoning_burst',
  emp_blast: 'emp_pulse',
  regenerate: 'rollback',
  berserker: 'berserker_rush',
}

function getSkillDef(skillId: string): SkillDef | undefined {
  return SKILL_DEFS[skillId] || SKILL_DEFS[V1_SKILL_MAP[skillId] || '']
}

function getEnergyCost(skillId: string): number {
  const def = getSkillDef(skillId)
  return def?.energyCost ?? 20
}

// ============================================================
// Counter System (RPS)
// ============================================================

function detectCounter(myAction: CombatAction, opponentAction: CombatAction): { isCounter: boolean; type: string } {
  if (myAction.action === 'attack' && opponentAction.action === 'skill') {
    return { isCounter: true, type: 'attack_vs_skill' }
  }
  if (myAction.action === 'defend' && opponentAction.action === 'attack') {
    return { isCounter: true, type: 'defend_vs_attack' }
  }
  if (myAction.action === 'skill' && opponentAction.action === 'defend') {
    return { isCounter: true, type: 'skill_vs_defend' }
  }
  return { isCounter: false, type: 'none' }
}

function getMomentumMultiplier(streak: number): number {
  if (streak <= 1) return 1.0
  if (streak === 2) return 1.1
  if (streak === 3) return 1.25
  return 1.5
}

// ============================================================
// Stat-Based Damage Calculation
// ============================================================

/**
 * Calculate basic attack damage using stat-based formula
 * Formula: BaseDamage = Power × 0.8 + Speed × 0.2 + 3
 */
function calculateBasicAttackDamage(
  attacker: BotCombatState,
  defender: BotCombatState,
  defenderAction: string,
  counterType: string = 'none',
  momentumStreak: number = 0
): number {
  // Base damage from attacker stats (hybrid Power/Speed)
  let baseDamage = attacker.attack * 0.8 + attacker.speed * 0.2 + 3

  // Defense reduction
  let effectiveDefense = defender.defense * DEFENSE_REDUCTION_MULTIPLIER

  // Defend action bonus (increases defense efficiency)
  if (defenderAction === 'defend') {
    effectiveDefense *= counterType === 'skill_vs_defend' ? 1.25 : 1.5
  }

  // Armor broken debuff
  if (defender.statusEffects.some((e) => e.type === 'armor_broken')) {
    effectiveDefense = Math.max(0, effectiveDefense - 3)
  }

  // Scan debuff (reduces defense by 15%)
  if (defender.statusEffects.some((e) => e.type === 'scanned')) {
    effectiveDefense *= 0.85
  }

  // Calculate final damage
  let damage = baseDamage - effectiveDefense

  // Counter bonus
  if (counterType === 'attack_vs_skill') damage *= 1.5

  // Overclock bonus
  if (attacker.overclockNextAttack) {
    const overclockMult = 1.3 + (attacker.speed / 50)
    damage *= Math.min(1.8, overclockMult)
    attacker.overclockNextAttack = false
  }

  // Momentum
  damage *= getMomentumMultiplier(momentumStreak)

  return Math.max(DAMAGE_FLOOR_BASIC, Math.round(damage))
}

/**
 * Calculate skill damage using stat-based formulas
 */
function calculateSkillDamage(
  skillId: string,
  attacker: BotCombatState,
  defender: BotCombatState,
  rng: () => number
): number {
  let baseDamage = 0
  let defenseMultiplier = DEFENSE_REDUCTION_MULTIPLIER

  switch (skillId) {
    case 'power_strike':
      // Power-focused: Power × 1.2 + 8
      baseDamage = attacker.attack * 1.2 + 8
      break

    case 'reasoning_burst':
      // Speed-focused: Speed × 1.4 + 6
      baseDamage = attacker.speed * 1.4 + 6
      defenseMultiplier = 0.5 // Lower defense penetration
      break

    case 'spawn_attack':
      // Multi-hit hybrid: 3 × (Power × 0.4 + Speed × 0.3 + 2)
      const hitDamage = attacker.attack * 0.4 + attacker.speed * 0.3 + 2
      baseDamage = hitDamage * 3
      defenseMultiplier = 0.4 // Lower per-hit defense
      break

    case 'berserker_rush':
      // High-risk power: Power × 1.8 + Speed × 0.4 + 10
      baseDamage = attacker.attack * 1.8 + attacker.speed * 0.4 + 10
      defenseMultiplier = 0.5
      break

    case 'time_bomb':
      // Delayed burst: Power × 1.0 + Speed × 0.5 + 12
      baseDamage = attacker.attack * 1.0 + attacker.speed * 0.5 + 12
      defenseMultiplier = 0.4
      break

    case 'virus':
      // DoT per tick: (Power × 0.4 + Speed × 0.3)
      baseDamage = (attacker.attack * 0.4 + attacker.speed * 0.3)
      defenseMultiplier = 0.3 // Defense-piercing DoT
      break

    default:
      // Fallback to basic attack formula
      baseDamage = attacker.attack * 0.8 + attacker.speed * 0.2 + 3
      break
  }

  // Apply defense reduction
  let effectiveDefense = defender.defense * defenseMultiplier

  // Scan debuff
  if (defender.statusEffects.some((e) => e.type === 'scanned')) {
    effectiveDefense *= 0.85
  }

  const finalDamage = baseDamage - effectiveDefense

  return Math.max(DAMAGE_FLOOR_SKILL, Math.round(finalDamage))
}

// ============================================================
// Status Effect Tick
// ============================================================

function tickEffects(bot: BotCombatState): Array<{ bot: string; effect: string; duration: number; value?: number }> {
  const applied: Array<{ bot: string; effect: string; duration: number; value?: number }> = []

  for (const effect of bot.statusEffects) {
    switch (effect.type) {
      case 'virus':
        const virusDmg = effect.data.tick_damage || 5
        bot.hp -= virusDmg
        applied.push({ bot: bot.id, effect: 'virus_tick', duration: effect.duration, value: virusDmg })
        break
      case 'burning':
        const burnDmg = effect.data.tick_damage || 3
        bot.hp -= burnDmg
        applied.push({ bot: bot.id, effect: 'burning_tick', duration: effect.duration, value: burnDmg })
        break
      case 'regenerating':
        const heal = effect.data.heal_per_round || 8
        bot.hp = Math.min(bot.maxHp, bot.hp + heal)
        applied.push({ bot: bot.id, effect: 'regen_tick', duration: effect.duration, value: heal })
        break
    }
    effect.duration--
  }

  // Remove expired
  bot.statusEffects = bot.statusEffects.filter((e) => e.duration > 0)

  // Expire disabled skills
  bot.disabledSkills = bot.disabledSkills || new Set()

  return applied
}

// ============================================================
// Effective Stats (from active buffs/debuffs)
// ============================================================

function getEffectiveStats(bot: BotCombatState): { attack: number; defense: number; speed: number } {
  let attack = bot.attack
  let defense = bot.defense
  let speed = bot.speed

  for (const effect of bot.statusEffects) {
    switch (effect.type) {
      case 'overclock_buff':
        attack += 3
        speed += 3
        break
      case 'iron_fortress':
        // Stat-based defense bonus from effect data
        const defBonus = effect.data.defenseBonus || Math.round(defense * 0.8)
        defense += defBonus
        break
      case 'berserker':
        attack += 8
        defense -= 3
        break
    }
  }

  return { attack: Math.max(0, attack), defense: Math.max(0, defense), speed: Math.max(0, speed) }
}

// ============================================================
// V2 Skill Resolution
// ============================================================

function resolveSkillV2(
  user: BotCombatState,
  opponent: BotCombatState,
  skillId: string,
  round: number,
  matchSeed: number
): { damage: number; selfDamage: number; effects: Array<{ bot: string; effect: string; duration: number; value?: number }> } {
  const effects: Array<{ bot: string; effect: string; duration: number; value?: number }> = []
  let damage = 0
  let selfDamage = 0
  const rng = () => seededRandom(matchSeed + round + damage + effects.length)

  // Init tracking maps if needed
  if (!user.skillUsesThisMatch) user.skillUsesThisMatch = new Map()
  if (!user.disabledSkills) user.disabledSkills = new Set()

  // Check if skill is disabled by Memory Bomb
  if (user.disabledSkills.has(skillId)) {
    effects.push({ bot: user.id, effect: 'skill_disabled', duration: 0 })
    return { damage: 0, selfDamage: 0, effects }
  }

  const def = getSkillDef(skillId)
  if (!def) {
    // Fallback for v1 skills
    return resolveSkillV1Compat(user, opponent, skillId)
  }

  switch (skillId) {
    // === DEFENSIVE ===
    case 'firewall':
      // Block next attack up to ShieldStrength = Defense × 1.5 + 10
      const shieldStrength = user.defense * 1.5 + 10
      user.statusEffects.push({ type: 'firewall', duration: 1, data: { shieldStrength } })
      effects.push({ bot: user.id, effect: 'firewall', duration: 1, value: Math.round(shieldStrength) })
      break

    case 'iron_fortress':
      // Tank mode: +Defense × 0.8 for 2 rounds, can't attack
      const defenseBonus = user.defense * 0.8
      user.statusEffects.push({ type: 'iron_fortress', duration: 2, data: { defenseBonus } })
      effects.push({ bot: user.id, effect: 'iron_fortress', duration: 2, value: Math.round(defenseBonus) })
      break

    case 'mirror_coat':
      // Reflect: 40% + (Defense / 100), max = Defense × 0.8
      const reflectPct = Math.min(0.85, 0.4 + (user.defense / 100))
      const maxReflect = user.defense * 0.8
      user.statusEffects.push({ type: 'mirror_coat', duration: 1, data: { reflect_pct: reflectPct, max_reflect: maxReflect } })
      effects.push({ bot: user.id, effect: 'mirror_coat', duration: 1, value: Math.round(reflectPct * 100) })
      break

    case 'rollback':
      // Heal: 10 + (Defense × 0.6) + (MaxHP × 0.12), max 30% of MaxHP, max 2 uses
      const rollbackUses = user.skillUsesThisMatch.get('rollback') || 0
      if (rollbackUses >= 2) {
        effects.push({ bot: user.id, effect: 'rollback_exhausted', duration: 0 })
        break
      }
      const baseHeal = 10 + (user.defense * 0.6) + (user.maxHp * 0.12)
      const maxHeal = user.maxHp * 0.3
      const healAmount = Math.min(maxHeal, baseHeal)
      user.hp = Math.min(user.maxHp, user.hp + healAmount)
      user.skillUsesThisMatch.set('rollback', rollbackUses + 1)
      effects.push({ bot: user.id, effect: 'rollback_heal', duration: 0, value: Math.round(healAmount) })
      break

    // === AGGRESSIVE ===
    case 'power_strike':
      // Power × 1.2 + 8
      damage = calculateSkillDamage('power_strike', user, opponent, rng)
      break

    case 'reasoning_burst':
      // Speed × 1.4 + 6
      damage = calculateSkillDamage('reasoning_burst', user, opponent, rng)
      break

    case 'spawn_attack':
      // Multi-hit: 3 × (Power × 0.4 + Speed × 0.3 + 2)
      damage = calculateSkillDamage('spawn_attack', user, opponent, rng)
      // Spawn attack breaks firewall (multi-hit pierces single shields)
      const fwIdx = opponent.statusEffects.findIndex(e => e.type === 'firewall')
      if (fwIdx >= 0) {
        const shield = opponent.statusEffects[fwIdx]
        const shieldStr = shield.data.shieldStrength || 9999
        const hitDamage = Math.round(damage / 3)
        if (hitDamage > shieldStr) {
          opponent.statusEffects.splice(fwIdx, 1)
          damage = Math.max(0, damage - shieldStr)
          effects.push({ bot: opponent.id, effect: 'firewall_broken', duration: 0 })
        } else {
          damage = 0
          effects.push({ bot: opponent.id, effect: 'firewall_absorbed', duration: 0 })
        }
      }
      effects.push({ bot: user.id, effect: 'spawn_attack', duration: 0, value: damage })
      break

    case 'berserker_rush':
      // Power × 1.8 + Speed × 0.4 + 10
      damage = calculateSkillDamage('berserker_rush', user, opponent, rng)
      selfDamage = 8 + Math.round(user.attack * 0.15)
      effects.push({ bot: user.id, effect: 'berserker_self_damage', duration: 0, value: selfDamage })
      break

    // === TACTICAL ===
    case 'sleep_bomb':
      // Sleep chance: 0.5 + (Speed / 80), max 0.85
      const sleepChance = Math.min(0.85, 0.5 + (user.speed / 80))
      if (rng() < sleepChance) {
        opponent.statusEffects.push({ type: 'sleep', duration: 1, data: {} })
        effects.push({ bot: opponent.id, effect: 'sleep', duration: 1 })
      } else {
        effects.push({ bot: opponent.id, effect: 'sleep_resisted', duration: 0 })
      }
      break

    case 'emp_pulse':
      // Drain: 25 + (Speed × 0.5), min 20
      const drainAmount = Math.max(20, 25 + (user.speed * 0.5))
      const drained = Math.min(Math.round(drainAmount), opponent.energy)
      opponent.energy -= drained
      effects.push({ bot: opponent.id, effect: 'emp_drain', duration: 0, value: drained })
      break

    case 'time_bomb':
      // Delayed: Power × 1.0 + Speed × 0.5 + 12
      if (!opponent.timeBombs) opponent.timeBombs = []
      const bombDamage = calculateSkillDamage('time_bomb', user, opponent, rng)
      opponent.timeBombs.push({ plantedByBotId: user.id, roundsRemaining: 2, damage: bombDamage })
      effects.push({ bot: opponent.id, effect: 'time_bomb_planted', duration: 2, value: bombDamage })
      break

    case 'overclock':
      // Next attack multiplier: 1.3 + (Speed / 50), max 1.8
      user.overclockNextAttack = true
      const overclockBonus = Math.min(1.8, 1.3 + (user.speed / 50))
      effects.push({ bot: user.id, effect: 'overclock', duration: 1, value: Math.round(overclockBonus * 100) })
      break

    // === EXPLOIT ===
    case 'scan':
      // Reveal stats + reduce defense by 15% for 1 round
      opponent.statusEffects.push({ type: 'scanned', duration: 1, data: { defense_reduction: 0.15 } })
      effects.push({ bot: opponent.id, effect: 'scanned', duration: 1, value: 15 })
      break

    case 'prompt_injection':
      // Confuse chance: 0.35 + (Speed / 100), max 0.65
      const confuseChance = Math.min(0.65, 0.35 + (user.speed / 100))
      if (rng() < confuseChance) {
        opponent.statusEffects.push({ type: 'confused', duration: 1, data: {} })
        effects.push({ bot: opponent.id, effect: 'confused', duration: 1 })
      } else {
        effects.push({ bot: opponent.id, effect: 'injection_resisted', duration: 0 })
      }
      break

    case 'memory_bomb':
      // Disable opponent's last-used skill for 2 rounds (not stat-based)
      if (opponent.lastUsedSkillId) {
        if (!opponent.disabledSkills) opponent.disabledSkills = new Set()
        opponent.disabledSkills.add(opponent.lastUsedSkillId)
        opponent.statusEffects.push({
          type: 'memory_bombed',
          duration: 2,
          data: { disabledSkill: opponent.lastUsedSkillId }
        })
        effects.push({ bot: opponent.id, effect: 'memory_bombed', duration: 2 })
      } else {
        effects.push({ bot: opponent.id, effect: 'memory_bomb_miss', duration: 0 })
      }
      break

    case 'virus':
      // DoT: (Power × 0.4 + Speed × 0.3) per tick for 3 rounds
      const virusTickDamage = calculateSkillDamage('virus', user, opponent, rng)
      opponent.statusEffects.push({ type: 'virus', duration: 3, data: { tick_damage: virusTickDamage } })
      effects.push({ bot: opponent.id, effect: 'virus', duration: 3, value: virusTickDamage })
      break

    default:
      // Unknown skill — try v1 compat
      return resolveSkillV1Compat(user, opponent, skillId)
  }

  // Track usage
  user.lastUsedSkillId = skillId
  const uses = user.skillUsesThisMatch.get(skillId) || 0
  user.skillUsesThisMatch.set(skillId, uses + 1)

  // Set cooldown
  const cd = def?.cooldown ?? 3
  user.skillCooldowns.set(skillId, cd)

  return { damage, selfDamage, effects }
}

/** Backwards-compat for v1 skill IDs that haven't been mapped */
function resolveSkillV1Compat(
  user: BotCombatState,
  opponent: BotCombatState,
  skillId: string
): { damage: number; selfDamage: number; effects: Array<{ bot: string; effect: string; duration: number; value?: number }> } {
  const skill = user.equippedSkills.find((s) => s.id === skillId)
  if (!skill) return { damage: 0, selfDamage: 0, effects: [] }

  const effects: Array<{ bot: string; effect: string; duration: number; value?: number }> = []
  let damage = 0
  const data = skill.effect_data

  if (data.flat_damage) damage = data.flat_damage
  if (data.damage_mult) {
    const defIgnore = data.defense_ignore || 0
    const effDef = opponent.defense * (1 - defIgnore)
    damage = Math.max(1, Math.round(user.attack * data.damage_mult - effDef))
  }
  if (data.status && data.duration) {
    const target = data.target === 'self' ? user : opponent
    target.statusEffects.push({ type: data.status, duration: data.duration, data })
    effects.push({ bot: target.id, effect: data.status, duration: data.duration })
  }
  if (data.heal) {
    user.hp = Math.min(user.maxHp, user.hp + data.heal)
    effects.push({ bot: user.id, effect: 'heal', duration: 0, value: data.heal })
  }

  user.skillCooldowns.set(skillId, skill.cooldown)
  return { damage, selfDamage: 0, effects }
}

// ============================================================
// Seeded Random
// ============================================================

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// ============================================================
// Time Bomb Tick
// ============================================================

function tickTimeBombs(bot: BotCombatState): Array<{ bot: string; effect: string; duration: number; value?: number }> {
  if (!bot.timeBombs) { bot.timeBombs = []; return [] }
  const effects: Array<{ bot: string; effect: string; duration: number; value?: number }> = []

  for (const bomb of bot.timeBombs) {
    bomb.roundsRemaining--
    if (bomb.roundsRemaining <= 0) {
      bot.hp -= bomb.damage
      effects.push({ bot: bot.id, effect: 'time_bomb_explode', duration: 0, value: bomb.damage })
    }
  }

  bot.timeBombs = bot.timeBombs.filter(b => b.roundsRemaining > 0)
  return effects
}

// ============================================================
// Memory Bomb Expiry
// ============================================================

function tickDisabledSkills(bot: BotCombatState): void {
  if (!bot.disabledSkills) { bot.disabledSkills = new Set(); return }
  // Re-enable skills whose memory_bombed effect expired
  const memBombs = bot.statusEffects.filter(e => e.type === 'memory_bombed')
  const stillDisabled = new Set(memBombs.map(e => e.data.disabledSkill as string))
  bot.disabledSkills = stillDisabled
}

// ============================================================
// Resolve Single Round
// ============================================================

export function resolveRound(
  bot1: BotCombatState,
  bot2: BotCombatState,
  action1: CombatAction,
  action2: CombatAction,
  round: number,
  matchSeed: number,
  response1Ms: number,
  response2Ms: number,
  timed1: boolean,
  timed2: boolean
): RoundResult {
  const effects: Array<{ bot: string; effect: string; duration: number; value?: number }> = []

  // Init v2 fields if missing
  if (!bot1.skillUsesThisMatch) bot1.skillUsesThisMatch = new Map()
  if (!bot2.skillUsesThisMatch) bot2.skillUsesThisMatch = new Map()
  if (!bot1.disabledSkills) bot1.disabledSkills = new Set()
  if (!bot2.disabledSkills) bot2.disabledSkills = new Set()
  if (!bot1.timeBombs) bot1.timeBombs = []
  if (!bot2.timeBombs) bot2.timeBombs = []

  // 1. Tick status effects (DOTs, buffs decrement)
  effects.push(...tickEffects(bot1))
  effects.push(...tickEffects(bot2))

  // Tick time bombs
  effects.push(...tickTimeBombs(bot1))
  effects.push(...tickTimeBombs(bot2))

  // Tick disabled skills
  tickDisabledSkills(bot1)
  tickDisabledSkills(bot2)

  // 2. Forced actions
  const isSleeping1 = bot1.statusEffects.some(e => e.type === 'sleep')
  const isSleeping2 = bot2.statusEffects.some(e => e.type === 'sleep')
  const isStunned1 = bot1.statusEffects.some(e => e.type === 'stunned')
  const isStunned2 = bot2.statusEffects.some(e => e.type === 'stunned')
  const isFortress1 = bot1.statusEffects.some(e => e.type === 'iron_fortress')
  const isFortress2 = bot2.statusEffects.some(e => e.type === 'iron_fortress')

  // Confused: 40% of opponent's attack targets themselves
  const isConfused1 = bot1.statusEffects.some(e => e.type === 'confused')
  const isConfused2 = bot2.statusEffects.some(e => e.type === 'confused')

  if (isSleeping1 || isStunned1 || timed1) action1 = { action: 'defend', target: null }
  if (isSleeping2 || isStunned2 || timed2) action2 = { action: 'defend', target: null }
  if (isFortress1 && action1.action === 'attack') action1 = { action: 'defend', target: null }
  if (isFortress2 && action2.action === 'attack') action2 = { action: 'defend', target: null }

  // Check skill cooldowns
  if (action1.action === 'skill' && action1.skill_id) {
    const cd = bot1.skillCooldowns.get(action1.skill_id) || 0
    if (cd > 0) action1 = { action: 'defend', target: null }
  }
  if (action2.action === 'skill' && action2.skill_id) {
    const cd = bot2.skillCooldowns.get(action2.skill_id) || 0
    if (cd > 0) action2 = { action: 'defend', target: null }
  }

  // 3. Energy management
  bot1.energy = Math.min(bot1.maxEnergy, bot1.energy + ENERGY_REGEN_PER_ROUND)
  bot2.energy = Math.min(bot2.maxEnergy, bot2.energy + ENERGY_REGEN_PER_ROUND)

  if (action1.action === 'skill' && action1.skill_id) {
    const cost = getEnergyCost(action1.skill_id)
    if (bot1.energy < cost) {
      action1 = { action: 'defend', target: null }
    } else {
      bot1.energy -= cost
    }
  }
  if (action2.action === 'skill' && action2.skill_id) {
    const cost = getEnergyCost(action2.skill_id)
    if (bot2.energy < cost) {
      action2 = { action: 'defend', target: null }
    } else {
      bot2.energy -= cost
    }
  }

  if (action1.action === 'defend') bot1.energy = Math.min(bot1.maxEnergy, bot1.energy + ENERGY_DEFEND_BONUS)
  if (action2.action === 'defend') bot2.energy = Math.min(bot2.maxEnergy, bot2.energy + ENERGY_DEFEND_BONUS)

  // 4. Effective stats
  const stats1 = getEffectiveStats(bot1)
  const stats2 = getEffectiveStats(bot2)
  const origAtk1 = bot1.attack; bot1.attack = stats1.attack
  const origDef1 = bot1.defense; bot1.defense = stats1.defense
  const origAtk2 = bot2.attack; bot2.attack = stats2.attack
  const origDef2 = bot2.defense; bot2.defense = stats2.defense

  // 5. Counters & momentum
  const counter1 = detectCounter(action1, action2)
  const counter2 = detectCounter(action2, action1)

  bot1.momentumStreak = counter1.isCounter ? (bot1.momentumStreak || 0) + 1 : 0
  bot2.momentumStreak = counter2.isCounter ? (bot2.momentumStreak || 0) + 1 : 0

  let bot1Damage = 0
  let bot2Damage = 0

  // 6. Resolve skills
  if (action1.action === 'skill' && action1.skill_id) {
    const result = resolveSkillV2(bot1, bot2, action1.skill_id, round, matchSeed)
    bot1Damage += result.damage
    bot1.hp = Math.max(0, bot1.hp - result.selfDamage)
    effects.push(...result.effects)
  }
  if (action2.action === 'skill' && action2.skill_id) {
    const result = resolveSkillV2(bot2, bot1, action2.skill_id, round, matchSeed + 1000)
    bot2Damage += result.damage
    bot2.hp = Math.max(0, bot2.hp - result.selfDamage)
    effects.push(...result.effects)
  }

  // 7. Resolve basic attacks
  if (action1.action === 'attack') {
    // Check firewall shield
    const fwEffect2 = bot2.statusEffects.find(e => e.type === 'firewall')
    if (fwEffect2) {
      const shieldStrength = fwEffect2.data.shieldStrength || 9999
      let atkDmg = calculateBasicAttackDamage(bot1, bot2, action2.action, counter1.type, bot1.momentumStreak)
      
      if (atkDmg <= shieldStrength) {
        // Shield absorbs all damage
        bot2.statusEffects = bot2.statusEffects.filter(e => e.type !== 'firewall')
        effects.push({ bot: bot2.id, effect: 'firewall_blocked', duration: 0, value: atkDmg })
        atkDmg = 0
      } else {
        // Damage exceeds shield
        atkDmg -= shieldStrength
        bot2.statusEffects = bot2.statusEffects.filter(e => e.type !== 'firewall')
        effects.push({ bot: bot2.id, effect: 'firewall_broken', duration: 0, value: shieldStrength })
      }
      
      // Confused: damage self instead
      if (isConfused1) {
        bot1.hp = Math.max(0, bot1.hp - Math.round(atkDmg * 0.5))
        effects.push({ bot: bot1.id, effect: 'confused_self_hit', duration: 0, value: Math.round(atkDmg * 0.5) })
        atkDmg = 0
      }
      bot1Damage += atkDmg
    } else {
      let atkDmg = calculateBasicAttackDamage(bot1, bot2, action2.action, counter1.type, bot1.momentumStreak)
      // Confused: damage self instead
      if (isConfused1) {
        bot1.hp = Math.max(0, bot1.hp - Math.round(atkDmg * 0.5))
        effects.push({ bot: bot1.id, effect: 'confused_self_hit', duration: 0, value: Math.round(atkDmg * 0.5) })
        atkDmg = 0
      }
      bot1Damage += atkDmg
    }
  }

  // Defend counter-attack
  if (counter1.type === 'defend_vs_attack' && action2.action === 'attack') {
    const blocked = calculateBasicAttackDamage(bot2, bot1, 'defend', 'none', 0)
    bot1Damage += Math.max(1, Math.round(blocked * 0.25 * getMomentumMultiplier(bot1.momentumStreak)))
    effects.push({ bot: bot1.id, effect: 'counter_attack', duration: 0 })
  }

  if (action2.action === 'attack') {
    // Check firewall shield
    const fwEffect1 = bot1.statusEffects.find(e => e.type === 'firewall')
    if (fwEffect1) {
      const shieldStrength = fwEffect1.data.shieldStrength || 9999
      let atkDmg = calculateBasicAttackDamage(bot2, bot1, action1.action, counter2.type, bot2.momentumStreak)
      
      if (atkDmg <= shieldStrength) {
        // Shield absorbs all damage
        bot1.statusEffects = bot1.statusEffects.filter(e => e.type !== 'firewall')
        effects.push({ bot: bot1.id, effect: 'firewall_blocked', duration: 0, value: atkDmg })
        atkDmg = 0
      } else {
        // Damage exceeds shield
        atkDmg -= shieldStrength
        bot1.statusEffects = bot1.statusEffects.filter(e => e.type !== 'firewall')
        effects.push({ bot: bot1.id, effect: 'firewall_broken', duration: 0, value: shieldStrength })
      }
      
      if (isConfused2) {
        bot2.hp = Math.max(0, bot2.hp - Math.round(atkDmg * 0.5))
        effects.push({ bot: bot2.id, effect: 'confused_self_hit', duration: 0, value: Math.round(atkDmg * 0.5) })
        atkDmg = 0
      }
      bot2Damage += atkDmg
    } else {
      let atkDmg = calculateBasicAttackDamage(bot2, bot1, action1.action, counter2.type, bot2.momentumStreak)
      if (isConfused2) {
        bot2.hp = Math.max(0, bot2.hp - Math.round(atkDmg * 0.5))
        effects.push({ bot: bot2.id, effect: 'confused_self_hit', duration: 0, value: Math.round(atkDmg * 0.5) })
        atkDmg = 0
      }
      bot2Damage += atkDmg
    }
  }

  if (counter2.type === 'defend_vs_attack' && action1.action === 'attack') {
    const blocked = calculateBasicAttackDamage(bot1, bot2, 'defend', 'none', 0)
    bot2Damage += Math.max(1, Math.round(blocked * 0.25 * getMomentumMultiplier(bot2.momentumStreak)))
    effects.push({ bot: bot2.id, effect: 'counter_attack', duration: 0 })
  }

  // 8. Mirror coat reflection
  const mirror1 = bot1.statusEffects.find(e => e.type === 'mirror_coat')
  const mirror2 = bot2.statusEffects.find(e => e.type === 'mirror_coat')
  if (mirror1 && bot2Damage > 0) {
    const reflectPct = mirror1.data.reflect_pct || 0.5
    const maxReflect = mirror1.data.max_reflect || 999
    const reflected = Math.min(maxReflect, Math.round(bot2Damage * reflectPct))
    bot1Damage += reflected
    effects.push({ bot: bot1.id, effect: 'mirror_reflect', duration: 0, value: reflected })
  }
  if (mirror2 && bot1Damage > 0) {
    const reflectPct = mirror2.data.reflect_pct || 0.5
    const maxReflect = mirror2.data.max_reflect || 999
    const reflected = Math.min(maxReflect, Math.round(bot1Damage * reflectPct))
    bot2Damage += reflected
    effects.push({ bot: bot2.id, effect: 'mirror_reflect', duration: 0, value: reflected })
  }

  // 9. Apply damage
  bot2.hp = Math.max(0, bot2.hp - bot1Damage)
  bot1.hp = Math.max(0, bot1.hp - bot2Damage)

  // Restore base stats
  bot1.attack = origAtk1; bot1.defense = origDef1
  bot2.attack = origAtk2; bot2.defense = origDef2

  // Decrement cooldowns
  bot1.skillCooldowns.forEach((v, k) => { if (v > 0) bot1.skillCooldowns.set(k, v - 1) })
  bot2.skillCooldowns.forEach((v, k) => { if (v > 0) bot2.skillCooldowns.set(k, v - 1) })

  // Clear single-round status effects that were consumed
  bot1.statusEffects = bot1.statusEffects.filter(e => e.type !== 'sleep' && e.type !== 'confused' && e.type !== 'scanned')
  bot2.statusEffects = bot2.statusEffects.filter(e => e.type !== 'sleep' && e.type !== 'confused' && e.type !== 'scanned')

  bot1.lastAction = action1
  bot2.lastAction = action2

  return {
    round,
    bot1_action: action1.action,
    bot1_target: action1.target,
    bot2_action: action2.action,
    bot2_target: action2.target,
    bot1_damage_dealt: bot1Damage,
    bot2_damage_dealt: bot2Damage,
    bot1_hp: bot1.hp,
    bot2_hp: bot2.hp,
    bot1_response_ms: response1Ms,
    bot2_response_ms: response2Ms,
    bot1_timed_out: timed1,
    bot2_timed_out: timed2,
    effects_applied: effects,
    bot1_counter: counter1.type,
    bot2_counter: counter2.type,
    bot1_momentum: bot1.momentumStreak,
    bot2_momentum: bot2.momentumStreak,
    bot1_energy: bot1.energy,
    bot2_energy: bot2.energy,
    bot1_skill_id: action1.skill_id || undefined,
    bot2_skill_id: action2.skill_id || undefined,
  }
}

// ============================================================
// Full Match Resolution
// ============================================================

export function resolveCombat(
  bot1: BotCombatState,
  bot2: BotCombatState,
  actionProvider: (round: number, bot1: BotCombatState, bot2: BotCombatState) => {
    action1: CombatAction; action2: CombatAction;
    response1Ms: number; response2Ms: number;
    timed1: boolean; timed2: boolean;
  },
  maxRounds: number = 10,
  matchSeed?: number
): MatchResult {
  const seed = matchSeed ?? Date.now()
  const rounds: RoundResult[] = []
  const startTime = Date.now()

  for (let round = 1; round <= maxRounds; round++) {
    const { action1, action2, response1Ms, response2Ms, timed1, timed2 } = actionProvider(round, bot1, bot2)

    const result = resolveRound(bot1, bot2, action1, action2, round, seed, response1Ms, response2Ms, timed1, timed2)
    rounds.push(result)

    bot1.timedOutConsecutive = timed1 ? bot1.timedOutConsecutive + 1 : 0
    bot2.timedOutConsecutive = timed2 ? bot2.timedOutConsecutive + 1 : 0

    if (bot1.timedOutConsecutive >= 3) return { winner: 'bot2', rounds, totalRounds: round, durationMs: Date.now() - startTime }
    if (bot2.timedOutConsecutive >= 3) return { winner: 'bot1', rounds, totalRounds: round, durationMs: Date.now() - startTime }
    if (bot1.hp <= 0 && bot2.hp <= 0) return { winner: 'draw', rounds, totalRounds: round, durationMs: Date.now() - startTime }
    if (bot1.hp <= 0) return { winner: 'bot2', rounds, totalRounds: round, durationMs: Date.now() - startTime }
    if (bot2.hp <= 0) return { winner: 'bot1', rounds, totalRounds: round, durationMs: Date.now() - startTime }
  }

  if (bot1.hp > bot2.hp) return { winner: 'bot1', rounds, totalRounds: maxRounds, durationMs: Date.now() - startTime }
  if (bot2.hp > bot1.hp) return { winner: 'bot2', rounds, totalRounds: maxRounds, durationMs: Date.now() - startTime }
  return { winner: 'draw', rounds, totalRounds: maxRounds, durationMs: Date.now() - startTime }
}

// ============================================================
// XP & Win Quality
// ============================================================

export interface XpResult {
  baseXp: number
  winBonus: number
  roundBonus: number
  qualityBonus: number
  qualityTags: string[]
  totalXp: number
}

export function calculateXp(
  won: boolean,
  draw: boolean,
  roundsFought: number,
  myHpRemaining: number,
  myMaxHp: number,
  opponentMaxHp: number,
  myHpAtLowest: number
): XpResult {
  const baseXp = 10
  const winBonus = won ? 15 : (draw ? 5 : 0)
  const roundBonus = roundsFought * 2

  let qualityBonus = 0
  const qualityTags: string[] = []

  if (won) {
    if (myHpRemaining > myMaxHp * 0.5) { qualityBonus += 5; qualityTags.push('clean_win') }
    if (myHpRemaining >= myMaxHp) { qualityBonus += 15; qualityTags.push('flawless') }
    if (myHpAtLowest < myMaxHp * 0.25) { qualityBonus += 10; qualityTags.push('comeback') }
    if (roundsFought <= 3) { qualityBonus += 8; qualityTags.push('speed_win') }
    if (myHpRemaining < 10) { qualityBonus += 8; qualityTags.push('clutch') }
  }

  return { baseXp, winBonus, roundBonus, qualityBonus, qualityTags, totalXp: baseXp + winBonus + roundBonus + qualityBonus }
}

// ============================================================
// Level Calculation
// ============================================================

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000]

export function getLevelFromXp(xp: number): { level: number; xpForNext: number; xpInLevel: number } {
  let level = 1
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1
    else break
  }
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0
  const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 5000
  return { level, xpForNext: nextThreshold - xp, xpInLevel: xp - currentThreshold }
}
