'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { formatCredits } from '@/lib/utils'

/**
 * Main navigation bar for authenticated pages.
 * Shows links to dashboard/shop/leaderboard/history + credit display + logout.
 */
export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    logout()
    router.push('/')
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/pve', label: 'PvE' },
    { href: '/gauntlet', label: 'Gauntlet' },
    { href: '/shop', label: 'Shop' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/history', label: 'History' },
  ]

  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center gap-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">⚔️</span>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            ClawdArena
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  isActive
                    ? 'bg-gray-800 text-white font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
            <span className="text-yellow-400 text-sm">💰</span>
            <span className="text-sm font-medium">{formatCredits(user.credits)} AC</span>
          </div>
        )}
        {user && (
          <span className="text-sm text-gray-400 hidden sm:block">
            {user.username}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-300 transition px-2 py-1"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
