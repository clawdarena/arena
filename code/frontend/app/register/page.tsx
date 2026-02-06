'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { apiPost } from '@/lib/api'
import { generateKeypair, storePrivateKey } from '@/lib/crypto'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
        email,
        password,
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
          <p className="text-[var(--text-secondary)] mt-2">Create your fighter account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="bg-[var(--bg-panel)] rounded-sm border border-[var(--border-dim)] p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full px-4 py-3 bg-[var(--bg-raised)] border border-[var(--border-mid)] rounded-sm focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)] focus:border-[var(--neon-cyan)] text-white placeholder-[var(--text-muted)]"
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
                required
                autoFocus
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                3-20 characters, letters, numbers, underscores
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-[var(--bg-raised)] border border-[var(--border-mid)] rounded-sm focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)] focus:border-[var(--neon-cyan)] text-white placeholder-[var(--text-muted)]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 bg-[var(--bg-raised)] border border-[var(--border-mid)] rounded-sm focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)] focus:border-[var(--neon-cyan)] text-white placeholder-[var(--text-muted)]"
                minLength={8}
                maxLength={128}
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 p-3 rounded-sm text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || username.length < 3 || !email || password.length < 8}
              className="w-full py-3 bg-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)] disabled:opacity-50 disabled:cursor-not-allowed rounded-sm font-semibold transition"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>

        {/* Welcome bonus */}
        <div className="mt-4 bg-[var(--neon-cyan-dim)] border border-purple-800/40 rounded-sm p-4 text-center">
          <p className="text-[var(--neon-cyan)] text-sm font-medium">🎁 Welcome Bonus</p>
          <p className="text-[var(--text-secondary)] text-xs mt-1">
            New players receive 200 Arena Credits to start competing!
          </p>
        </div>

        {/* Login link */}
        <p className="text-center mt-6 text-sm text-[var(--text-muted)]">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--neon-cyan)] hover:text-[var(--neon-cyan)] transition">
            Login
          </Link>
        </p>

        {/* Privacy note */}
        <p className="text-center mt-4 text-xs text-[var(--text-muted)]">
          🔒 Your private key is generated locally and never leaves your machine.
        </p>
      </div>
    </div>
  )
}
