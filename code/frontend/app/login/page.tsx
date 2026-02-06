'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { apiPost } from '@/lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { setUser, setBots, setToken } = useAuthStore()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = await apiPost<{
        user: any
        token: string
      }>('/api/auth/login', { email, password })

      setToken(data.token)
      setUser(data.user)
      if (data.user.bots) setBots(data.user.bots)

      router.push('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
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
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-[var(--text-secondary)] mt-2">Enter the arena</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="bg-[var(--bg-panel)] rounded-sm border border-[var(--border-dim)] p-6 space-y-4">
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
                autoFocus
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
                placeholder="Your password"
                className="w-full px-4 py-3 bg-[var(--bg-raised)] border border-[var(--border-mid)] rounded-sm focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)] focus:border-[var(--neon-cyan)] text-white placeholder-[var(--text-muted)]"
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
              disabled={loading || !email || !password}
              className="w-full py-3 bg-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)] disabled:opacity-50 disabled:cursor-not-allowed rounded-sm font-semibold transition"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        {/* Register link */}
        <p className="text-center mt-6 text-sm text-[var(--text-muted)]">
          New to the Arena?{' '}
          <Link href="/register" className="text-[var(--neon-cyan)] hover:text-[var(--neon-cyan)] transition">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  )
}
