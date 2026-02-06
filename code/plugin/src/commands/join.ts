import { getConfig, getPrivateKey } from '../keys.js'
import { ArenaSocket } from '../socket.js'
import { CombatExecutor } from '../combat/executor.js'

/**
 * Join the matchmaking queue and wait for a match.
 *
 * Flow:
 * 1. Connect to Arena WebSocket
 * 2. Join matchmaking queue
 * 3. Wait for match_found event
 * 4. Signal ready
 * 5. Execute combat rounds locally
 * 6. Display results
 */
export async function joinQueue(matchType: string): Promise<void> {
  const config = getConfig()

  if (!config.bot_id || !config.bot_name) {
    console.error('❌ Bot not registered. Run: arena register <bot-name> --username <name>')
    process.exit(1)
  }

  if (!getPrivateKey()) {
    console.error('❌ No private key found. Run: arena register <bot-name> --username <name>')
    process.exit(1)
  }

  console.log(`🔍 Searching for ${matchType} match...`)
  console.log(`  Bot: ${config.bot_name}`)
  console.log(`  Press Ctrl+C to cancel\n`)

  // Connect to Arena
  const socket = new ArenaSocket()

  try {
    await socket.connect()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`❌ Failed to connect: ${message}`)
    console.error('  Make sure the Arena server is running')
    process.exit(1)
  }

  // Set up combat executor
  const executor = new CombatExecutor(config.bot_id as string, socket)

  // Listen for match found
  socket.on('match_found', (match: any) => {
    console.log('🎮 Match found!')
    console.log(`  Opponent: ${match.opponent.name} (${match.opponent.elo} ELO)`)
    console.log(`  Match type: ${match.match_type}`)
    console.log(`  Starting in ${match.start_in_seconds}s...\n`)

    // Signal ready
    socket.emit('ready', {
      match_id: match.match_id,
      bot_id: config.bot_id,
    })
  })

  // Listen for match start
  socket.on('match_start', (data: any) => {
    console.log('🏟️  Match started!')
    console.log(`  Max rounds: ${data.max_rounds}`)
    console.log(`  Time limit: ${data.time_limit_seconds}s per round\n`)
  })

  // Listen for round start
  socket.on('round_start', async (roundData: any) => {
    // Find our bot's data
    const myBotId = config.bot_id as string
    const isBot1 = roundData.bot1.id === myBotId
    const myBot = isBot1 ? roundData.bot1 : roundData.bot2
    const oppBot = isBot1 ? roundData.bot2 : roundData.bot1

    // Get previous round info
    const prevRound = roundData.previous_round
    const oppLastAction = prevRound
      ? (isBot1 ? prevRound.bot2_action : prevRound.bot1_action)
      : null

    // Execute combat turn locally
    await executor.executeRound({
      match_id: roundData.match_id,
      round: roundData.round,
      my_hp: myBot.hp,
      opponent_hp: oppBot.hp,
      my_attack: 15, // TODO: Get from bot stats
      my_defense: 10,
      my_speed: 10,
      opponent_last_action: oppLastAction,
      time_limit_seconds: roundData.time_limit_seconds,
    })
  })

  // Listen for round complete
  socket.on('round_complete', (result: any) => {
    console.log(`\n  📊 Round ${result.round} result:`)
    console.log(`    Bot1: ${result.bot1_action} → ${result.bot1_damage_dealt} dmg | HP: ${result.bot1_hp}`)
    console.log(`    Bot2: ${result.bot2_action} → ${result.bot2_damage_dealt} dmg | HP: ${result.bot2_hp}`)
  })

  // Listen for match end
  socket.on('match_end', (result: any) => {
    const myBotId = config.bot_id as string
    const isWinner = result.winner.bot_id === myBotId

    console.log('\n' + '='.repeat(50))
    if (isWinner) {
      console.log('🏆 VICTORY!')
      console.log(`  Credits won: +${result.winner.credits_won} AC`)
      console.log(`  ELO: ${result.winner.elo_before} → ${result.winner.elo_after} (${result.winner.elo_change > 0 ? '+' : ''}${result.winner.elo_change})`)
    } else {
      console.log('💀 DEFEAT')
      console.log(`  Credits lost: -${result.loser.credits_lost} AC`)
      console.log(`  ELO: ${result.loser.elo_before} → ${result.loser.elo_after} (${result.loser.elo_change})`)
    }
    console.log(`  Rounds: ${result.rounds_fought}`)
    console.log('='.repeat(50) + '\n')

    socket.disconnect()
    process.exit(0)
  })

  // Listen for opponent disconnect
  socket.on('player_disconnected', (data: any) => {
    console.log(`\n⚠️  Opponent disconnected! Grace period: ${data.grace_period_seconds}s`)
  })

  socket.on('player_reconnected', () => {
    console.log('✅ Opponent reconnected!')
  })

  // Join the queue
  socket.emit('join_queue', {
    bot_id: config.bot_id,
    match_type: matchType,
  })

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\n👋 Leaving queue...')
    socket.emit('leave_queue', { bot_id: config.bot_id })
    socket.disconnect()
    process.exit(0)
  })
}
