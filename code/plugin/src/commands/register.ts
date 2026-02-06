import { getOrCreateKeys, setConfig } from '../keys.js'

const API_URL = process.env.ARENA_API_URL || 'http://localhost:3001'

/**
 * Register a new bot with the Arena platform.
 *
 * 1. Generates Ed25519 keypair (stored locally)
 * 2. Sends ONLY the public key to the platform
 * 3. Private key never leaves the machine
 */
export async function registerBot(botName: string, username?: string): Promise<void> {
  console.log('🤖 Registering bot with Arena...\n')

  // Generate or load keys
  const keys = await getOrCreateKeys()
  console.log(`  Public Key: ${keys.publicKey.slice(0, 16)}...`)

  // Register user + bot with platform
  try {
    // Step 1: Register user (or login if exists)
    let token: string
    let userId: string

    if (username) {
      const authRes = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          public_key: keys.publicKey,
        }),
      })

      if (authRes.status === 409) {
        // Username taken, try login instead
        const loginRes = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        })

        if (!loginRes.ok) {
          throw new Error(`Login failed: ${loginRes.statusText}`)
        }

        const loginData = await loginRes.json() as any
        token = loginData.token
        userId = loginData.user.id
        console.log(`  Logged in as: ${username}`)
      } else if (!authRes.ok) {
        throw new Error(`Registration failed: ${authRes.statusText}`)
      } else {
        const authData = await authRes.json() as any
        token = authData.token
        userId = authData.user.id
        console.log(`  Registered as: ${username}`)
        console.log(`  Welcome bonus: 200 AC 🎁`)
      }
    } else {
      throw new Error('Username required. Use: arena register <bot-name> --username <name>')
    }

    // Step 2: Register bot
    const botRes = await fetch(`${API_URL}/api/bots/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        bot_name: botName,
        public_key: keys.publicKey,
      }),
    })

    if (!botRes.ok) {
      // Bot might already exist, that's OK
      if (botRes.status !== 409) {
        throw new Error(`Bot registration failed: ${botRes.statusText}`)
      }
      console.log(`  Bot "${botName}" already registered`)
    } else {
      const botData = await botRes.json() as any
      setConfig('bot_id', botData.bot_id)
      console.log(`  Bot registered: ${botName}`)
    }

    // Store config locally
    setConfig('bot_name', botName)
    setConfig('username', username)
    setConfig('user_id', userId!)
    setConfig('token', token!)

    console.log('\n✅ Registration complete!')
    console.log(`  Bot: ${botName}`)
    console.log(`  User: ${username}`)
    console.log(`  Keys: Stored locally (private key never uploaded)`)
    console.log('\n  Next: Run "arena join" to find a match!')

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    if (message.includes('ECONNREFUSED')) {
      console.error('\n❌ Cannot connect to Arena server')
      console.error(`  Make sure the server is running at ${API_URL}`)
      console.error('  Or set ARENA_API_URL environment variable')
    } else {
      console.error(`\n❌ Registration failed: ${message}`)
    }

    process.exit(1)
  }
}
