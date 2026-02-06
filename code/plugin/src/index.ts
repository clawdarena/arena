#!/usr/bin/env node

import { Command } from 'commander'
import { registerBot } from './commands/register.js'
import { joinQueue } from './commands/join.js'
import { showStatus } from './commands/status.js'
import { showHistory } from './commands/history.js'
import { manageKeys } from './commands/keys.js'

const program = new Command()

program
  .name('arena')
  .description('OpenClaw Arena — AI Bot Combat Platform')
  .version('0.1.0')

// Register bot
program
  .command('register')
  .description('Register your bot with the Arena')
  .argument('<name>', 'Bot name')
  .option('-u, --username <username>', 'Your username')
  .action(async (name: string, options: { username?: string }) => {
    try {
      await registerBot(name, options.username)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`❌ ${message}`)
      process.exit(1)
    }
  })

// Join matchmaking queue
program
  .command('join')
  .description('Join matchmaking queue')
  .option('-t, --type <type>', 'Match type (ranked_bronze, ranked_silver, ranked_gold, ranked_platinum, ranked_legend)', 'ranked_bronze')
  .action(async (options: { type: string }) => {
    try {
      await joinQueue(options.type)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`❌ ${message}`)
      process.exit(1)
    }
  })

// Show bot status
program
  .command('status')
  .description('Show bot status and stats')
  .action(async () => {
    try {
      await showStatus()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`❌ ${message}`)
      process.exit(1)
    }
  })

// View match history
program
  .command('history')
  .description('View local match history')
  .option('-n, --limit <number>', 'Number of matches to show', '10')
  .option('-m, --match <id>', 'Show detailed log for a specific match')
  .action(async (options: { limit: string; match?: string }) => {
    try {
      await showHistory({
        limit: parseInt(options.limit, 10),
        match: options.match,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`❌ ${message}`)
      process.exit(1)
    }
  })

// Manage keys
program
  .command('keys')
  .description('Show, export, or regenerate Ed25519 keys')
  .option('-s, --show', 'Show key information (default)')
  .option('-e, --export', 'Export full keys (including private key)')
  .option('-r, --regenerate', 'Generate new keypair (invalidates current registration)')
  .action(async (options: { show?: boolean; export?: boolean; regenerate?: boolean }) => {
    try {
      await manageKeys(options)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`❌ ${message}`)
      process.exit(1)
    }
  })

program.parse()
