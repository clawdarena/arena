/**
 * Combat V2 Built-in Strategy
 *
 * Deterministic fallback strategy when agent is unavailable.
 * Analyzes HP, energy, opponent patterns, and skill cooldowns
 * to make optimal skill choices.
 *
 * This is the backup brain - users customize via SKILL.md training.
 */

import type { MatchSkillInfo, SkillId } from '../types.js'

interface StrategyInput {
  round: number
  my_hp: number
  opponent_hp: number
  my_energy: number
  available_skills: MatchSkillInfo[]
  opponent_last_skill: SkillId | null
  status_effects: string[]
}

interface StrategyDecision {
  skill_id: SkillId
  reasoning: string // Stays LOCAL
}

/**
 * Decide the next skill based on game state.
 * Uses a priority-based approach:
 * 1. Critical HP → defensive skills
 * 2. High energy + offensive opportunity → big damage skills
 * 3. Opponent patterns → counter skills
 * 4. Default → basic attack or available skill
 */
export function decideAction(input: StrategyInput): StrategyDecision {
  const {
    round,
    my_hp,
    opponent_hp,
    my_energy,
    available_skills,
    opponent_last_skill,
    status_effects,
  } = input

  // Get usable skills (not on cooldown, not disabled, affordable)
  const usableSkills = available_skills.filter(
    (s) => s.cooldownLeft === 0 && !s.disabled && s.energyCost <= my_energy
  )

  // Helper to find a usable skill by ID
  const findSkill = (id: SkillId) => usableSkills.find((s) => s.id === id)

  // Helper to find any usable skill in a category
  const findByCategory = (category: string) =>
    usableSkills.find((s) => s.category === category)

  // Always have basic_attack as fallback
  const basicAttack = findSkill('basic_attack')

  // === CRITICAL HP: Survival mode ===
  if (my_hp <= 20) {
    // Try defensive skills first
    const defensive = findByCategory('defensive')
    if (defensive) {
      return {
        skill_id: defensive.id,
        reasoning: `HP critical (${my_hp}). Using ${defensive.name} for survival.`,
      }
    }

    // If opponent is also critical, go all-in
    if (opponent_hp <= 15) {
      const aggressive = findByCategory('aggressive')
      if (aggressive) {
        return {
          skill_id: aggressive.id,
          reasoning: `Both critical - going all-in with ${aggressive.name}!`,
        }
      }
    }

    // Fallback to basic attack (conserves energy for healing/defense later)
    if (basicAttack) {
      return {
        skill_id: 'basic_attack',
        reasoning: 'HP critical, conserving energy with basic attack.',
      }
    }
  }

  // === FIRST ROUND: Standard opener ===
  if (round === 1) {
    // Scan is great first move if available
    const scan = findSkill('scan')
    if (scan) {
      return {
        skill_id: 'scan',
        reasoning: 'Opening round - scanning opponent for intel.',
      }
    }

    // Or a moderate aggressive skill
    const powerStrike = findSkill('power_strike')
    if (powerStrike) {
      return {
        skill_id: 'power_strike',
        reasoning: 'Opening round - establishing pressure.',
      }
    }

    if (basicAttack) {
      return {
        skill_id: 'basic_attack',
        reasoning: 'Opening round - basic attack to assess.',
      }
    }
  }

  // === ENERGY ADVANTAGE: Use expensive skills ===
  if (my_energy >= 80) {
    // Time for a big move
    const berserker = findSkill('berserker_rush')
    if (berserker && opponent_hp > 30) {
      return {
        skill_id: 'berserker_rush',
        reasoning: `High energy (${my_energy}) - unleashing berserker rush!`,
      }
    }

    const reasoningBurst = findSkill('reasoning_burst')
    if (reasoningBurst) {
      return {
        skill_id: 'reasoning_burst',
        reasoning: `High energy (${my_energy}) - firing reasoning burst.`,
      }
    }
  }

  // === OPPONENT LOW HP: Finish them ===
  if (opponent_hp <= 30) {
    const aggressive = findByCategory('aggressive')
    if (aggressive) {
      return {
        skill_id: aggressive.id,
        reasoning: `Opponent HP low (${opponent_hp}). Going for the kill with ${aggressive.name}.`,
      }
    }

    if (basicAttack) {
      return {
        skill_id: 'basic_attack',
        reasoning: `Opponent HP low (${opponent_hp}). Basic attack to finish.`,
      }
    }
  }

  // === COUNTER OPPONENT PATTERNS ===
  if (opponent_last_skill) {
    // If they used a big skill, they might be low on energy - pressure them
    const aggressiveSkills = ['power_strike', 'reasoning_burst', 'berserker_rush']
    if (aggressiveSkills.includes(opponent_last_skill)) {
      const aggressive = findByCategory('aggressive')
      if (aggressive) {
        return {
          skill_id: aggressive.id,
          reasoning: `Opponent used ${opponent_last_skill} - they may be low on energy. Pressing advantage.`,
        }
      }
    }

    // If they defended, use a skill that counters defense
    if (opponent_last_skill === 'firewall' || opponent_last_skill === 'iron_fortress') {
      const empPulse = findSkill('emp_pulse')
      if (empPulse) {
        return {
          skill_id: 'emp_pulse',
          reasoning: `Opponent is defensive - using EMP to disable their skills.`,
        }
      }

      const virus = findSkill('virus')
      if (virus) {
        return {
          skill_id: 'virus',
          reasoning: `Opponent is defensive - infecting to bypass shields.`,
        }
      }
    }
  }

  // === STATUS EFFECTS: React appropriately ===
  if (status_effects.includes('scanned')) {
    // We've been scanned - use a defensive skill to not be predictable
    const defensive = findByCategory('defensive')
    if (defensive && Math.random() > 0.5) {
      return {
        skill_id: defensive.id,
        reasoning: 'Been scanned - mixing up with defense.',
      }
    }
  }

  // === MID-GAME TACTICS ===
  // Every 3rd round, try a tactical skill
  if (round % 3 === 0) {
    const tactical = findByCategory('tactical')
    if (tactical) {
      return {
        skill_id: tactical.id,
        reasoning: `Round ${round} - using tactical skill ${tactical.name}.`,
      }
    }
  }

  // === LOW ENERGY: Conserve ===
  if (my_energy <= 30) {
    if (basicAttack) {
      return {
        skill_id: 'basic_attack',
        reasoning: `Energy low (${my_energy}). Conserving with basic attack.`,
      }
    }
  }

  // === DEFAULT: Use any available aggressive skill or basic attack ===
  const aggressive = findByCategory('aggressive')
  if (aggressive) {
    return {
      skill_id: aggressive.id,
      reasoning: 'Standard turn - using available aggressive skill.',
    }
  }

  // Ultimate fallback
  if (basicAttack) {
    return {
      skill_id: 'basic_attack',
      reasoning: 'No better options - basic attack.',
    }
  }

  // If somehow nothing is available, try any usable skill
  if (usableSkills.length > 0) {
    return {
      skill_id: usableSkills[0].id,
      reasoning: 'Using first available skill.',
    }
  }

  // Absolute last resort (should never happen)
  return {
    skill_id: 'basic_attack',
    reasoning: 'Fallback - basic attack (no skills available?).',
  }
}
