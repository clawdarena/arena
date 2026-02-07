export interface Keypair {
  publicKey: string
  privateKey: string
}

/**
 * Check if WebCrypto (crypto.subtle) is available.
 * It's only available in secure contexts (HTTPS) or localhost.
 */
function hasWebCrypto(): boolean {
  return typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.subtle !== 'undefined'
}

/**
 * Generate a new Ed25519 keypair.
 * Private key stays in localStorage, public key goes to server.
 *
 * Falls back to random hex keys when crypto.subtle is unavailable (HTTP).
 * Real Ed25519 signing happens in the plugin (Node.js) where crypto.subtle
 * is always available.
 */
export async function generateKeypair(): Promise<Keypair> {
  if (hasWebCrypto()) {
    // Full Ed25519 key generation when WebCrypto is available
    const ed25519 = await import('@noble/ed25519')
    const privateKeyBytes = ed25519.utils.randomSecretKey()
    const publicKeyBytes = await ed25519.getPublicKeyAsync(privateKeyBytes)
    return {
      privateKey: bytesToHex(privateKeyBytes),
      publicKey: bytesToHex(publicKeyBytes),
    }
  }

  // Fallback: generate random keys for registration
  // Combat signing uses the plugin (Node.js), not the browser
  const privateKeyBytes = new Uint8Array(32)
  globalThis.crypto.getRandomValues(privateKeyBytes)
  const publicKeyBytes = new Uint8Array(32)
  globalThis.crypto.getRandomValues(publicKeyBytes)
  return {
    privateKey: bytesToHex(privateKeyBytes),
    publicKey: bytesToHex(publicKeyBytes),
  }
}

/**
 * Sign a message with the user's private key.
 * Used for signing combat actions. Requires WebCrypto (HTTPS).
 */
export async function signMessage(message: string, privateKeyHex: string): Promise<string> {
  if (!hasWebCrypto()) {
    throw new Error('Combat signing requires HTTPS or the Arena plugin (Node.js)')
  }
  const ed25519 = await import('@noble/ed25519')
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
