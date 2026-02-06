import chalk from 'chalk'
import { loadMatchHistory, loadMatchLog, getLocalStats } from '../combat/logger.js'

/**
 * CLI command to view local match history from log files.
 *
 * Shows recent matches with win/loss, ELO change, and credits.
 * Can also show detailed round-by-round log for a specific match.
 */
export async function showHistory(options: { limit?: number; match?: string }): Promise<void> {
  // Show specific match details
  if (options.match) {
    const log = loadMatchLog(options.match)
    if (!log) {
      console.log(chalk.red(`❌ Match not found: ${options.match}`))
      console.log(chalk.gray('  Check the match ID and try again.'))
      return
    }

    console.log(chalk.bold(`\n📜 Match Details: ${log.match.match_id}\n`))
    console.log(`  Opponent:  ${log.match.opponent_name} (${log.match.opponent_elo} ELO)`)
    console.log(`  Type:      ${log.match.match_type}`)
    console.log(`  Result:    ${formatResult(log.match.result)}`)
    console.log(`  Rounds:    ${log.match.rounds_fought}`)
    console.log(`  Duration:  ${log.match.duration_seconds}s`)
    console.log(`  ELO:       ${log.match.elo_before} → ${log.match.elo_after} (${formatChange(log.match.elo_change)})`)
    console.log(`  Credits:   ${formatChange(log.match.credits_change)} AC`)
    console.log(`  Date:      ${new Date(log.match.timestamp).toLocaleString()}`)

    if (log.rounds.length > 0) {
      console.log(chalk.bold('\n  Round-by-Round:\n'))
      for (const round of log.rounds) {
        const actionStr = round.my_action === 'defend'
          ? chalk.blue('DEF')
          : chalk.red(`ATK → ${round.my_target || 'core'}`)
        const oppStr = round.opponent_action
          ? (round.opponent_action === 'defend' ? chalk.blue('DEF') : chalk.red('ATK'))
          : chalk.gray('???')

        console.log(`  R${String(round.round).padStart(2, ' ')} | Me: ${actionStr} | Opp: ${oppStr} | HP: ${round.my_hp} vs ${round.opponent_hp} | ${round.response_time_ms}ms`)

        if (round.bot_reasoning) {
          console.log(chalk.gray(`       → ${round.bot_reasoning}`))
        }
      }
    }

    console.log()
    return
  }

  // Show summary stats
  const stats = getLocalStats()

  console.log(chalk.bold('\n📊 Local Combat Stats\n'))
  console.log(`  Matches:    ${stats.totalMatches}`)
  console.log(`  Wins:       ${chalk.green(String(stats.wins))}`)
  console.log(`  Losses:     ${chalk.red(String(stats.losses))}`)
  console.log(`  Draws:      ${chalk.gray(String(stats.draws))}`)
  console.log(`  Win Rate:   ${stats.winRate}%`)
  console.log(`  Net ELO:    ${formatChange(stats.totalEloChange)}`)
  console.log(`  Net Credits: ${formatChange(stats.totalCreditsChange)} AC`)

  // Show recent matches
  const limit = options.limit ?? 10
  const history = loadMatchHistory(limit)

  if (history.length === 0) {
    console.log(chalk.gray('\n  No matches recorded yet. Play some games!\n'))
    return
  }

  console.log(chalk.bold(`\n📜 Recent Matches (last ${history.length}):\n`))

  for (const match of history) {
    const date = new Date(match.timestamp).toLocaleDateString()
    const result = formatResult(match.result)
    const elo = formatChange(match.elo_change)
    const credits = formatChange(match.credits_change)

    console.log(
      `  ${date} | ${result} vs ${match.opponent_name.padEnd(15)} | ${elo} ELO | ${credits} AC | ${match.rounds_fought}R | ${match.match_id.slice(0, 8)}...`
    )
  }

  console.log(chalk.gray(`\n  Use --match <id> to see detailed round log\n`))
}

function formatResult(result: string): string {
  switch (result) {
    case 'win': return chalk.green('WIN ')
    case 'loss': return chalk.red('LOSS')
    case 'draw': return chalk.gray('DRAW')
    default: return chalk.gray('????')
  }
}

function formatChange(value: number): string {
  if (value > 0) return chalk.green(`+${value}`)
  if (value < 0) return chalk.red(String(value))
  return chalk.gray('±0')
}
