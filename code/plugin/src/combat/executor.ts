import { signEvent } from '../keys.js'
import { ArenaSocket } from '../socket.js'
import { parseAction } from './parser.js'

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

    // 1. Generate combat prompt (LOCALLY — safe structured data only)
    const prompt = this.buildPrompt(roundData)

    // 2. Send to local bot and get response
    //    TODO: Integrate with OpenClaw sessions_spawn/sessions_send
    //    For now, use a simple decision function
    const startTime = Date.now()
    const botResponse = await this.getBotDecision(prompt)
    const responseTime = Date.now() - startTime

    // 3. Parse action from response (LOCALLY)
    const action = parseAction(botResponse)

    console.log(`  Action: ${action.action} → ${action.target || 'n/a'} (${responseTime}ms)`)

    // 4. Log full response LOCALLY (never sent to server)
    this.logLocally({
      round: roundData.round,
      prompt,
      full_response: botResponse, // ✅ Stays on your machine
      action,
      response_time: responseTime,
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
   * Get decision from the local OpenClaw bot.
   *
   * TODO: Replace with actual OpenClaw integration:
   *   const session = await sessions_spawn({ task: prompt, cleanup: 'delete' })
   *   const response = await sessions_send({ sessionKey: session.key, message: prompt })
   *
   * For now, uses a basic strategy function for testing.
   */
  private async getBotDecision(prompt: string): Promise<string> {
    // TODO: Replace with OpenClaw sessions integration
    // This is a placeholder strategy for testing
    return JSON.stringify({
      action: 'attack',
      target: 'core',
      reasoning: 'Placeholder strategy — will be replaced with real bot reasoning',
    })
  }

  /**
   * Log combat details locally (never sent to server).
   */
  private logLocally(data: Record<string, unknown>): void {
    // TODO: Write to local SQLite or file log
    // For now, just keep in memory
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
