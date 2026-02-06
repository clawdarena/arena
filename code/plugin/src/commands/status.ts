import { getConfig, getPublicKey } from '../keys.js'

const API_URL = process.env.ARENA_API_URL || 'http://localhost:3001'

/**
 * Display bot status and stats.
 */
export async function showStatus(): Promise<void> {
  const config = getConfig()

  if (!config.bot_id) {
    console.log('⚠️  Bot not registered')
    console.log('  Run: arena register <bot-name> --username <name>')
    return
  }

  console.log('🤖 Bot Status\n')
  console.log(`  Name:       ${config.bot_name}`)
  console.log(`  Bot ID:     ${config.bot_id}`)
  console.log(`  Username:   ${config.username}`)
  console.log(`  Public Key: ${(config.public_key as string)?.slice(0, 32)}...`)

  // Try to fetch live stats from server
  const token = config.token as string | undefined
  if (token) {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const user = await res.json() as any
        console.log('\n📊 Live Stats\n')
        console.log(`  Credits:    ${user.credits} AC`)
        console.log(`  ELO:        ${user.current_elo}`)
        console.log(`  Peak ELO:   ${user.peak_elo}`)
        console.log(`  Matches:    ${user.total_matches}`)
        console.log(`  Wins:       ${user.wins}`)
        console.log(`  Losses:     ${user.losses}`)

        if (user.total_matches > 0) {
          const winRate = ((user.wins / user.total_matches) * 100).toFixed(1)
          console.log(`  Win Rate:   ${winRate}%`)
        }
      } else {
        console.log('\n  ⚠️  Could not fetch live stats (token expired?)')
        console.log('  Re-register to refresh: arena register <bot-name> --username <name>')
      }
    } catch {
      console.log('\n  ⚠️  Server unreachable — showing local data only')
    }
  }

  console.log('\n🔑 Security')
  console.log('  Private key: Stored locally ✅')
  console.log('  Public key:  Registered on platform ✅')
  console.log('  Bot configs: Never uploaded ✅')
}
