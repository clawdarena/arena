import { describe, expect, test } from 'bun:test'
import { signToken, verifyToken } from './auth'

// AUDIT FIX: Add minimal auth token regression test coverage

describe('auth jwt', () => {
  test('sign + verify roundtrip', () => {
    const token = signToken({ userId: 'u1', username: 'alice' })
    const payload = verifyToken(token)
    expect(payload.userId).toBe('u1')
    expect(payload.username).toBe('alice')
  })
})
