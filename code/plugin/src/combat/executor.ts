import { signEvent } from '../keys.js'
import { ArenaSocket } from '../socket.js'
import { parseAction } from './parser.js'
import { decideAction } from './strategy.js'
import { saveMatchLog, type FullMatchLog, type RoundLogEntry, type MatchLogEntry } from './logger.js'

/**
 * Represents the game state sent to the bot each round.
 * PRIVACY: Only structured data (numbers, enums) — no raw server strings.
 */
interface RoundState {
  match_id: string
  round: number
  my_hp: number
  opponent_hp: number
  my_attack: number
  my_defense: number
  my_speed: number
  opponent_last_action: string | null
  time_limit_seconds: number
}

/** Default timeout for bot decisions (in ms). If bot takes longer, auto-defend. */
const BOT_TIMEOUT_MS = 8000

/**
 * The local combat executor.
 *
 * Responsibilities:
 * 1. Receive game state from platform
 * 2. Generate a SAFE prompt for the local bot (no raw server strings!)
 * 3. Parse the bot's response into an action
 * 4. Sign the action with the user's private key
 * 5. Send ONLY the action + target to the platform
 *
 * PRIVACY BOUNDARY:
 * - Bot's full response, reasoning, strategy → stays LOCAL
 * - Only action type + target → sent to server
 */
export class CombatExecutor {
  private botId: string
  private socket: ArenaSocket
  private matchId: string | null = null
  private opponentActionHistory: string[] = []
  private roundLogs: RoundLogEntry[] = []

  constructor(botId: string, socket: ArenaSocket) {
    this.botId = botId
    this.socket = socket
  }

  /**
   * Handle a round_start event from the server.
   * Executes the full combat turn locally.
   */
  async executeRound(roundData: RoundState): Promise<void> {
    this.matchId = roundData.match_id

    console.log(`\n⚔️  Round ${roundData.round}`)
    console.log(`  HP: ${roundData.my_hp} | Opponent: ${roundData.opponent_hp}`)

    // Track opponent history
    if (roundData.opponent_last_action) {
      this.opponentActionHistory.push(roundData.opponent_last_action)
    }

    // 1. Generate combat prompt (LOCALLY — safe structured data only)
    const prompt = this.buildPrompt(roundData)

    // 2. Get bot decision with timeout handling
    const startTime = Date.now()
    let botResponse: string
    let timedOut = false

    try {
      botResponse = await this.getBotDecisionWithTimeout(roundData, BOT_TIMEOUT_MS)
    } catch {
      // Timeout or error → auto-defend
      timedOut = true
      botResponse = JSON.stringify({
        action: 'defend',
        target: null,
        reasoning: 'Auto-defend due to timeout',
      })
      console.log('  ⏰ Bot timed out — auto-defending')
    }
    const responseTime = Date.now() - startTime

    // 3. Parse action from response (LOCALLY)
    const action = parseAction(botResponse)

    console.log(`  Action: ${action.action} → ${action.target || 'n/a'} (${responseTime}ms)${timedOut ? ' [TIMEOUT]' : ''}`)

    // 4. Log round details LOCALLY (never sent to server)
    this.roundLogs.push({
      round: roundData.round,
      my_hp: roundData.my_hp,
      opponent_hp: roundData.opponent_hp,
      my_action: action.action,
      my_target: action.target,
      opponent_action: roundData.opponent_last_action,
      damage_dealt: 0,  // Filled in by round_complete
      damage_received: 0,
      response_time_ms: responseTime,
      bot_reasoning: action.reasoning,
      bot_full_response: botResponse,
    })

    // 5. Build the combat action (MINIMAL data)
    const combatAction = {
      match_id: roundData.match_id,
      round: roundData.round,
      bot_id: this.botId,
      action: action.action,
      target: action.target,
      skill_id: null,
      timestamp: Date.now(),
      nonce: this.generateNonce(),
    }

    // 6. Sign the action with private key
    const signature = await signEvent(combatAction)

    // 7. Send to server (ONLY action + target, no reasoning)
    this.socket.emit('combat_action', {
      action: combatAction,
      signature,
    })

    console.log('  ✅ Action submitted (signed)')
  }

  /**
   * Save the match result to local logs.
   * Called when match_end event is received.
   */
  saveMatchResult(matchEntry: MatchLogEntry): void {
    const fullLog: FullMatchLog = {
      match: matchEntry,
      rounds: this.roundLogs,
    }
    saveMatchLog(fullLog)
    console.log('  💾 Match log saved locally')
  }

  /**
   * Reset state for a new match.
   */
  reset(): void {
    this.matchId = null
    this.opponentActionHistory = []
    this.roundLogs = []
  }

  /**
   * Build a safe combat prompt from structured game state.
   *
   * PRIVACY: We construct this ourselves from numbers/enums.
   * We NEVER pass raw strings from the server into the prompt.
   */
  private buildPrompt(state: RoundState): string {
    return `ARENA COMBAT — Round ${state.round}

Current Status:
- Your HP: ${state.my_hp}/100
- Opponent HP: ${state.opponent_hp}/100
- Your Stats: ATK ${state.my_attack}, DEF ${state.my_defense}, SPD ${state.my_speed}
${state.opponent_last_action ? `- Opponent's last action: ${state.opponent_last_action}` : '- First round (no previous action)'}

Available Actions:
1. ATTACK — Deal damage to opponent
   Targets: "core" (normal), "armor" (breaks defense), "processor" (chance to stun)
2. DEFEND — Reduce incoming damage by 50%
3. SKILL — (coming soon)

Choose your action. Think strategically about HP values and opponent patterns.

Reply in JSON:
{
  "action": "attack" | "defend",
  "target": "core" | "armor" | "processor",
  "reasoning": "your strategy explanation"
}

The "reasoning" field stays private and is never sent to the server.`
  }

  /**
   * Get bot decision with timeout handling.
   * If the bot takes too long, throws an error so we auto-defend.
   */
  private async getBotDecisionWithTimeout(roundData: RoundState, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Bot decision timeout'))
      }, timeoutMs)

      this.getBotDecision(roundData)
        .then((result) => {
          clearTimeout(timer)
          resolve(result)
        })
        .catch((err) => {
          clearTimeout(timer)
          reject(err)
        })
    })
  }

  /**
   * Get decision from the local strategy engine.
   *
   * TODO: Replace with actual OpenClaw integration:
   *   const session = await sessions_spawn({ task: prompt, cleanup: 'delete' })
   *   const response = await sessions_send({ sessionKey: session.key, message: prompt })
   *
   * Currently uses the built-in strategy for testing.
   */
  private async getBotDecision(roundData: RoundState): Promise<string> {
    // Use built-in strategy
    const decision = decideAction({
      round: roundData.round,
      my_hp: roundData.my_hp,
      opponent_hp: roundData.opponent_hp,
      my_attack: roundData.my_attack,
      my_defense: roundData.my_defense,
      my_speed: roundData.my_speed,
      opponent_last_action: roundData.opponent_last_action,
      opponent_action_history: this.opponentActionHistory,
    })

    return JSON.stringify(decision)
  }

  /**
   * Generate a random nonce to prevent replay attacks.
   */
  private generateNonce(): string {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
}
