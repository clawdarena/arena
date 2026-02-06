import type { ParsedAction } from './parser.js'

/**
 * Simple built-in combat strategy for testing.
 *
 * Analyses HP, opponent patterns, and decides an action.
 * This replaces the placeholder in executor.ts until
 * real OpenClaw bot integration is available.
 *
 * Strategy logic:
 * - If HP is critically low (<20%), prefer defending
 * - If opponent keeps attacking same target, anticipate and defend
 * - If opponent HP is low, attack aggressively
 * - Use processor target for stun chance when opponent HP > 50%
 * - Attack armor to break defense when opponent defends often
 */

interface StrategyInput {
  round: number
  my_hp: number
  opponent_hp: number
  my_attack: number
  my_defense: number
  my_speed: number
  opponent_last_action: string | null
  opponent_action_history: string[]
}

/**
 * Decide the next combat action based on game state.
 * Returns a parsed action with reasoning (reasoning stays local).
 */
export function decideAction(input: StrategyInput): ParsedAction {
  const {
    round,
    my_hp,
    opponent_hp,
    opponent_last_action,
    opponent_action_history,
  } = input

  const myHpPercent = my_hp  // Assuming max HP ~100
  const oppHpPercent = opponent_hp

  // Count opponent's recent action patterns
  const recentActions = opponent_action_history.slice(-5)
  const attackCount = recentActions.filter((a) => a === 'attack').length
  const defendCount = recentActions.filter((a) => a === 'defend').length

  // === Critical HP: prioritize survival ===
  if (myHpPercent <= 20) {
    // Defend if we're low, unless opponent is also very low
    if (oppHpPercent <= 15) {
      return {
        action: 'attack',
        target: 'core',
        reasoning: 'Both bots critical — going all-in on core attack to finish.',
      }
    }
    return {
      action: 'defend',
      target: null,
      reasoning: `HP critical (${myHpPercent}). Defending to survive.`,
    }
  }

  // === First round: open with attack ===
  if (round === 1) {
    return {
      action: 'attack',
      target: 'core',
      reasoning: 'Opening round — standard core attack to assess opponent.',
    }
  }

  // === Opponent defends a lot: target armor to break defense ===
  if (defendCount >= 3) {
    return {
      action: 'attack',
      target: 'armor',
      reasoning: `Opponent defended ${defendCount}/5 recent rounds. Targeting armor to break defense.`,
    }
  }

  // === Opponent is aggressive: defend or counter ===
  if (attackCount >= 4 && myHpPercent < 50) {
    return {
      action: 'defend',
      target: null,
      reasoning: `Opponent very aggressive (${attackCount}/5 attacks) and our HP is ${myHpPercent}. Defending.`,
    }
  }

  // === Opponent HP is low: finish them ===
  if (oppHpPercent <= 30) {
    return {
      action: 'attack',
      target: 'core',
      reasoning: `Opponent HP low (${oppHpPercent}). Going for the kill.`,
    }
  }

  // === Mid-game strategy: mix attacks ===
  // Try processor target for stun chance when opponent is healthy
  if (oppHpPercent > 60 && round % 3 === 0) {
    return {
      action: 'attack',
      target: 'processor',
      reasoning: `Round ${round}, opponent healthy. Targeting processor for stun chance.`,
    }
  }

  // === Opponent just defended: attack core (they might not defend again) ===
  if (opponent_last_action === 'defend') {
    return {
      action: 'attack',
      target: 'core',
      reasoning: 'Opponent just defended — unlikely to defend twice. Attacking core.',
    }
  }

  // === Default: alternate between attack and defend ===
  if (round % 4 === 0 && myHpPercent < 60) {
    return {
      action: 'defend',
      target: null,
      reasoning: `Periodic defend round (round ${round}, HP ${myHpPercent}).`,
    }
  }

  return {
    action: 'attack',
    target: 'core',
    reasoning: 'Standard core attack — no special conditions detected.',
  }
}
