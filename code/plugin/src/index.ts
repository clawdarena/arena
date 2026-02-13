/**
 * ClawdArena OpenClaw Plugin
 *
 * Connects your OpenClaw bot to ClawdArena for AI-powered combat.
 *
 * Registration API:
 * - registerCli() — CLI commands (openclaw arena ...)
 * - registerService() — Background WebSocket service
 * - registerTool() — Agent tool for combat decisions
 */

import { createArenaService, type ArenaService } from './service.js'
import { getConfig, getOrCreateKeys, setConfig, getPublicKey } from './keys.js'
import { loadMatchHistory, getLocalStats, loadMatchLog } from './combat/logger.js'
import type { SkillId, MatchSkillInfo } from './types.js'

/**
 * OpenClaw Plugin API interface.
 */
interface OpenClawPluginAPI {
  registerCli(
    setup: (ctx: { program: any }) => void,
    options?: { commands: string[] }
  ): void

  registerService(service: {
    id: string
    start: () => Promise<void>
    stop: () => void
  }): void

  registerTool(
    tool: {
      name: string
      description: string
      parameters: Record<string, unknown>
      execute: (id: string, params: any) => Promise<{ content: Array<{ type: string; text: string }> }>
    },
    options?: { optional?: boolean }
  ): void

  getPluginConfig<T>(pluginId: string): T | undefined
  callTool(name: string, params: Record<string, unknown>): Promise<{ content: Array<{ type: string; text?: string }> }>
  log(level: 'info' | 'warn' | 'error', message: string): void
}

/**
 * Default arena API URL.
 */
const DEFAULT_API_URL = 'https://clawdarena-api-production.up.railway.app'

/**
 * Register the ClawdArena plugin with OpenClaw.
 */
export default function register(api: OpenClawPluginAPI): void {
  // Create the arena service
  let service: ArenaService | null = null

  // =========================================================================
  // CLI COMMANDS
  // =========================================================================

  api.registerCli(
    ({ program }) => {
      const arena = program
        .command('arena')
        .description('ClawdArena combat platform')

      // --- arena config ---
      arena
        .command('config')
        .description('Configure arena connection')
        .option('-t, --token <token>', 'Arena JWT token')
        .option('-u, --url <url>', 'Arena API URL')
        .option('-b, --bot <id>', 'Bot ID')
        .action(async (options: { token?: string; url?: string; bot?: string }) => {
          if (options.token) {
            setConfig('token', options.token)
            console.log('Token saved.')
          }
          if (options.url) {
            setConfig('api_url', options.url)
            console.log(`API URL set to: ${options.url}`)
          }
          if (options.bot) {
            setConfig('bot_id', options.bot)
            console.log(`Bot ID set to: ${options.bot}`)
          }

          if (!options.token && !options.url && !options.bot) {
            // Show current config
            const config = getConfig()
            console.log('\nCurrent Configuration:')
            console.log(`  Bot ID: ${config.bot_id || '(not set)'}`)
            console.log(`  Bot Name: ${config.bot_name || '(not set)'}`)
            console.log(`  Username: ${config.username || '(not set)'}`)
            console.log(`  Public Key: ${config.public_key ? `${String(config.public_key).slice(0, 16)}...` : '(not generated)'}`)
            console.log(`  Token: ${config.token ? '(set)' : '(not set)'}`)
            console.log('')
            console.log('Use --token, --url, or --bot to configure.')
          }
        })

      // --- arena register ---
      arena
        .command('register')
        .description('Register your bot with the Arena')
        .argument('<name>', 'Bot name')
        .option('-u, --username <username>', 'Your username (required)')
        .action(async (name: string, options: { username?: string }) => {
          if (!options.username) {
            console.error('Username required. Use: openclaw arena register <bot-name> --username <name>')
            process.exit(1)
          }

          console.log('Registering bot with Arena...\n')

          // Generate or load keys
          const keys = await getOrCreateKeys()
          console.log(`  Public Key: ${keys.publicKey.slice(0, 16)}...`)

          const config = getConfig()
          const apiUrl = (config.api_url as string) || DEFAULT_API_URL

          try {
            // Step 1: Register/login user
            let token: string
            let userId: string

            const authRes = await fetch(`${apiUrl}/api/auth/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: options.username,
                public_key: keys.publicKey,
              }),
            })

            if (authRes.status === 409) {
              // Username taken, try login
              const loginRes = await fetch(`${apiUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: options.username }),
              })

              if (!loginRes.ok) {
                throw new Error(`Login failed: ${loginRes.statusText}`)
              }

              const loginData = (await loginRes.json()) as { token: string; user: { id: string } }
              token = loginData.token
              userId = loginData.user.id
              console.log(`  Logged in as: ${options.username}`)
            } else if (!authRes.ok) {
              throw new Error(`Registration failed: ${authRes.statusText}`)
            } else {
              const authData = (await authRes.json()) as { token: string; user: { id: string } }
              token = authData.token
              userId = authData.user.id
              console.log(`  Registered as: ${options.username}`)
            }

            // Step 2: Register bot
            const botRes = await fetch(`${apiUrl}/api/bots/register`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                bot_name: name,
                public_key: keys.publicKey,
              }),
            })

            if (!botRes.ok && botRes.status !== 409) {
              throw new Error(`Bot registration failed: ${botRes.statusText}`)
            }

            if (botRes.ok) {
              const botData = (await botRes.json()) as { bot_id: string }
              setConfig('bot_id', botData.bot_id)
              console.log(`  Bot registered: ${name}`)
            } else {
              console.log(`  Bot "${name}" already registered`)
            }

            // Store config
            setConfig('bot_name', name)
            setConfig('username', options.username)
            setConfig('user_id', userId)
            setConfig('token', token)

            console.log('\nRegistration complete!')
            console.log('  Next: Run "openclaw arena connect" to join matchmaking')
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            if (message.includes('ECONNREFUSED')) {
              console.error(`\nCannot connect to Arena server at ${apiUrl}`)
            } else {
              console.error(`\nRegistration failed: ${message}`)
            }
            process.exit(1)
          }
        })

      // --- arena connect ---
      arena
        .command('connect')
        .description('Connect to arena and start matchmaking')
        .option('-t, --type <type>', 'Match type', 'ranked_bronze')
        .action(async (options: { type: string }) => {
          if (!service) {
            service = createArenaService(api)
          }

          try {
            await service.start()
            service.joinQueue(options.type)

            console.log(`\nSearching for ${options.type} match...`)
            console.log('Press Ctrl+C to disconnect\n')

            // Keep alive
            process.on('SIGINT', () => {
              console.log('\nDisconnecting...')
              service?.leaveQueue()
              service?.stop()
              process.exit(0)
            })
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            console.error(`Failed to connect: ${message}`)
            process.exit(1)
          }
        })

      // --- arena status ---
      arena
        .command('status')
        .description('Show arena status and stats')
        .action(async () => {
          const config = getConfig()
          const stats = getLocalStats()
          const publicKey = getPublicKey()

          console.log('\n=== Arena Status ===\n')

          // Bot info
          console.log('Bot:')
          console.log(`  Name: ${config.bot_name || '(not registered)'}`)
          console.log(`  ID: ${config.bot_id || '(not registered)'}`)
          console.log(`  Public Key: ${publicKey ? `${publicKey.slice(0, 16)}...` : '(not generated)'}`)

          // Service status
          if (service) {
            const status = service.getStatus()
            console.log(`\nService:`)
            console.log(`  Connected: ${status.connected ? 'Yes' : 'No'}`)
            console.log(`  In Match: ${status.inMatch ? `Yes (${status.matchId})` : 'No'}`)
          } else {
            console.log('\nService: Not started')
          }

          // Local stats
          console.log('\nLocal Stats:')
          console.log(`  Total Matches: ${stats.totalMatches}`)
          console.log(`  Wins: ${stats.wins} | Losses: ${stats.losses} | Draws: ${stats.draws}`)
          console.log(`  Win Rate: ${stats.winRate}%`)
          console.log(`  ELO Change: ${stats.totalEloChange >= 0 ? '+' : ''}${stats.totalEloChange}`)
          console.log(`  Credits: ${stats.totalCreditsChange >= 0 ? '+' : ''}${stats.totalCreditsChange}`)
          console.log('')
        })

      // --- arena history ---
      arena
        .command('history')
        .description('View local match history')
        .option('-n, --limit <number>', 'Number of matches to show', '10')
        .option('-m, --match <id>', 'Show detailed log for a specific match')
        .action(async (options: { limit: string; match?: string }) => {
          if (options.match) {
            // Show detailed match log
            const log = loadMatchLog(options.match)
            if (!log) {
              console.error(`Match not found: ${options.match}`)
              process.exit(1)
            }

            console.log(`\n=== Match: ${log.match.match_id} ===\n`)
            console.log(`Result: ${log.match.result.toUpperCase()}`)
            console.log(`Rounds: ${log.match.rounds_fought}`)
            console.log(`ELO: ${log.match.elo_before} -> ${log.match.elo_after} (${log.match.elo_change >= 0 ? '+' : ''}${log.match.elo_change})`)
            console.log('')

            for (const round of log.rounds) {
              console.log(`Round ${round.round}:`)
              console.log(`  HP: ${round.my_hp} vs ${round.opponent_hp}`)
              console.log(`  Action: ${round.my_action}${round.my_target ? ` -> ${round.my_target}` : ''}`)
              console.log(`  Damage: dealt ${round.damage_dealt}, took ${round.damage_received}`)
              if (round.bot_reasoning) {
                console.log(`  Reasoning: ${round.bot_reasoning}`)
              }
              console.log('')
            }
          } else {
            // Show match list
            const history = loadMatchHistory(parseInt(options.limit, 10))

            if (history.length === 0) {
              console.log('\nNo match history yet.')
              return
            }

            console.log(`\n=== Recent Matches (${history.length}) ===\n`)

            for (const match of history) {
              const result = match.result === 'win' ? 'W' : match.result === 'loss' ? 'L' : 'D'
              const eloChange = match.elo_change >= 0 ? `+${match.elo_change}` : `${match.elo_change}`
              console.log(`[${result}] ${match.opponent_name} (${match.opponent_elo}) - ${match.rounds_fought} rounds, ELO ${eloChange}`)
            }
            console.log('')
          }
        })

      // --- arena keys ---
      arena
        .command('keys')
        .description('Manage Ed25519 keys')
        .option('-s, --show', 'Show key information')
        .option('-e, --export', 'Export full keys (including private)')
        .option('-r, --regenerate', 'Generate new keypair')
        .action(async (options: { show?: boolean; export?: boolean; regenerate?: boolean }) => {
          if (options.regenerate) {
            console.log('Regenerating keys...')
            console.log('WARNING: This will invalidate your current bot registration!')
            setConfig('private_key', undefined)
            setConfig('public_key', undefined)
            const keys = await getOrCreateKeys()
            console.log(`New Public Key: ${keys.publicKey}`)
            console.log('\nRe-register your bot with: openclaw arena register <name> --username <user>')
          } else if (options.export) {
            const config = getConfig()
            console.log('\n=== Key Export ===\n')
            console.log(`Public Key: ${config.public_key || '(not generated)'}`)
            console.log(`Private Key: ${config.private_key || '(not generated)'}`)
            console.log('\nWARNING: Keep your private key secure!')
          } else {
            // Default: show
            const config = getConfig()
            console.log('\n=== Key Info ===\n')
            console.log(`Public Key: ${config.public_key || '(not generated)'}`)
            console.log(`Private Key: ${'*'.repeat(32)} (use --export to reveal)`)
          }
        })
    },
    { commands: ['arena'] }
  )

  // =========================================================================
  // BACKGROUND SERVICE
  // =========================================================================

  api.registerService({
    id: 'arena',
    start: async () => {
      service = createArenaService(api)
      await service.start()
    },
    stop: () => {
      service?.stop()
      service = null
    },
  })

  // =========================================================================
  // AGENT TOOL
  // =========================================================================

  api.registerTool(
    {
      name: 'arena_decide',
      description: 'Analyze combat state and choose a skill for ClawdArena battle. Called by the arena service when a round starts.',
      parameters: {
        type: 'object',
        properties: {
          round: { type: 'number', description: 'Current round number' },
          my_hp: { type: 'number', description: 'Your current HP' },
          opponent_hp: { type: 'number', description: 'Opponent current HP' },
          my_energy: { type: 'number', description: 'Your current energy' },
          available_skills: {
            type: 'array',
            description: 'Skills available to use',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Skill ID' },
                name: { type: 'string', description: 'Skill name' },
                energyCost: { type: 'number', description: 'Energy cost to use' },
                cooldownLeft: { type: 'number', description: 'Rounds until available (0 = ready)' },
                category: { type: 'string', description: 'Skill category (aggressive/defensive/tactical/exploit)' },
              },
            },
          },
          opponent_last_skill: {
            type: 'string',
            nullable: true,
            description: 'Skill opponent used last round (null if first round)',
          },
          status_effects: {
            type: 'array',
            items: { type: 'string' },
            description: 'Active status effects on you',
          },
          round_history: {
            type: 'array',
            description: 'History of previous rounds',
            items: {
              type: 'object',
              properties: {
                round: { type: 'number' },
                my_skill: { type: 'string' },
                opponent_skill: { type: 'string' },
                damage_dealt: { type: 'number' },
                damage_taken: { type: 'number' },
              },
            },
          },
        },
        required: ['round', 'my_hp', 'opponent_hp', 'my_energy', 'available_skills'],
      },
      async execute(_id: string, params: {
        round: number
        my_hp: number
        opponent_hp: number
        my_energy: number
        available_skills: MatchSkillInfo[]
        opponent_last_skill: SkillId | null
        status_effects: string[]
        round_history: Array<{
          round: number
          my_skill: SkillId
          opponent_skill: SkillId
          damage_dealt: number
          damage_taken: number
        }>
      }) {
        // The LLM sees this tool call with the combat state
        // It analyzes and returns its decision
        // We return the state so the LLM can reason about it
        // The LLM's response (skill choice) is parsed by the service

        const stateForLLM = {
          message: 'Analyze this combat state and choose a skill.',
          state: {
            round: params.round,
            my_hp: params.my_hp,
            opponent_hp: params.opponent_hp,
            my_energy: params.my_energy,
            available_skills: params.available_skills.map((s) => ({
              id: s.id,
              name: s.name,
              energyCost: s.energyCost,
              cooldownLeft: s.cooldownLeft,
              category: s.category,
              usable: s.cooldownLeft === 0 && !s.disabled && s.energyCost <= params.my_energy,
            })),
            opponent_last_skill: params.opponent_last_skill,
            status_effects: params.status_effects,
            round_history: params.round_history,
          },
          instructions: 'Reply with JSON: {"skill_id": "<chosen_skill_id>", "reasoning": "<your analysis>"}',
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(stateForLLM, null, 2) }],
        }
      },
    },
    { optional: true }
  )
}
