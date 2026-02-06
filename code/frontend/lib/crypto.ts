import * as ed25519 from '@noble/ed25519'

export interface Keypair {
  publicKey: string
  privateKey: string
}

/**
 * Generate a new Ed25519 keypair.
 * Private key stays in localStorage, public key goes to server.
 */
export async function generateKeypair(): Promise<Keypair> {
  const privateKeyBytes = ed25519.utils.randomSecretKey()
  const publicKeyBytes = await ed25519.getPublicKeyAsync(privateKeyBytes)

  return {
    privateKey: bytesToHex(privateKeyBytes),
    publicKey: bytesToHex(publicKeyBytes),
  }
}

/**
 * Sign a message with the user's private key.
 * Used for signing combat actions.
 */
export async function signMessage(message: string, privateKeyHex: string): Promise<string> {
  const messageBytes = new TextEncoder().encode(message)
  const privateKeyBytes = hexToBytes(privateKeyHex)

  const signature = await ed25519.signAsync(messageBytes, privateKeyBytes)
  return bytesToHex(signature)
}

/**
 * Get the stored private key from localStorage.
 */
export function getPrivateKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('private_key')
}

/**
 * Store the private key in localStorage.
 */
export function storePrivateKey(privateKey: string): void {
  localStorage.setItem('private_key', privateKey)
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
