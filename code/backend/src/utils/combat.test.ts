import { describe, expect, test } from 'bun:test'
import { resolveRound, type BotCombatState, type CombatAction } from './combat'

// AUDIT FIX: Add automated test to enforce equipped-skill authorization

function buildBot(id: string): BotCombatState {
  return {
    id,
    name: id,
    hp: 100,
    maxHp: 100,
    attack: 20,
    defense: 10,
    speed: 10,
    energy: 100,
    maxEnergy: 100,
    statusEffects: [],
    skillCooldowns: new Map(),
    equippedSkills: [{ id: 'firewall', slot: 1, cooldown: 3, effect_data: {} }],
    timedOutConsecutive: 0,
    momentumStreak: 0,
    skillUsesThisMatch: new Map(),
    disabledSkills: new Set(),
    overclockNextAttack: false,
    timeBombs: [],
  }
}

describe('combat authorization', () => {
  test('non-equipped skill is downgraded to defend', () => {
    const bot1 = buildBot('b1')
    const bot2 = buildBot('b2')

    const a1: CombatAction = { action: 'skill', target: 'opponent', skill_id: 'virus' }
    const a2: CombatAction = { action: 'defend', target: null }

    const result = resolveRound(bot1, bot2, a1, a2, 1, 123, 100, 100, false, false)
    expect(result.bot1_action).toBe('defend')
  })
})
