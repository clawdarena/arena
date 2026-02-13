/**
 * Arena Background Service
 *
 * Persistent WebSocket connection to ClawdArena backend.
 * Handles match events and invokes the user's agent for combat decisions.
 *
 * PRIVACY BOUNDARY:
 * - Agent reasoning stays LOCAL
 * - Only skill_id choice sent to server
 */

import { io, type Socket } from 'socket.io-client'
import {
  type ArenaPluginConfig,
  type MatchSkillInfo,
  type RawRoundStart,
  type RoundHistoryEntry,
  type SkillId,
  type SignedCombatAction,
  type MatchStartEvent,
  type RoundCompleteEvent,
  type MatchEndEvent,
} from './types.js'
import {
  sanitizeRoundStart,
  sanitizeSkillInfo,
  validateSkillChoice,
  sanitizeRoundHistoryEntry,
  isValidSkillId,
} from './sanitizer.js'
import { signEvent, getConfig } from './keys.js'
import { decideAction } from './combat/strategy.js'

/** Default arena API URL */
const DEFAULT_API_URL = 'https://clawdarena-api-production.up.railway.app'

/** Timeout for agent decisions (ms) */
const DECISION_TIMEOUT_MS = 8000

/**
 * OpenClaw Plugin API interface (minimal typing for what we use).
 */
interface OpenClawAPI {
  getPluginConfig<T>(pluginId: string): T | undefined
  callTool(name: string, params: Record<string, unknown>): Promise<{
    content: Array<{ type: string; text?: string }>
  }>
  log(level: 'info' | 'warn' | 'error', message: string): void
}

/**
 * Creates the arena background service.
 */
export function createArenaService(api: OpenClawAPI) {
  let socket: Socket | null = null
  let connected = false
  let currentMatch: {
    matchId: string
    myBotId: string
    isBot1: boolean
    equippedSkills: MatchSkillInfo[]
    roundHistory: RoundHistoryEntry[]
  } | null = null

  /**
   * Get the arena tool registered for this plugin.
   * Falls back to built-in strategy if tool invocation fails.
   */
  async function getAgentDecision(
    state: ReturnType<typeof sanitizeRoundStart>
  ): Promise<SkillId> {
    try {
      // Call the arena_decide tool - the LLM analyzes the state
      const result = await Promise.race([
        api.callTool('arena_decide', {
          round: state.round,
          my_hp: state.my_hp,
          opponent_hp: state.opponent_hp,
          my_energy: state.my_energy,
          available_skills: state.available_skills,
          opponent_last_skill: state.opponent_last_skill,
          status_effects: state.status_effects,
          round_history: state.round_history,
        }),
        timeoutPromise(DECISION_TIMEOUT_MS),
      ])

      // Parse the response
      if (result && result.content?.[0]?.text) {
        const parsed = parseAgentResponse(result.content[0].text)
        if (parsed) {
          const validation = validateSkillChoice(
            parsed,
            state.available_skills,
            state.my_energy
          )
          if (validation.valid) {
            return validation.skillId
          }
          api.log('warn', `Invalid skill choice: ${validation.reason}`)
          return validation.fallback
        }
      }
    } catch (err) {
      api.log('warn', `Agent decision failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }

    // Fallback to built-in strategy
    return getFallbackDecision(state)
  }

  /**
   * Parse the agent's response to extract skill_id.
   */
  function parseAgentResponse(text: string): SkillId | null {
    try {
      // Try JSON extraction first
      const jsonMatch = text.match(/\{[\s\S]*?"skill_id"[\s\S]*?\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (isValidSkillId(parsed.skill_id)) {
          return parsed.skill_id
        }
      }

      // Try to find any valid skill ID in the text
      const words = text.toLowerCase().split(/\s+/)
      for (const word of words) {
        if (isValidSkillId(word)) {
          return word
        }
      }
    } catch {
      // Parse failed
    }

    return null
  }

  /**
   * Built-in fallback strategy when agent is unavailable.
   */
  function getFallbackDecision(
    state: ReturnType<typeof sanitizeRoundStart>
  ): SkillId {
    const decision = decideAction({
      round: state.round,
      my_hp: state.my_hp,
      opponent_hp: state.opponent_hp,
      my_energy: state.my_energy,
      available_skills: state.available_skills,
      opponent_last_skill: state.opponent_last_skill,
      status_effects: state.status_effects,
    })

    return decision.skill_id
  }

  /**
   * Generate a random nonce for replay attack prevention.
   */
  function generateNonce(): string {
    // Generate random bytes using Node.js crypto or Web Crypto
    const randomBytes = new Uint8Array(16)
    // Use globalThis.crypto (available in Node.js 19+ and browsers)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const crypto = (globalThis as any).crypto as { getRandomValues?: (arr: Uint8Array) => void } | undefined
    if (crypto?.getRandomValues) {
      crypto.getRandomValues(randomBytes)
    } else {
      // Fallback: simple random (not cryptographically secure but works)
      for (let i = 0; i < 16; i++) {
        randomBytes[i] = Math.floor(Math.random() * 256)
      }
    }
    return Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  /**
   * Promise that rejects after timeout.
   */
  function timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), ms)
    })
  }

  /**
   * Start the arena service.
   */
  async function start(): Promise<void> {
    const config = api.getPluginConfig<ArenaPluginConfig>('clawdarena')
    const localConfig = getConfig()

    const apiUrl = config?.apiUrl || DEFAULT_API_URL
    const token = config?.token || (localConfig.token as string | undefined)
    const botId = config?.botId || (localConfig.bot_id as string | undefined)

    if (!token) {
      api.log('error', 'Arena: No token configured. Run `openclaw arena config` first.')
      return
    }

    if (!botId) {
      api.log('error', 'Arena: No bot ID configured. Register a bot first.')
      return
    }

    api.log('info', `Arena: Connecting to ${apiUrl}...`)

    socket = io(apiUrl, {
      autoConnect: false,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    // Connection events
    socket.on('connect', () => {
      connected = true
      api.log('info', 'Arena: Connected to server')
    })

    socket.on('disconnect', (reason: string) => {
      connected = false
      api.log('warn', `Arena: Disconnected - ${reason}`)
    })

    socket.on('connect_error', (err: Error) => {
      api.log('error', `Arena: Connection error - ${err.message}`)
    })

    socket.on('error', (error: { code: string; message: string }) => {
      api.log('error', `Arena: Server error [${error.code}]: ${error.message}`)
    })

    // Match events
    socket.on('match_found', (match: { match_id: string; opponent: { name: string; elo: number }; start_in_seconds: number }) => {
      api.log('info', `Arena: Match found! Starting in ${match.start_in_seconds}s`)

      // Signal ready
      socket?.emit('ready', {
        match_id: match.match_id,
        bot_id: botId,
      })
    })

    socket.on('match_start', (data: MatchStartEvent) => {
      api.log('info', `Arena: Match started - ${data.max_rounds} rounds, ${data.time_limit_seconds}s per round`)

      // Determine which bot we are
      const isBot1 = data.bot1.id === botId

      // Sanitize skill info
      const equippedSkills = data.skills
        .map(sanitizeSkillInfo)
        .filter((s): s is MatchSkillInfo => s !== null)

      currentMatch = {
        matchId: data.match_id,
        myBotId: botId,
        isBot1,
        equippedSkills,
        roundHistory: [],
      }
    })

    socket.on('round_start', async (rawData: RawRoundStart) => {
      if (!currentMatch) {
        api.log('error', 'Arena: Received round_start but no match in progress')
        return
      }

      api.log('info', `Arena: Round ${rawData.round}`)

      // Swap HP values if we're bot2
      const sanitizedData: RawRoundStart = currentMatch.isBot1
        ? rawData
        : {
            ...rawData,
            bot1_hp: rawData.bot2_hp,
            bot2_hp: rawData.bot1_hp,
            previous_round: rawData.previous_round
              ? {
                  ...rawData.previous_round,
                  bot1_skill_id: rawData.previous_round.bot2_skill_id,
                  bot2_skill_id: rawData.previous_round.bot1_skill_id,
                  bot1_damage_dealt: rawData.previous_round.bot2_damage_dealt,
                  bot2_damage_dealt: rawData.previous_round.bot1_damage_dealt,
                }
              : undefined,
          }

      // Sanitize the round data (TRUST BOUNDARY)
      const state = sanitizeRoundStart(
        sanitizedData,
        currentMatch.myBotId,
        currentMatch.equippedSkills,
        currentMatch.roundHistory
      )

      // Get agent decision
      const skillId = await getAgentDecision(state)

      api.log('info', `Arena: Decided - ${skillId}`)

      // Build and sign the action
      const action: SignedCombatAction = {
        match_id: currentMatch.matchId,
        round: state.round,
        bot_id: currentMatch.myBotId,
        action: 'skill',
        skill_id: skillId,
        timestamp: Date.now(),
        nonce: generateNonce(),
      }

      const signature = await signEvent(action as unknown as Record<string, unknown>)

      // Send to server (ONLY skill_id, no reasoning)
      socket?.emit('submit_action', {
        action,
        signature,
      })
    })

    socket.on('round_complete', (result: RoundCompleteEvent) => {
      if (!currentMatch) return

      // Add to history (swap values if we're bot2)
      const entry = currentMatch.isBot1
        ? sanitizeRoundHistoryEntry(
            result.round,
            result.bot1_skill_id,
            result.bot2_skill_id,
            result.bot1_damage_dealt,
            result.bot2_damage_dealt
          )
        : sanitizeRoundHistoryEntry(
            result.round,
            result.bot2_skill_id,
            result.bot1_skill_id,
            result.bot2_damage_dealt,
            result.bot1_damage_dealt
          )

      if (entry) {
        currentMatch.roundHistory.push(entry)
      }

      // Log result
      const myHp = currentMatch.isBot1 ? result.bot1_hp_after : result.bot2_hp_after
      const oppHp = currentMatch.isBot1 ? result.bot2_hp_after : result.bot1_hp_after
      api.log('info', `Arena: Round ${result.round} complete - HP: ${myHp} vs ${oppHp}`)
    })

    socket.on('match_end', (result: MatchEndEvent) => {
      const botId = currentMatch?.myBotId
      const isWinner = result.winner.bot_id === botId

      if (isWinner) {
        api.log('info', `Arena: VICTORY! +${result.winner.credits_won} credits, ELO ${result.winner.elo_change > 0 ? '+' : ''}${result.winner.elo_change}`)
      } else {
        api.log('info', `Arena: Defeat. -${result.loser.credits_lost} credits, ELO ${result.loser.elo_change}`)
      }

      currentMatch = null
    })

    socket.on('player_disconnected', (data: { grace_period_seconds: number }) => {
      api.log('warn', `Arena: Opponent disconnected - ${data.grace_period_seconds}s grace period`)
    })

    socket.on('player_reconnected', () => {
      api.log('info', 'Arena: Opponent reconnected')
    })

    // Connect
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'))
      }, 10000)

      socket!.once('connect', () => {
        clearTimeout(timeout)
        resolve()
      })

      socket!.once('connect_error', (err: Error) => {
        clearTimeout(timeout)
        reject(err)
      })

      socket!.connect()
    })
  }

  /**
   * Stop the arena service.
   */
  function stop(): void {
    if (socket) {
      socket.disconnect()
      socket = null
      connected = false
      currentMatch = null
      api.log('info', 'Arena: Disconnected')
    }
  }

  /**
   * Join the matchmaking queue.
   */
  function joinQueue(matchType: string = 'ranked_bronze'): void {
    if (!socket || !connected) {
      api.log('error', 'Arena: Not connected')
      return
    }

    const localConfig = getConfig()
    const botId = localConfig.bot_id as string | undefined

    if (!botId) {
      api.log('error', 'Arena: No bot ID configured')
      return
    }

    api.log('info', `Arena: Joining ${matchType} queue...`)

    socket.emit('join_queue', {
      bot_id: botId,
      match_type: matchType,
    })
  }

  /**
   * Leave the matchmaking queue.
   */
  function leaveQueue(): void {
    if (!socket || !connected) return

    const localConfig = getConfig()
    const botId = localConfig.bot_id as string | undefined

    if (botId) {
      socket.emit('leave_queue', { bot_id: botId })
      api.log('info', 'Arena: Left queue')
    }
  }

  /**
   * Get current connection status.
   */
  function getStatus(): { connected: boolean; inMatch: boolean; matchId: string | null } {
    return {
      connected,
      inMatch: currentMatch !== null,
      matchId: currentMatch?.matchId ?? null,
    }
  }

  return {
    start,
    stop,
    joinQueue,
    leaveQueue,
    getStatus,
  }
}

export type ArenaService = ReturnType<typeof createArenaService>
