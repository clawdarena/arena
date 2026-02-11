/**
 * Stat-based damage calculator for bot AI suggestions
 * Mirrors backend formulas for client-side prediction
 */

export interface BotStats {
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  energy: number
}

const DAMAGE_FLOOR_BASIC = 3
const DAMAGE_FLOOR_SKILL = 4
const DEFENSE_REDUCTION_MULTIPLIER = 0.6

/**
 * Calculate expected damage for basic attack
 */
export function calculateBasicAttackDamage(
  attacker: BotStats,
  defender: BotStats,
  defenderDefending: boolean = false
): number {
  // Base damage: Power × 0.8 + Speed × 0.2 + 3
  const baseDamage = attacker.attack * 0.8 + attacker.speed * 0.2 + 3

  // Defense reduction
  let effectiveDefense = defender.defense * DEFENSE_REDUCTION_MULTIPLIER

  // Defend action bonus
  if (defenderDefending) {
    effectiveDefense *= 1.5
  }

  const damage = baseDamage - effectiveDefense

  return Math.max(DAMAGE_FLOOR_BASIC, Math.round(damage))
}

/**
 * Calculate expected damage for skills
 */
export function calculateSkillDamage(
  skillId: string,
  attacker: BotStats,
  defender: BotStats,
  defenderDefending: boolean = false
): number {
  let baseDamage = 0
  let defenseMultiplier = DEFENSE_REDUCTION_MULTIPLIER

  switch (skillId) {
    case 'power_strike':
      // Power × 1.2 + 8
      baseDamage = attacker.attack * 1.2 + 8
      break

    case 'reasoning_burst':
      // Speed × 1.4 + 6
      baseDamage = attacker.speed * 1.4 + 6
      defenseMultiplier = 0.5
      break

    case 'spawn_attack':
      // Multi-hit: 3 × (Power × 0.4 + Speed × 0.3 + 2)
      const hitDamage = attacker.attack * 0.4 + attacker.speed * 0.3 + 2
      baseDamage = hitDamage * 3
      defenseMultiplier = 0.4
      break

    case 'berserker_rush':
      // Power × 1.8 + Speed × 0.4 + 10
      baseDamage = attacker.attack * 1.8 + attacker.speed * 0.4 + 10
      defenseMultiplier = 0.5
      break

    case 'time_bomb':
      // Power × 1.0 + Speed × 0.5 + 12
      baseDamage = attacker.attack * 1.0 + attacker.speed * 0.5 + 12
      defenseMultiplier = 0.4
      break

    case 'virus':
      // DoT per tick: (Power × 0.4 + Speed × 0.3)
      const tickDamage = attacker.attack * 0.4 + attacker.speed * 0.3
      baseDamage = tickDamage * 3 // Total over 3 rounds
      defenseMultiplier = 0.3 // Defense-piercing
      break

    default:
      // Fallback to basic attack
      return calculateBasicAttackDamage(attacker, defender, defenderDefending)
  }

  // Apply defense reduction
  let effectiveDefense = defender.defense * defenseMultiplier

  if (defenderDefending) {
    effectiveDefense *= 1.25
  }

  const damage = baseDamage - effectiveDefense

  return Math.max(DAMAGE_FLOOR_SKILL, Math.round(damage))
}

/**
 * Calculate healing amount for Rollback
 */
export function calculateRollbackHealing(stats: BotStats): number {
  // 10 + (Defense × 0.6) + (MaxHP × 0.12), max 30% of MaxHP
  const baseHeal = 10 + stats.defense * 0.6 + stats.maxHp * 0.12
  const maxHeal = stats.maxHp * 0.3
  return Math.min(maxHeal, Math.round(baseHeal))
}

/**
 * Calculate Firewall shield strength
 */
export function calculateFirewallShield(stats: BotStats): number {
  // Defense × 1.5 + 10
  return Math.round(stats.defense * 1.5 + 10)
}

/**
 * Calculate Sleep Bomb success chance
 */
export function calculateSleepChance(stats: BotStats): number {
  // 0.5 + (Speed / 80), max 0.85
  return Math.min(0.85, 0.5 + stats.speed / 80)
}

/**
 * Calculate EMP Pulse energy drain
 */
export function calculateEMPDrain(stats: BotStats): number {
  // 25 + (Speed × 0.5), min 20
  return Math.max(20, Math.round(25 + stats.speed * 0.5))
}

/**
 * Calculate Overclock multiplier
 */
export function calculateOverclockMultiplier(stats: BotStats): number {
  // 1.3 + (Speed / 50), max 1.8
  return Math.min(1.8, 1.3 + stats.speed / 50)
}

/**
 * Calculate Mirror Coat reflect percentage
 */
export function calculateMirrorReflect(stats: BotStats): number {
  // 0.4 + (Defense / 100), max 0.85
  return Math.min(0.85, 0.4 + stats.defense / 100)
}

/**
 * Determine if attacker is favored based on stats
 */
export function analyzeMatchup(myStats: BotStats, oppStats: BotStats): {
  favoredStat: 'power' | 'defense' | 'speed' | 'balanced'
  attackAdvantage: number // -1 to 1 scale
  defenseAdvantage: number
  speedAdvantage: number
} {
  const attackDiff = myStats.attack - oppStats.defense
  const defenseDiff = myStats.defense - oppStats.attack
  const speedDiff = myStats.speed - oppStats.speed

  // Normalize to -1 to 1 scale
  const attackAdvantage = Math.max(-1, Math.min(1, attackDiff / 20))
  const defenseAdvantage = Math.max(-1, Math.min(1, defenseDiff / 20))
  const speedAdvantage = Math.max(-1, Math.min(1, speedDiff / 20))

  // Determine favored stat
  let favoredStat: 'power' | 'defense' | 'speed' | 'balanced' = 'balanced'
  const maxAdv = Math.max(attackAdvantage, defenseAdvantage, speedAdvantage)
  
  if (maxAdv > 0.3) {
    if (attackAdvantage === maxAdv) favoredStat = 'power'
    else if (defenseAdvantage === maxAdv) favoredStat = 'defense'
    else if (speedAdvantage === maxAdv) favoredStat = 'speed'
  }

  return {
    favoredStat,
    attackAdvantage,
    defenseAdvantage,
    speedAdvantage,
  }
}

/**
 * Get best skill for current situation
 */
export function recommendSkill(
  myStats: BotStats,
  oppStats: BotStats,
  availableSkills: string[],
  situation: 'burst' | 'sustain' | 'control' | 'finish'
): { skillId: string; expectedDamage: number; reasoning: string } {
  const matchup = analyzeMatchup(myStats, oppStats)

  // Calculate damage for available offensive skills
  const damageOptions = availableSkills.map(skillId => ({
    skillId,
    damage: calculateSkillDamage(skillId, myStats, oppStats, false),
  }))

  damageOptions.sort((a, b) => b.damage - a.damage)

  let recommended = damageOptions[0]
  let reasoning = ''

  switch (situation) {
    case 'burst':
      // Highest damage
      recommended = damageOptions[0]
      reasoning = `Max damage (${recommended.damage}) to quickly finish opponent`
      break

    case 'finish':
      // Any skill that can kill
      const killSkill = damageOptions.find(opt => opt.damage >= oppStats.hp)
      if (killSkill) {
        recommended = killSkill
        reasoning = `Lethal damage (${killSkill.damage} ≥ ${oppStats.hp} HP). Finish them!`
      } else {
        recommended = damageOptions[0]
        reasoning = `Maximum damage (${recommended.damage}) toward finishing blow`
      }
      break

    case 'control':
      // Prefer utility/CC
      if (availableSkills.includes('sleep_bomb')) {
        const sleepChance = calculateSleepChance(myStats)
        recommended = { skillId: 'sleep_bomb', damage: 0 }
        reasoning = `${Math.round(sleepChance * 100)}% chance to disable opponent`
      } else if (availableSkills.includes('emp_pulse')) {
        const drain = calculateEMPDrain(myStats)
        recommended = { skillId: 'emp_pulse', damage: 0 }
        reasoning = `Drain ${drain} energy to limit opponent options`
      } else {
        recommended = damageOptions[0]
        reasoning = `No CC available. Deal ${recommended.damage} damage instead`
      }
      break

    case 'sustain':
      // Prefer survival
      if (availableSkills.includes('rollback')) {
        const heal = calculateRollbackHealing(myStats)
        recommended = { skillId: 'rollback', damage: 0 }
        reasoning = `Heal ${heal} HP (${Math.round(heal / myStats.maxHp * 100)}% of max)`
      } else if (availableSkills.includes('firewall')) {
        const shield = calculateFirewallShield(myStats)
        recommended = { skillId: 'firewall', damage: 0 }
        reasoning = `Shield ${shield} HP worth of damage`
      } else {
        recommended = damageOptions[0]
        reasoning = `No sustain available. Deal ${recommended.damage} damage`
      }
      break
  }

  return {
    skillId: recommended.skillId,
    expectedDamage: recommended.damage,
    reasoning,
  }
}
