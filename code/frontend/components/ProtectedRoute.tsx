'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { api } from '@/lib/api'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Auth guard component.
 * Checks localStorage for a token, verifies it with /api/auth/me,
 * and redirects to /login if the token is missing or invalid.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, setUser, setBots } = useAuthStore()
  const [checking, setChecking] = useState(!user)

  useEffect(() => {
    if (user) {
      setChecking(false)
      return
    }

    async function verifyAuth() {
      const token = localStorage.getItem('token')

      if (!token) {
        router.push('/login')
        return
      }

      try {
        const data = await api<any>('/api/auth/me')
        setUser(data)
        if (data.bots) setBots(data.bots)
      } catch {
        localStorage.removeItem('token')
        router.push('/login')
        return
      }

      setChecking(false)
    }

    verifyAuth()
  }, [user, router, setUser, setBots])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-void)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--text-secondary)] text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
