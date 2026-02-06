import * as ed25519 from '@noble/ed25519'

/**
 * Verify an Ed25519 signature
 */
export async function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    const messageBytes = new TextEncoder().encode(message)
    const signatureBytes = hexToBytes(signature)
    const publicKeyBytes = hexToBytes(publicKey)

    return await ed25519.verifyAsync(signatureBytes, messageBytes, publicKeyBytes)
  } catch {
    return false
  }
}

/**
 * Validate that a string is a valid Ed25519 public key (64 hex chars = 32 bytes)
 */
export function isValidPublicKey(key: string): boolean {
  return /^[0-9a-f]{64}$/i.test(key)
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}
