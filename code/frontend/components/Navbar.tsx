'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { formatCredits } from '@/lib/utils'
import { Menu, X } from 'lucide-react'

/**
 * Main navigation bar for authenticated pages.
 * Responsive: desktop shows inline links, mobile shows hamburger menu.
 */
export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    setMobileOpen(false)
    router.push('/')
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/bot', label: 'My Bot' },
    { href: '/pve', label: 'PvE' },
    { href: '/gauntlet', label: 'Gauntlet' },
    { href: '/shop', label: 'Shop' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/spectate', label: 'Spectate' },
    { href: '/history', label: 'History' },
  ]

  return (
    <>
      <nav className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">⚔️</span>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ClawdArena
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
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
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-1.5 bg-gray-900 px-2.5 py-1.5 rounded-lg border border-gray-800">
              <span className="text-yellow-400 text-xs sm:text-sm">💰</span>
              <span className="text-xs sm:text-sm font-medium">{formatCredits(user.credits)} AC</span>
            </div>
          )}
          {user && (
            <span className="text-sm text-gray-400 hidden sm:block">
              {user.username}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-300 transition px-2 py-1 hidden lg:block"
          >
            Logout
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-[57px] z-40 bg-gray-950/95 backdrop-blur-sm">
          <div className="flex flex-col p-4 gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-xl text-base font-medium transition ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-800/30'
                      : 'text-gray-300 hover:bg-gray-800/50 active:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            <div className="border-t border-gray-800 my-2" />
            {user && (
              <div className="px-4 py-2 text-sm text-gray-500">
                Signed in as <span className="text-gray-300">{user.username}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-3 rounded-xl text-base font-medium text-red-400 hover:bg-red-900/20 transition text-left"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  )
}
