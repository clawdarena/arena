import * as ed25519 from '@noble/ed25519'
import Conf from 'conf'

const config = new Conf({ projectName: 'openclaw-arena' })

export interface Keypair {
  publicKey: string
  privateKey: string
}

/**
 * Get existing keys or generate a new Ed25519 keypair.
 * Keys are stored in OS-specific config directory (never in git).
 */
export async function getOrCreateKeys(): Promise<Keypair> {
  let privateKey = config.get('private_key') as string | undefined
  let publicKey = config.get('public_key') as string | undefined

  if (!privateKey || !publicKey) {
    const privateKeyBytes = ed25519.utils.randomSecretKey()
    const publicKeyBytes = await ed25519.getPublicKeyAsync(privateKeyBytes)

    privateKey = bytesToHex(privateKeyBytes)
    publicKey = bytesToHex(publicKeyBytes)

    config.set('private_key', privateKey)
    config.set('public_key', publicKey)

    console.log('✅ Generated new Ed25519 keypair')
  }

  return { privateKey, publicKey }
}

/**
 * Get stored public key (without generating).
 */
export function getPublicKey(): string | undefined {
  return config.get('public_key') as string | undefined
}

/**
 * Get stored private key.
 */
export function getPrivateKey(): string | undefined {
  return config.get('private_key') as string | undefined
}

/**
 * Sign a combat action event with the private key.
 * Returns hex-encoded Ed25519 signature.
 */
export async function signEvent(event: Record<string, unknown>): Promise<string> {
  const privateKey = config.get('private_key') as string
  if (!privateKey) {
    throw new Error('No private key found. Run: arena register <bot-name>')
  }

  const message = JSON.stringify(event)
  const messageBytes = new TextEncoder().encode(message)
  const privateKeyBytes = hexToBytes(privateKey)

  const signature = await ed25519.signAsync(messageBytes, privateKeyBytes)
  return bytesToHex(signature)
}

/**
 * Get all stored config values (for status display and service use).
 */
export function getConfig(): Record<string, unknown> {
  return {
    bot_id: config.get('bot_id'),
    bot_name: config.get('bot_name'),
    public_key: config.get('public_key'),
    private_key: config.get('private_key'),
    user_id: config.get('user_id'),
    username: config.get('username'),
    token: config.get('token'),
    api_url: config.get('api_url'),
  }
}

/**
 * Store a config value.
 */
export function setConfig(key: string, value: unknown): void {
  config.set(key, value)
}

// Hex utilities
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}
