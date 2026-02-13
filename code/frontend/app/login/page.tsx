'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { apiPost } from '@/lib/api'
import Script from 'next/script'

// Google OAuth Client ID (configured via env var)
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [googleReady, setGoogleReady] = useState(false)
  const router = useRouter()
  const { setUser, setBots, setToken } = useAuthStore()

  useEffect(() => {
    // Initialize Google Sign-In when client ID is available
    if (!GOOGLE_CLIENT_ID) return

    const initGoogle = () => {
      if (typeof window !== 'undefined' && (window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        })
        setGoogleReady(true)
      }
    }

    // Check if already loaded
    if ((window as any).google) {
      initGoogle()
    }
  }, [])

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

  async function handleGoogleResponse(response: any) {
    setLoading(true)
    setError('')

    try {
      const data = await apiPost<{
        user: any
        token: string
      }>('/api/auth/google', {
        // AUDIT FIX: Align payload key with backend contract
        google_token: response.credential,
      })

      setToken(data.token)
      setUser(data.user)
      if (data.user.bots) setBots(data.user.bots)

      router.push('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleSignIn() {
    if (!googleReady) {
      setError('Google Sign-In not ready. Please check configuration.')
      return
    }
    ;(window as any).google.accounts.id.prompt()
  }

  return (
    <>
      {/* Google Identity Services Script */}
      {GOOGLE_CLIENT_ID && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="lazyOnload"
          onLoad={() => {
            if ((window as any).google) {
              (window as any).google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleResponse,
              })
              setGoogleReady(true)
            }
          }}
        />
      )}

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

            {/* Divider */}
            {GOOGLE_CLIENT_ID && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--border-dim)]" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-[var(--bg-void)] px-2 text-[var(--text-muted)] arena-subtitle">OR</span>
                  </div>
                </div>

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || !googleReady}
                  className="w-full py-3 px-4 bg-white text-[#1f1f1f] font-semibold rounded-sm flex items-center justify-center gap-3 hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed border border-gray-300"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                  </svg>
                  {googleReady ? 'Sign in with Google' : 'Loading Google...'}
                </button>
              </>
            )}
          </div>
        </form>

        {/* Register link */}
        <p className="text-center mt-6 text-sm text-[var(--text-muted)]">
          No account?{' '}
          <Link href="/register" className="text-[var(--neon-cyan)] hover:underline transition">
            Deploy a new bot →
          </Link>
        </p>

        {/* Dev note: Google OAuth not configured */}
        {!GOOGLE_CLIENT_ID && (
          <div className="mt-6 text-center text-[10px] text-[var(--text-muted)] font-mono opacity-60">
            // Google OAuth: NEXT_PUBLIC_GOOGLE_CLIENT_ID not configured
          </div>
        )}
      </div>
    </div>
    </>
  )
}
