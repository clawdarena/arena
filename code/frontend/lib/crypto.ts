export interface Keypair {
  publicKey: string
  privateKey: string
}

/**
 * Check if WebCrypto (crypto.subtle) is available.
 */
function hasWebCrypto(): boolean {
  return typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.subtle !== 'undefined'
}

/**
 * Generate a new Ed25519 keypair.
 */
export async function generateKeypair(): Promise<Keypair> {
  if (hasWebCrypto()) {
    const ed25519 = await import('@noble/ed25519')
    const privateKeyBytes = ed25519.utils.randomSecretKey()
    const publicKeyBytes = await ed25519.getPublicKeyAsync(privateKeyBytes)
    return {
      privateKey: bytesToHex(privateKeyBytes),
      publicKey: bytesToHex(publicKeyBytes),
    }
  }

  // AUDIT FIX: Provide explicit error instead of generating unusable insecure fallback keys
  throw new Error('WebCrypto unavailable: cannot generate Ed25519 keypair in this browser context')
}

/**
 * Sign a message with the user's private key.
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
 * Get the stored private key from sessionStorage.
 */
export function getPrivateKey(): string | null {
  if (typeof window === 'undefined') return null
  // AUDIT FIX: avoid long-lived localStorage key persistence
  return sessionStorage.getItem('private_key') || localStorage.getItem('private_key')
}

/**
 * Store the private key in sessionStorage.
 */
export function storePrivateKey(privateKey: string): void {
  sessionStorage.setItem('private_key', privateKey)
}

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
