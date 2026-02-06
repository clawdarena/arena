/**
 * Combat Resolution Engine — Trusted Referee
 * All combat resolves server-side per docs/COMBAT_SYSTEM.md
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
  statusEffects: ActiveEffect[]
  skillCooldowns: Map<string, number>  // skill_id → rounds remaining
  equippedSkills: SkillData[]
  timedOutConsecutive: number
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
  target: 'core' | 'armor' | 'processor' | null
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
  effects_applied: Array<{ bot: string; effect: string; duration: number }>
}

export interface MatchResult {
  winner: 'bot1' | 'bot2' | 'draw'
  rounds: RoundResult[]
  totalRounds: number
  durationMs: number
}

// ============================================================
// Target Modifiers
// ============================================================

const TARGET_MODIFIERS: Record<string, { defenseMult: number }> = {
  core: { defenseMult: 1.0 },
  armor: { defenseMult: 1.5 },
  processor: { defenseMult: 0.5 },
}

// ============================================================
// Damage Calculation
// ============================================================

function calculateDamage(
  attacker: BotCombatState,
  defender: BotCombatState,
  target: string,
  defenderAction: string
): number {
  const targetMod = TARGET_MODIFIERS[target]?.defenseMult ?? 1.0
  let effectiveDefense = defender.defense * targetMod

  // Defend action bonus
  if (defenderAction === 'defend') {
    effectiveDefense *= 1.5
  }

  // Armor broken status
  const armorBroken = defender.statusEffects.find((e) => e.type === 'armor_broken')
  if (armorBroken) {
    effectiveDefense = Math.max(0, effectiveDefense - 2)
  }

  return Math.max(1, Math.round(attacker.attack - effectiveDefense))
}

// ============================================================
// Status Effect Tick
// ============================================================

function tickEffects(bot: BotCombatState): Array<{ bot: string; effect: string; duration: number }> {
  const applied: Array<{ bot: string; effect: string; duration: number }> = []

  for (const effect of bot.statusEffects) {
    switch (effect.type) {
      case 'burning':
        bot.hp -= effect.data.tick_damage || 3
        applied.push({ bot: bot.id, effect: 'burning_tick', duration: effect.duration })
        break
      case 'regenerating':
        bot.hp = Math.min(bot.maxHp, bot.hp + (effect.data.heal_per_round || 8))
        applied.push({ bot: bot.id, effect: 'regen_tick', duration: effect.duration })
        break
    }

    // Decrement duration
    effect.duration--
  }

  // Remove expired effects
  bot.statusEffects = bot.statusEffects.filter((e) => e.duration > 0)

  return applied
}

// ============================================================
// Apply Stat Modifiers from Effects
// ============================================================

function getEffectiveStats(bot: BotCombatState): { attack: number; defense: number; speed: number } {
  let attack = bot.attack
  let defense = bot.defense
  let speed = bot.speed

  for (const effect of bot.statusEffects) {
    switch (effect.type) {
      case 'overclock':
        attack += effect.data.attack_bonus || 5
        speed += effect.data.speed_bonus || 5
        break
      case 'iron_fortress':
        defense += effect.data.defense_bonus || 10
        break
      case 'berserker':
        attack += effect.data.attack_bonus || 15
        defense -= effect.data.defense_penalty || 5
        break
    }
  }

  return { attack: Math.max(0, attack), defense: Math.max(0, defense), speed: Math.max(0, speed) }
}

// ============================================================
// Skill Resolution
// ============================================================

function resolveSkill(
  user: BotCombatState,
  opponent: BotCombatState,
  skillId: string
): { damage: number; effectsApplied: Array<{ bot: string; effect: string; duration: number }> } {
  const skill = user.equippedSkills.find((s) => s.id === skillId)
  if (!skill) return { damage: 0, effectsApplied: [] }

  const effects: Array<{ bot: string; effect: string; duration: number }> = []
  let damage = 0
  const data = skill.effect_data

  // Apply based on skill type
  if (data.flat_damage) {
    damage = data.flat_damage
  }
  if (data.damage_mult) {
    const defenseIgnore = data.defense_ignore || 0
    const effectiveDefense = opponent.defense * (1 - defenseIgnore)
    damage = Math.max(1, Math.round(user.attack * data.damage_mult - effectiveDefense))
  }
  if (data.status && data.duration) {
    const target = skill.effect_data.target === 'self' ? user : opponent
    const targetId = target === user ? user.id : opponent.id
    target.statusEffects.push({
      type: data.status,
      duration: data.duration,
      data,
    })
    effects.push({ bot: targetId, effect: data.status, duration: data.duration })
  }
  if (data.block) {
    // Shield wall - handled in damage resolution
  }
  if (data.heal) {
    user.hp = Math.min(user.maxHp, user.hp + data.heal)
    effects.push({ bot: user.id, effect: 'heal', duration: 0 })
  }
  if (data.reset_cooldowns) {
    opponent.skillCooldowns.forEach((_, key) => {
      const oppSkill = opponent.equippedSkills.find((s) => s.id === key)
      if (oppSkill) opponent.skillCooldowns.set(key, oppSkill.cooldown)
    })
  }

  // Set cooldown
  user.skillCooldowns.set(skillId, skill.cooldown)

  return { damage, effectsApplied: effects }
}

// ============================================================
// Seeded Random (deterministic per match)
// ============================================================

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
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
  const effects: Array<{ bot: string; effect: string; duration: number }> = []

  // 1. Tick status effects
  effects.push(...tickEffects(bot1))
  effects.push(...tickEffects(bot2))

  // 2. Check forced actions (stun, iron_fortress)
  const isStunned1 = bot1.statusEffects.some((e) => e.type === 'stunned')
  const isStunned2 = bot2.statusEffects.some((e) => e.type === 'stunned')
  const isFortress1 = bot1.statusEffects.some((e) => e.type === 'iron_fortress')
  const isFortress2 = bot2.statusEffects.some((e) => e.type === 'iron_fortress')

  if (isStunned1 || timed1) action1 = { action: 'defend', target: null }
  if (isStunned2 || timed2) action2 = { action: 'defend', target: null }
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

  // 3. Get effective stats
  const stats1 = getEffectiveStats(bot1)
  const stats2 = getEffectiveStats(bot2)

  // Temporarily apply effective stats
  const origAtk1 = bot1.attack; bot1.attack = stats1.attack
  const origDef1 = bot1.defense; bot1.defense = stats1.defense
  const origAtk2 = bot2.attack; bot2.attack = stats2.attack
  const origDef2 = bot2.defense; bot2.defense = stats2.defense

  // 4. Determine priority
  const tiebreaker = seededRandom(matchSeed + round)
  const bot1First = stats1.speed > stats2.speed || (stats1.speed === stats2.speed && tiebreaker < 0.5)

  let bot1Damage = 0
  let bot2Damage = 0

  // 5. Resolve skills first
  if (action1.action === 'skill' && action1.skill_id) {
    const result = resolveSkill(bot1, bot2, action1.skill_id)
    bot1Damage += result.damage
    effects.push(...result.effectsApplied)
  }
  if (action2.action === 'skill' && action2.skill_id) {
    const result = resolveSkill(bot2, bot1, action2.skill_id)
    bot2Damage += result.damage
    effects.push(...result.effectsApplied)
  }

  // 6. Resolve attacks
  if (action1.action === 'attack' && action1.target) {
    // Check shield wall
    const shieldWall2 = action2.action === 'skill' && bot2.statusEffects.some((e) => e.type === 'shield_wall' || (e.data && e.data.block))
    if (!shieldWall2) {
      bot1Damage += calculateDamage(bot1, bot2, action1.target, action2.action)

      // Processor stun chance
      if (action1.target === 'processor' && seededRandom(matchSeed + round + 100) < 0.3) {
        bot2.statusEffects.push({ type: 'stunned', duration: 1, data: {} })
        effects.push({ bot: bot2.id, effect: 'stunned', duration: 1 })
      }

      // Armor break
      if (action1.target === 'armor' && bot1Damage > 0) {
        bot2.statusEffects.push({ type: 'armor_broken', duration: 1, data: {} })
        effects.push({ bot: bot2.id, effect: 'armor_broken', duration: 1 })
      }
    }
  }

  if (action2.action === 'attack' && action2.target) {
    const shieldWall1 = action1.action === 'skill' && bot1.statusEffects.some((e) => e.type === 'shield_wall' || (e.data && e.data.block))
    if (!shieldWall1) {
      bot2Damage += calculateDamage(bot2, bot1, action2.target, action1.action)

      if (action2.target === 'processor' && seededRandom(matchSeed + round + 200) < 0.3) {
        bot1.statusEffects.push({ type: 'stunned', duration: 1, data: {} })
        effects.push({ bot: bot1.id, effect: 'stunned', duration: 1 })
      }

      if (action2.target === 'armor' && bot2Damage > 0) {
        bot1.statusEffects.push({ type: 'armor_broken', duration: 1, data: {} })
        effects.push({ bot: bot1.id, effect: 'armor_broken', duration: 1 })
      }
    }
  }

  // 7. Mirror coat reflection
  const mirror1 = bot1.statusEffects.find((e) => e.type === 'mirror_coat')
  const mirror2 = bot2.statusEffects.find((e) => e.type === 'mirror_coat')
  if (mirror1 && bot2Damage > 0) {
    const reflected = Math.round(bot2Damage * (mirror1.data.reflect_pct || 0.5))
    bot1Damage += reflected  // Add reflected damage to bot1's output
    effects.push({ bot: bot1.id, effect: 'mirror_reflect', duration: 0 })
  }
  if (mirror2 && bot1Damage > 0) {
    const reflected = Math.round(bot1Damage * (mirror2.data.reflect_pct || 0.5))
    bot2Damage += reflected
    effects.push({ bot: bot2.id, effect: 'mirror_reflect', duration: 0 })
  }

  // 8. Apply damage
  bot2.hp = Math.max(0, bot2.hp - bot1Damage)
  bot1.hp = Math.max(0, bot1.hp - bot2Damage)

  // Restore base stats
  bot1.attack = origAtk1; bot1.defense = origDef1
  bot2.attack = origAtk2; bot2.defense = origDef2

  // Decrement all skill cooldowns
  bot1.skillCooldowns.forEach((v, k) => {
    if (v > 0) bot1.skillCooldowns.set(k, v - 1)
  })
  bot2.skillCooldowns.forEach((v, k) => {
    if (v > 0) bot2.skillCooldowns.set(k, v - 1)
  })

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

    // Track consecutive timeouts
    bot1.timedOutConsecutive = timed1 ? bot1.timedOutConsecutive + 1 : 0
    bot2.timedOutConsecutive = timed2 ? bot2.timedOutConsecutive + 1 : 0

    // 3 consecutive timeouts = forfeit
    if (bot1.timedOutConsecutive >= 3) {
      return { winner: 'bot2', rounds, totalRounds: round, durationMs: Date.now() - startTime }
    }
    if (bot2.timedOutConsecutive >= 3) {
      return { winner: 'bot1', rounds, totalRounds: round, durationMs: Date.now() - startTime }
    }

    // Check win condition
    if (bot1.hp <= 0 && bot2.hp <= 0) {
      return { winner: 'draw', rounds, totalRounds: round, durationMs: Date.now() - startTime }
    }
    if (bot1.hp <= 0) {
      return { winner: 'bot2', rounds, totalRounds: round, durationMs: Date.now() - startTime }
    }
    if (bot2.hp <= 0) {
      return { winner: 'bot1', rounds, totalRounds: round, durationMs: Date.now() - startTime }
    }
  }

  // Max rounds reached — highest HP wins
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
    // Clean win: >50% HP remaining
    if (myHpRemaining > myMaxHp * 0.5) {
      qualityBonus += 5
      qualityTags.push('clean_win')
    }
    // Flawless: no damage taken
    if (myHpRemaining >= myMaxHp) {
      qualityBonus += 15
      qualityTags.push('flawless')
    }
    // Comeback: was below 25% HP at some point
    if (myHpAtLowest < myMaxHp * 0.25) {
      qualityBonus += 10
      qualityTags.push('comeback')
    }
    // Speed win: won in 3 or fewer rounds
    if (roundsFought <= 3) {
      qualityBonus += 8
      qualityTags.push('speed_win')
    }
    // Clutch: won with <10 HP
    if (myHpRemaining < 10) {
      qualityBonus += 8
      qualityTags.push('clutch')
    }
  }

  return {
    baseXp,
    winBonus,
    roundBonus,
    qualityBonus,
    qualityTags,
    totalXp: baseXp + winBonus + roundBonus + qualityBonus,
  }
}

// ============================================================
// Level Calculation
// ============================================================

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000]

export function getLevelFromXp(xp: number): { level: number; xpForNext: number; xpInLevel: number } {
  let level = 1
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1
    } else {
      break
    }
  }

  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0
  const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 5000
  const xpInLevel = xp - currentThreshold
  const xpForNext = nextThreshold - xp

  return { level, xpForNext, xpInLevel }
}
