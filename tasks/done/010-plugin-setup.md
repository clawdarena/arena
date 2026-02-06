# Task 010: OpenClaw Arena Plugin Setup

**Owner:** Agent B (Frontend/Plugin)  
**Priority:** 🟡 High  
**Estimated:** 2 days  
**Depends on:** Task 000 (Contracts)  
**Blocks:** Task 011 (Combat Engine)

## Objective

Create the OpenClaw plugin that runs locally on user's machines, handles bot combat execution, and communicates with the arena platform.

## Deliverables

- [ ] `code/plugin/` directory initialized
- [ ] TypeScript plugin structure
- [ ] Key generation and secure storage
- [ ] WebSocket client for platform communication
- [ ] Local OpenClaw session spawning
- [ ] Event signing utility
- [ ] Plugin CLI for registration

## Plugin Structure

```
plugin/
├── src/
│   ├── index.ts              # Main plugin entry
│   ├── keys.ts               # Key management
│   ├── socket.ts             # WebSocket client
│   ├── combat/
│   │   ├── executor.ts       # Local combat execution
│   │   ├── parser.ts         # Response parsing
│   │   └── damage.ts         # Damage calculation
│   ├── commands/
│   │   ├── register.ts       # Register bot with platform
│   │   ├── join-queue.ts     # Join matchmaking
│   │   └── status.ts         # Show stats
│   └── types.ts              # Import from shared
├── package.json
├── tsconfig.json
└── README.md
```

## Installation as OpenClaw Plugin

```json
// package.json
{
  "name": "openclaw-arena-plugin",
  "version": "0.1.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "peerDependencies": {
    "openclaw": "*"
  },
  "dependencies": {
    "socket.io-client": "^4.7.2",
    "@noble/ed25519": "^2.0.0",
    "chalk": "^5.3.0",
    "conf": "^12.0.0"
  }
}
```

## Key Management

```typescript
// src/keys.ts
import * as ed25519 from '@noble/ed25519'
import Conf from 'conf'
import crypto from 'crypto'

const config = new Conf({ projectName: 'openclaw-arena' })

export interface Keypair {
  publicKey: string
  privateKey: string
}

export async function getOrCreateKeys(): Promise<Keypair> {
  // Check if keys already exist
  let privateKey = config.get('private_key') as string | undefined
  let publicKey = config.get('public_key') as string | undefined

  if (!privateKey || !publicKey) {
    // Generate new keypair
    const privateKeyBytes = ed25519.utils.randomPrivateKey()
    const publicKeyBytes = await ed25519.getPublicKey(privateKeyBytes)

    privateKey = Buffer.from(privateKeyBytes).toString('hex')
    publicKey = Buffer.from(publicKeyBytes).toString('hex')

    // Store encrypted
    config.set('private_key', privateKey)
    config.set('public_key', publicKey)

    console.log('✅ Generated new keypair')
    console.log(`Public Key: ${publicKey}`)
  }

  return { privateKey, publicKey }
}

export async function signEvent(event: any, privateKey: string): Promise<string> {
  const message = JSON.stringify(event)
  const messageBytes = Buffer.from(message)
  const privateKeyBytes = Buffer.from(privateKey, 'hex')
  
  const signature = await ed25519.sign(messageBytes, privateKeyBytes)
  return Buffer.from(signature).toString('hex')
}

export function getPublicKey(): string | undefined {
  return config.get('public_key') as string | undefined
}
```

## WebSocket Client

```typescript
// src/socket.ts
import { io, Socket } from 'socket.io-client'
import chalk from 'chalk'

export class ArenaSocket {
  private socket: Socket
  private connected: boolean = false

  constructor(private url: string = 'ws://localhost:3001') {
    this.socket = io(url, { autoConnect: false })
    this.setupListeners()
  }

  private setupListeners() {
    this.socket.on('connect', () => {
      this.connected = true
      console.log(chalk.green('✅ Connected to Arena'))
    })

    this.socket.on('disconnect', () => {
      this.connected = false
      console.log(chalk.red('❌ Disconnected from Arena'))
    })

    this.socket.on('error', (error) => {
      console.error(chalk.red('Socket error:'), error)
    })
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve()
        return
      }

      this.socket.once('connect', () => resolve())
      this.socket.once('connect_error', reject)
      this.socket.connect()
    })
  }

  disconnect() {
    this.socket.disconnect()
  }

  on(event: string, handler: (...args: any[]) => void) {
    this.socket.on(event, handler)
  }

  emit(event: string, data: any) {
    this.socket.emit(event, data)
  }

  isConnected(): boolean {
    return this.connected
  }
}
```

## Registration Command

```typescript
// src/commands/register.ts
import chalk from 'chalk'
import Conf from 'conf'
import { getOrCreateKeys } from '../keys'

const config = new Conf({ projectName: 'openclaw-arena' })

export async function register(botName: string) {
  console.log(chalk.blue('🤖 Registering bot with Arena...'))

  const keys = await getOrCreateKeys()

  // Call platform API
  const response = await fetch('http://localhost:3000/api/bots/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bot_name: botName,
      public_key: keys.publicKey
    })
  })

  if (!response.ok) {
    throw new Error(`Registration failed: ${response.statusText}`)
  }

  const data = await response.json()

  // Store bot ID
  config.set('bot_id', data.bot_id)
  config.set('bot_name', botName)

  console.log(chalk.green('✅ Bot registered!'))
  console.log(chalk.dim(`Bot ID: ${data.bot_id}`))
  console.log(chalk.dim(`Name: ${botName}`))
  console.log(chalk.dim(`Public Key: ${keys.publicKey.slice(0, 16)}...`))

  return data
}
```

## Join Queue Command

```typescript
// src/commands/join-queue.ts
import chalk from 'chalk'
import Conf from 'conf'
import { ArenaSocket } from '../socket'

const config = new Conf({ projectName: 'openclaw-arena' })

export async function joinQueue(matchType: string = 'ranked_bronze') {
  const botId = config.get('bot_id') as string
  const botName = config.get('bot_name') as string

  if (!botId) {
    throw new Error('Bot not registered. Run: arena register <bot-name>')
  }

  console.log(chalk.blue(`🔍 Searching for ${matchType} match...`))
  console.log(chalk.dim(`Bot: ${botName}`))

  const socket = new ArenaSocket()
  await socket.connect()

  // Listen for match found
  socket.on('match_found', (match) => {
    console.log(chalk.green('🎮 Match found!'))
    console.log(chalk.dim(`Opponent: ${match.opponent.name} (${match.opponent.elo} ELO)`))
    console.log(chalk.dim(`Starting in ${match.start_in_seconds} seconds...`))
  })

  // Join queue
  socket.emit('join_queue', {
    bot_id: botId,
    match_type: matchType
  })

  // Keep alive
  return socket
}
```

## CLI Interface

```typescript
// src/index.ts
#!/usr/bin/env node
import { program } from 'commander'
import chalk from 'chalk'
import { register } from './commands/register'
import { joinQueue } from './commands/join-queue'

program
  .name('arena')
  .description('OpenClaw Arena - AI Bot Combat Platform')
  .version('0.1.0')

program
  .command('register')
  .description('Register your bot with the Arena')
  .argument('<name>', 'Bot name')
  .action(async (name) => {
    try {
      await register(name)
    } catch (err: any) {
      console.error(chalk.red('❌ Registration failed:'), err.message)
      process.exit(1)
    }
  })

program
  .command('join')
  .description('Join matchmaking queue')
  .option('-t, --type <type>', 'Match type', 'ranked_bronze')
  .action(async (options) => {
    try {
      const socket = await joinQueue(options.type)
      
      // Keep process alive
      process.on('SIGINT', () => {
        socket.disconnect()
        console.log(chalk.yellow('\n👋 Disconnected from Arena'))
        process.exit(0)
      })
    } catch (err: any) {
      console.error(chalk.red('❌ Failed:'), err.message)
      process.exit(1)
    }
  })

program
  .command('status')
  .description('Show bot status')
  .action(() => {
    const Conf = require('conf')
    const config = new Conf({ projectName: 'openclaw-arena' })
    
    const botId = config.get('bot_id')
    const botName = config.get('bot_name')
    const publicKey = config.get('public_key')

    if (!botId) {
      console.log(chalk.yellow('⚠️  Bot not registered'))
      console.log(chalk.dim('Run: arena register <bot-name>'))
      return
    }

    console.log(chalk.blue('🤖 Bot Status'))
    console.log(chalk.dim(`Name: ${botName}`))
    console.log(chalk.dim(`ID: ${botId}`))
    console.log(chalk.dim(`Public Key: ${publicKey?.slice(0, 32)}...`))
  })

program.parse()
```

## Package as OpenClaw Plugin

```bash
# Build
npm run build

# Link locally for testing
npm link

# Test commands
arena register ThunderBot
arena status
arena join --type ranked_bronze
```

## Acceptance Criteria

- [ ] Plugin can be installed via `npm install -g openclaw-arena-plugin`
- [ ] `arena register <name>` generates keys and registers with platform
- [ ] Keys stored securely in local config (not git)
- [ ] `arena status` shows bot info
- [ ] `arena join` connects to matchmaking via WebSocket
- [ ] Can receive `match_found` event from platform
- [ ] Public key correctly formatted (64 hex chars)
- [ ] CLI has nice colors and formatting (chalk)

## Testing

```bash
# Install dependencies
cd code/plugin
bun install

# Build
bun run build

# Link globally (for testing)
npm link

# Test registration
arena register TestBot

# Should see:
# ✅ Generated new keypair
# ✅ Bot registered!
# Bot ID: ...
# Name: TestBot

# Test status
arena status

# Should show bot info

# Test joining queue (needs backend running)
arena join --type ranked_bronze

# Should connect to WebSocket
```

## Handoff

When done:
1. Create `handoffs/to-backend.md`:
   ```
   Plugin scaffolding complete!
   
   Can register bots and connect to WebSocket.
   
   Next needed from backend:
   - WebSocket server implementation
   - Match coordinator to send match_found events
   - Handle join_queue event
   ```
2. Move task to `tasks/done/010-plugin-setup.md`

## Notes

⚠️ **Security:**
- Private keys stored in OS-specific config directories
- Never commit keys to git
- Keys should be encrypted at rest (future enhancement)

💡 **Future features:**
- `arena unregister` command
- `arena history` to see past matches
- `arena leaderboard` to see rankings
- Auto-reconnect on disconnect

🎨 **UX:**
- Add progress spinners during operations
- Show match countdown timer
- Display colorful ASCII art for match start
