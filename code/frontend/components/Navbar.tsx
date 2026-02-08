'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore, useCosmeticsStore } from '@/lib/store'
import { getEloTier, TIER_COLORS, type EloTier } from '@/lib/constants'
import { formatCredits, formatELO } from '@/lib/utils'
import { SKINS } from '@/lib/cosmetics'
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
  Menu,
  X,
  ChevronDown,
  Coins,
  Settings,
  Clock,
  Store,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'HQ', icon: LayoutDashboard },
  { href: '/queue', label: 'Fight', icon: Swords },
  { href: '/pve', label: 'PvE', icon: Gamepad2 },
  { href: '/bot', label: 'Bot', icon: Bot },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/leaderboard', label: 'Ranks', icon: Trophy },
  { href: '/history', label: 'History', icon: ScrollText },
  { href: '/gauntlet', label: 'Gauntlet', icon: Shield },
]

const TIER_LABELS: Record<EloTier, string> = {
  bronze: 'BRONZE',
  silver: 'SILVER',
  gold: 'GOLD',
  platinum: 'PLATINUM',
  legend: 'LEGEND',
}

const TIER_ICON_COLORS: Record<EloTier, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#00e5ff',
  legend: '#ff4444',
}

function getEquippedSkinColor(equippedSkinId: string | null): string {
  if (!equippedSkinId) return '#00f0ff'
  const skin = SKINS.find(s => s.id === equippedSkinId)
  return skin?.metadata.color || '#00f0ff'
}

export function Navbar() {
  const pathname = usePathname()
  const { user, bots, logout } = useAuthStore()
  const { equippedItems } = useCosmeticsStore()
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const skinColor = getEquippedSkinColor(equippedItems.skin)
  const tier = user ? getEloTier(user.current_elo) : 'bronze'
  const tierColor = TIER_COLORS[tier]
  const tierIconColor = TIER_ICON_COLORS[tier]

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileOpen])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setProfileOpen(false)
  }, [pathname])

  // Calculate level from XP (simple formula)
  const bot = bots[0]
  const botLevel = bot?.level ?? 1
  const botXp = bot?.xp ?? 0
  const xpForNextLevel = botLevel * 100
  const xpProgress = Math.min((botXp / xpForNextLevel) * 100, 100)

  return (
    <>
      <nav className="border-b border-[var(--border-dim)] bg-[var(--bg-steel)]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 group">
              <span className="text-xl">⚔️</span>
              <span className="arena-title text-sm sm:text-base tracking-[0.15em] text-[var(--neon-cyan)] glow-cyan group-hover:text-white transition-colors">
                CLAWDARENA
              </span>
            </Link>

            {/* Desktop nav links */}
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
            <div className="flex items-center gap-2">
              {user && (
                <>
                  {/* Credits */}
                  <div className="hidden sm:flex items-center gap-1.5 panel-raised px-2.5 py-1 rounded-sm">
                    <Coins className="w-3.5 h-3.5 text-[var(--neon-amber)]" />
                    <span className="text-[var(--neon-amber)] font-mono font-bold text-xs">{formatCredits(user.credits ?? 0)}</span>
                    <span className="text-[var(--text-muted)] text-[9px] font-mono">CR</span>
                  </div>

                  {/* Profile button */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-sm transition-all border ${
                        profileOpen
                          ? 'border-[var(--neon-cyan)]/40 bg-[var(--bg-raised)]'
                          : 'border-transparent hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      {/* Avatar circle with skin color */}
                      <div
                        className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                        style={{
                          borderColor: skinColor,
                          background: `radial-gradient(circle at 35% 35%, ${skinColor}cc, ${skinColor}44)`,
                          boxShadow: `0 0 8px ${skinColor}33`,
                          color: 'white',
                        }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden sm:block text-xs font-medium text-[var(--text-primary)]">
                        {user.username}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-[var(--text-muted)] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Profile dropdown */}
                    {profileOpen && (
                      <div className="absolute right-0 top-full mt-1 w-72 sm:w-80 animate-dropdown-in z-50">
                        <div className="panel border-[var(--border-mid)] overflow-hidden">
                          {/* Profile header */}
                          <div className="p-4 bg-[var(--bg-raised)] border-b border-[var(--border-dim)]">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-bold"
                                style={{
                                  borderColor: skinColor,
                                  background: `radial-gradient(circle at 35% 35%, ${skinColor}cc, ${skinColor}44)`,
                                  boxShadow: `0 0 12px ${skinColor}44`,
                                  color: 'white',
                                }}
                              >
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[var(--text-primary)] text-sm truncate">
                                  {bot?.name || user.username}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {/* Tier badge */}
                                  <span
                                    className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm"
                                    style={{
                                      color: tierIconColor,
                                      backgroundColor: `${tierIconColor}15`,
                                      border: `1px solid ${tierIconColor}40`,
                                    }}
                                  >
                                    {TIER_LABELS[tier]}
                                  </span>
                                  <span className={`text-xs font-mono font-bold ${tierColor}`}>
                                    {formatELO(user.current_elo)} ELO
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="p-4 space-y-3">
                            {/* Win/Loss */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[var(--text-muted)] font-mono">W / L</span>
                              <span className="font-mono font-bold">
                                <span className="text-[var(--neon-green)]">{user.wins}</span>
                                <span className="text-[var(--text-muted)]"> / </span>
                                <span className="text-[var(--neon-red)]">{user.losses}</span>
                                {user.total_matches > 0 && (
                                  <span className="text-[var(--text-muted)] ml-1.5 text-[10px]">
                                    ({Math.round((user.wins / user.total_matches) * 100)}%)
                                  </span>
                                )}
                              </span>
                            </div>

                            {/* Credits */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[var(--text-muted)] font-mono">Credits</span>
                              <span className="font-mono font-bold text-[var(--neon-amber)]">
                                {formatCredits(user.credits)} CR
                              </span>
                            </div>

                            {/* Level + XP bar */}
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-[var(--text-muted)] font-mono">Level {botLevel}</span>
                                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                                  {botXp} / {xpForNextLevel} XP
                                </span>
                              </div>
                              <div className="bar-track">
                                <div
                                  className="bar-fill-xp bar-animated"
                                  style={{ width: `${xpProgress}%` }}
                                />
                              </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-[var(--border-dim)]" />

                            {/* Quick links */}
                            <div className="space-y-0.5">
                              <Link
                                href="/bot"
                                onClick={() => setProfileOpen(false)}
                                className="flex items-center gap-2.5 px-2 py-2 rounded-sm text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition"
                              >
                                <Settings className="w-3.5 h-3.5" />
                                Bot Settings
                              </Link>
                              <Link
                                href="/history"
                                onClick={() => setProfileOpen(false)}
                                className="flex items-center gap-2.5 px-2 py-2 rounded-sm text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                Match History
                              </Link>
                              <Link
                                href="/shop"
                                onClick={() => setProfileOpen(false)}
                                className="flex items-center gap-2.5 px-2 py-2 rounded-sm text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition"
                              >
                                <Store className="w-3.5 h-3.5" />
                                Shop
                              </Link>
                            </div>

                            {/* Sign Out */}
                            <div className="pt-1 border-t border-[var(--border-dim)]">
                              <button
                                onClick={() => {
                                  setProfileOpen(false)
                                  logout()
                                }}
                                className="flex items-center gap-2.5 px-2 py-2 rounded-sm text-xs font-medium text-[var(--neon-red)]/70 hover:text-[var(--neon-red)] hover:bg-[var(--neon-red)]/5 transition w-full"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                Sign Out
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile burger menu */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile slide-out menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Menu panel */}
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-[var(--bg-steel)] border-l border-[var(--border-dim)] z-50 md:hidden animate-slide-in-right overflow-y-auto">
            <div className="p-4">
              {/* Mobile credits */}
              {user && (
                <div className="flex items-center gap-2 panel-raised px-3 py-2 rounded-sm mb-4">
                  <Coins className="w-4 h-4 text-[var(--neon-amber)]" />
                  <span className="text-[var(--neon-amber)] font-mono font-bold text-sm">{formatCredits(user.credits ?? 0)}</span>
                  <span className="text-[var(--text-muted)] text-[10px] font-mono">CR</span>
                </div>
              )}

              {/* Nav links */}
              <div className="space-y-1">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-semibold uppercase tracking-wider transition-all ${
                        isActive
                          ? 'text-[var(--neon-cyan)] bg-[var(--neon-cyan-dim)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
