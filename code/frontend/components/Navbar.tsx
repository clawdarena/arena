'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import {
  Swords,
  LayoutDashboard,
  ShoppingBag,
  Trophy,
  Bot,
  Gamepad2,
  ScrollText,
  Shield,
  LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'HQ', icon: LayoutDashboard },
  { href: '/queue', label: 'Fight', icon: Swords },
  { href: '/pve', label: 'PvE', icon: Gamepad2 },
  { href: '/bot', label: 'Bot', icon: Bot },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/leaderboard', label: 'Ranks', icon: Trophy },
  { href: '/history', label: 'Log', icon: ScrollText },
  { href: '/gauntlet', label: 'Gauntlet', icon: Shield },
]

export function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  return (
    <nav className="border-b border-[var(--border-dim)] bg-[var(--bg-steel)]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-lg">⚔️</span>
            <span className="arena-title text-sm tracking-[0.15em] text-[var(--neon-cyan)] glow-cyan group-hover:text-white transition-colors">
              CLAWDARENA
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all
                    ${isActive
                      ? 'text-[var(--neon-cyan)] bg-[var(--neon-cyan-dim)] border-b-2 border-[var(--neon-cyan)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user && (
              <>
                <div className="hidden sm:flex items-center gap-2 text-xs">
                  <span className="text-[var(--neon-amber)] font-mono font-bold">{user.credits ?? 0}</span>
                  <span className="text-[var(--text-muted)]">CR</span>
                </div>
                <div className="h-4 w-px bg-[var(--border-dim)]" />
                <span className="text-xs text-[var(--text-secondary)] font-medium">{user.username}</span>
                <button
                  onClick={logout}
                  className="text-[var(--text-muted)] hover:text-[var(--neon-red)] transition-colors p-1"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex overflow-x-auto gap-0.5 pb-2 -mx-4 px-4 scrollbar-thin">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap transition-all rounded-sm
                  ${isActive
                    ? 'text-[var(--neon-cyan)] bg-[var(--neon-cyan-dim)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }
                `}
              >
                <Icon className="w-3 h-3" />
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
