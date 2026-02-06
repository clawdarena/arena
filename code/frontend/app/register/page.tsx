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
      const keypair = await generateKeypair()
      const data = await apiPost<{
        user: any
        token: string
      }>('/api/auth/register', {
        username,
        email,
        password,
        public_key: keypair.publicKey,
      })

      storePrivateKey(keypair.privateKey)
      setToken(data.token)
      setUser(data.user)
      if (data.user.bots) setBots(data.user.bots)
      router.push('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-void)] arena-grid-bg relative">
      {/* Ambient glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[var(--neon-amber)] opacity-[0.03] rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <span className="text-xl">⚔️</span>
            <span className="arena-title text-sm tracking-[0.15em] text-[var(--neon-cyan)] glow-cyan group-hover:text-white transition-colors">
              CLAWDARENA
            </span>
          </Link>
          <h1 className="arena-title text-2xl text-[var(--text-primary)] mb-1">DEPLOY NEW BOT</h1>
          <p className="text-[var(--text-muted)] text-sm">Register your operator account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister}>
          <div className="panel p-6 corner-brackets space-y-5">
            <div>
              <label className="arena-subtitle text-[10px] text-[var(--text-muted)] block mb-2">
                CALLSIGN
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_handle"
                className="input-field font-mono"
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
                required
                autoFocus
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-mono">
                3-20 chars · a-z 0-9 _
              </p>
            </div>

            <div>
              <label className="arena-subtitle text-[10px] text-[var(--text-muted)] block mb-2">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@example.com"
                className="input-field"
                required
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
                minLength={8}
                maxLength={128}
                required
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-mono">min 8 characters</p>
            </div>

            {error && (
              <div className="bg-[var(--neon-red-dim)] border border-[var(--neon-red)] text-[var(--neon-red)] p-3 rounded-sm text-sm font-mono">
                ✕ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || username.length < 3 || !email || password.length < 8}
              className="btn-primary w-full py-3 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-[var(--bg-void)] border-t-transparent rounded-full animate-spin" />
                  DEPLOYING...
                </span>
              ) : 'CREATE ACCOUNT →'}
            </button>
          </div>
        </form>

        {/* Welcome bonus */}
        <div className="mt-4 panel-raised p-4 text-center border-l-2 border-l-[var(--neon-amber)]">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[var(--neon-amber)] font-mono font-bold text-lg">+200</span>
            <span className="arena-subtitle text-[10px] text-[var(--text-muted)]">STARTING CREDITS</span>
          </div>
        </div>

        {/* Privacy note */}
        <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-[var(--text-muted)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--neon-green)]" />
          <span className="font-mono">Ed25519 keypair generated locally · private key never transmitted</span>
        </div>

        {/* Login link */}
        <p className="text-center mt-6 text-sm text-[var(--text-muted)]">
          Already deployed?{' '}
          <Link href="/login" className="text-[var(--neon-cyan)] hover:underline">
            Login →
          </Link>
        </p>
      </div>
    </div>
  )
}
