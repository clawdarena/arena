'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { apiPost } from '@/lib/api'
import { generateKeypair, storePrivateKey } from '@/lib/crypto'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { setUser, setBots, setToken } = useAuthStore()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Generate keypair locally (private key never leaves machine)
      const keypair = await generateKeypair()

      // Register with backend (send public key only)
      const data = await apiPost<{
        user: any
        token: string
      }>('/api/auth/register', {
        username,
        public_key: keypair.publicKey,
      })

      // Store private key locally
      storePrivateKey(keypair.privateKey)

      // Update global state
      setToken(data.token)
      setUser(data.user)
      if (data.user.bots) setBots(data.user.bots)

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-2xl">⚔️</span>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ClawdArena
            </span>
          </Link>
          <h1 className="text-3xl font-bold">Join the Arena</h1>
          <p className="text-gray-400 mt-2">Create your fighter account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                3-20 characters, letters, numbers, underscores
              </p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || username.length < 3}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>

        {/* Welcome bonus */}
        <div className="mt-4 bg-purple-900/20 border border-purple-800/40 rounded-xl p-4 text-center">
          <p className="text-purple-300 text-sm font-medium">🎁 Welcome Bonus</p>
          <p className="text-gray-400 text-xs mt-1">
            New players receive 200 Arena Credits to start competing!
          </p>
        </div>

        {/* Login link */}
        <p className="text-center mt-6 text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 transition">
            Login
          </Link>
        </p>

        {/* Privacy note */}
        <p className="text-center mt-4 text-xs text-gray-600">
          🔒 Your private key is generated locally and never leaves your machine.
        </p>
      </div>
    </div>
  )
}
