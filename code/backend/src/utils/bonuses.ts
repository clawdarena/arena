/**
 * External skill-based bonuses
 * These reward real-world bot usage, not just in-game purchases.
 */

// ============================================================
// Bot Age Bonus
// ============================================================

interface AgeBonuses {
  hp: number
  attack: number
  defense: number
  speed: number
  title: string | null
}

export function calculateAgeBonus(createdAt: Date): AgeBonuses {
  const ageMs = Date.now() - createdAt.getTime()
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24))

  if (ageDays >= 90) {
    return { hp: 3, attack: 0, defense: 2, speed: 0, title: 'Veteran' }
  }
  if (ageDays >= 30) {
    return { hp: 2, attack: 0, defense: 1, speed: 0, title: 'Seasoned' }
  }
  if (ageDays >= 7) {
    return { hp: 1, attack: 0, defense: 0, speed: 0, title: 'Established' }
  }
  return { hp: 0, attack: 0, defense: 0, speed: 0, title: null }
}

// ============================================================
// Decision Quality Score (DQS)
// ============================================================

interface DQSResult {
  score: number        // 0-100
  tier: 'bronze' | 'silver' | 'gold' | 'diamond'
  bonuses: { hp: number; attack: number; defense: number; speed: number }
  title: string | null
  breakdown: {
    defensive_play: number      // defends when low HP
    kill_targeting: number      // targets processor for kills
    counter_rate: number        // successful counter percentage
    action_entropy: number      // variety in action choices
    win_rate_factor: number     // weighted by wins
  }
}

interface RoundData {
  bot_action: string
  bot_target: string | null
  bot_hp: number
  bot_max_hp: number
  opponent_hp: number
  bot_counter: string
  bot_damage_dealt: number
}

export function calculateDQS(matchRounds: RoundData[][], matchResults: ('win' | 'loss' | 'draw')[]): DQSResult {
  if (matchRounds.length === 0) {
    return {
      score: 0,
      tier: 'bronze',
      bonuses: { hp: 0, attack: 0, defense: 0, speed: 0 },
      title: null,
      breakdown: { defensive_play: 0, kill_targeting: 0, counter_rate: 0, action_entropy: 0, win_rate_factor: 0 },
    }
  }

  let totalRounds = 0
  let defendedWhenLow = 0
  let shouldHaveDefended = 0
  let processedForKill = 0
  let couldHaveKilled = 0
  let counters = 0
  let counterOpportunities = 0
  const actionCounts: Record<string, number> = {}

  for (const rounds of matchRounds) {
    for (const round of rounds) {
      totalRounds++

      // Track action variety
      const actionKey = `${round.bot_action}_${round.bot_target || 'none'}`
      actionCounts[actionKey] = (actionCounts[actionKey] || 0) + 1

      // Defensive play: defended when HP < 30% of max
      const hpPercent = round.bot_hp / round.bot_max_hp
      if (hpPercent < 0.3) {
        shouldHaveDefended++
        if (round.bot_action === 'defend') {
          defendedWhenLow++
        }
      }

      // Kill targeting: targeted processor when opponent was low
      const opponentHpPercent = round.opponent_hp / 100  // approximate
      if (opponentHpPercent < 0.25) {
        couldHaveKilled++
        if (round.bot_target === 'processor') {
          processedForKill++
        }
      }

      // Counter tracking
      counterOpportunities++
      if (round.bot_counter !== 'none') {
        counters++
      }
    }
  }

  // Calculate sub-scores (0-20 each, total 100)
  const defensivePlay = shouldHaveDefended > 0
    ? (defendedWhenLow / shouldHaveDefended) * 20
    : 15  // neutral score if never got low

  const killTargeting = couldHaveKilled > 0
    ? (processedForKill / couldHaveKilled) * 20
    : 10  // neutral if opponent never got low

  const counterRate = counterOpportunities > 0
    ? (counters / counterOpportunities) * 20
    : 0

  // Action entropy (Shannon entropy normalized to 0-20)
  const totalActions = Object.values(actionCounts).reduce((a, b) => a + b, 0)
  const uniqueActions = Object.keys(actionCounts).length
  let entropy = 0
  for (const count of Object.values(actionCounts)) {
    const p = count / totalActions
    if (p > 0) entropy -= p * Math.log2(p)
  }
  const maxEntropy = Math.log2(Math.max(uniqueActions, 2))
  const actionEntropy = maxEntropy > 0 ? (entropy / maxEntropy) * 20 : 0

  // Win rate factor (0-20)
  const wins = matchResults.filter(r => r === 'win').length
  const winRate = matchResults.length > 0 ? wins / matchResults.length : 0
  const winRateFactor = winRate * 20

  const score = Math.round(defensivePlay + killTargeting + counterRate + actionEntropy + winRateFactor)

  // Determine tier and bonuses
  let tier: DQSResult['tier']
  let bonuses: DQSResult['bonuses']
  let title: string | null

  if (score >= 80) {
    tier = 'diamond'
    bonuses = { hp: 3, attack: 3, defense: 3, speed: 3 }
    title = 'Strategist'
  } else if (score >= 60) {
    tier = 'gold'
    bonuses = { hp: 2, attack: 2, defense: 2, speed: 2 }
    title = 'Tactician'
  } else if (score >= 30) {
    tier = 'silver'
    bonuses = { hp: 1, attack: 1, defense: 1, speed: 1 }
    title = 'Competent'
  } else {
    tier = 'bronze'
    bonuses = { hp: 0, attack: 0, defense: 0, speed: 0 }
    title = null
  }

  return {
    score,
    tier,
    bonuses,
    title,
    breakdown: {
      defensive_play: Math.round(defensivePlay),
      kill_targeting: Math.round(killTargeting),
      counter_rate: Math.round(counterRate),
      action_entropy: Math.round(actionEntropy),
      win_rate_factor: Math.round(winRateFactor),
    },
  }
}

// ============================================================
// Combined Bonus Calculator
// ============================================================

export interface CombinedBonuses {
  age: AgeBonuses
  dqs: DQSResult
  total: { hp: number; attack: number; defense: number; speed: number }
  titles: string[]
}

export function combineBonuses(age: AgeBonuses, dqs: DQSResult): CombinedBonuses {
  const titles: string[] = []
  if (age.title) titles.push(age.title)
  if (dqs.title) titles.push(dqs.title)

  return {
    age,
    dqs,
    total: {
      hp: age.hp + dqs.bonuses.hp,
      attack: age.attack + dqs.bonuses.attack,
      defense: age.defense + dqs.bonuses.defense,
      speed: age.speed + dqs.bonuses.speed,
    },
    titles,
  }
}
