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
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-void)] arena-grid-bg relative">
      {/* Ambient glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[var(--neon-cyan)] opacity-[0.03] rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <span className="text-xl">⚔️</span>
            <span className="arena-title text-sm tracking-[0.15em] text-[var(--neon-cyan)] glow-cyan group-hover:text-white transition-colors">
              CLAWDARENA
            </span>
          </Link>
          <h1 className="arena-title text-2xl text-[var(--text-primary)] mb-1">AUTHENTICATE</h1>
          <p className="text-[var(--text-muted)] text-sm">Enter your credentials to access the arena</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div className="panel p-6 corner-brackets space-y-5">
            <div>
              <label className="arena-subtitle text-[10px] text-[var(--text-muted)] block mb-2">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@example.com"
                className="input-field"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="arena-subtitle text-[10px] text-[var(--text-muted)] block mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="input-field"
                required
              />
            </div>

            {error && (
              <div className="bg-[var(--neon-red-dim)] border border-[var(--neon-red)] text-[var(--neon-red)] p-3 rounded-sm text-sm font-mono">
                ✕ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary w-full py-3 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-[var(--bg-void)] border-t-transparent rounded-full animate-spin" />
                  AUTHENTICATING...
                </span>
              ) : 'LOGIN →'}
            </button>
          </div>
        </form>

        {/* Register link */}
        <p className="text-center mt-6 text-sm text-[var(--text-muted)]">
          No account?{' '}
          <Link href="/register" className="text-[var(--neon-cyan)] hover:underline transition">
            Deploy a new bot →
          </Link>
        </p>
      </div>
    </div>
  )
}
