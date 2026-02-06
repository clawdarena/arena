const K_FACTOR = 32

export interface EloResult {
  newEloA: number
  newEloB: number
  changeA: number
  changeB: number
}

/**
 * Calculate new ELO ratings after a match.
 * @param eloA - Player A's current ELO
 * @param eloB - Player B's current ELO
 * @param result - 1 = A wins, 0 = B wins, 0.5 = draw
 */
export function calculateElo(eloA: number, eloB: number, result: number): EloResult {
  const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400))
  const expectedB = 1 - expectedA

  const changeA = Math.round(K_FACTOR * (result - expectedA))
  const changeB = Math.round(K_FACTOR * ((1 - result) - expectedB))

  return {
    newEloA: eloA + changeA,
    newEloB: eloB + changeB,
    changeA,
    changeB,
  }
}

/**
 * Get the entry fee and reward for a match tier.
 */
export function getTierEconomics(matchType: string): { entryFee: number; winReward: number; minElo: number } {
  const tiers: Record<string, { entryFee: number; winReward: number; minElo: number }> = {
    ranked_bronze:   { entryFee: 50,  winReward: 90,   minElo: 0 },
    ranked_silver:   { entryFee: 100, winReward: 180,  minElo: 1200 },
    ranked_gold:     { entryFee: 200, winReward: 360,  minElo: 1400 },
    ranked_platinum: { entryFee: 400, winReward: 720,  minElo: 1600 },
    ranked_legend:   { entryFee: 800, winReward: 1440, minElo: 1800 },
  }

  return tiers[matchType] || tiers.ranked_bronze
}
