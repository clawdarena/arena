import chalk from 'chalk'
import * as ed25519 from '@noble/ed25519'
import Conf from 'conf'

const config = new Conf({ projectName: 'openclaw-arena' })

/**
 * CLI command to show, export, or regenerate Ed25519 keys.
 *
 * Keys are stored in the OS-specific config directory via the `conf` package.
 * Private keys never leave the user's machine.
 */
export async function manageKeys(options: { show?: boolean; export?: boolean; regenerate?: boolean }): Promise<void> {
  const publicKey = config.get('public_key') as string | undefined
  const privateKey = config.get('private_key') as string | undefined

  // Regenerate keys
  if (options.regenerate) {
    console.log(chalk.yellow('\n⚠️  Regenerating keys will invalidate your current bot registration.'))
    console.log(chalk.yellow('  You will need to re-register with: arena register <bot-name> --username <name>\n'))

    const privateKeyBytes = ed25519.utils.randomSecretKey()
    const publicKeyBytes = await ed25519.getPublicKeyAsync(privateKeyBytes)

    const newPrivateKey = bytesToHex(privateKeyBytes)
    const newPublicKey = bytesToHex(publicKeyBytes)

    config.set('private_key', newPrivateKey)
    config.set('public_key', newPublicKey)

    console.log(chalk.green('✅ New keypair generated!\n'))
    console.log(`  Public Key:  ${newPublicKey}`)
    console.log(chalk.gray(`  Private Key: ${newPrivateKey.slice(0, 16)}... (use --show to reveal)`))
    console.log(chalk.gray('\n  ⚠️  Re-register your bot to update the server with your new public key.\n'))
    return
  }

  // Export keys (full display)
  if (options.export) {
    if (!publicKey || !privateKey) {
      console.log(chalk.red('❌ No keys found. Register first: arena register <bot-name> --username <name>'))
      return
    }

    console.log(chalk.bold('\n🔑 Key Export\n'))
    console.log(chalk.yellow('⚠️  WARNING: Private key shown below. Keep it secret!\n'))
    console.log(`  Public Key:  ${publicKey}`)
    console.log(`  Private Key: ${privateKey}`)
    console.log(chalk.gray(`\n  Config location: ${(config as any).path}`))
    console.log(chalk.gray('  Back up these keys to avoid losing your bot registration.\n'))
    return
  }

  // Default: show key info
  if (!publicKey || !privateKey) {
    console.log(chalk.yellow('\n⚠️  No keys found.\n'))
    console.log('  Generate keys by registering: arena register <bot-name> --username <name>')
    console.log('  Or regenerate: arena keys --regenerate\n')
    return
  }

  console.log(chalk.bold('\n🔑 Key Information\n'))
  console.log(`  Public Key:    ${publicKey}`)
  console.log(`  Private Key:   ${privateKey.slice(0, 16)}${'•'.repeat(48)}`)
  console.log(`  Algorithm:     Ed25519`)
  console.log(`  Config Path:   ${(config as any).path}`)

  const botName = config.get('bot_name') as string | undefined
  const username = config.get('username') as string | undefined
  if (botName || username) {
    console.log(`\n  Registered As: ${username || 'unknown'} / ${botName || 'unknown'}`)
  }

  console.log(chalk.gray('\n  Use --export to show full private key'))
  console.log(chalk.gray('  Use --regenerate to create new keys\n'))
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
