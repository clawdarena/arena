'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { useAuthStore } from '@/lib/store'
import { api } from '@/lib/api'
import { getEloTier, TIER_COLORS, TIER_BG_COLORS } from '@/lib/constants'
import { timeAgo, formatELO } from '@/lib/utils'
import {
  User,
  Trophy,
  Swords,
  Shield,
  Heart,
  Zap,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Minus,
  Search,
  Flame,
  BarChart3,
  Clock,
  ArrowRight,
} from 'lucide-react'

// ============================================================
// Types
// ============================================================

interface PlayerProfile {
  user: {
    id: string
    username: string
    created_at: string
  }
  bot: {
    name: string
    avatar: string
    tagline: string
    level: number
    base_hp: number
    base_attack: number
    base_defense: number
    base_speed: number
  }
  stats: {
    elo: number
    wins: number
    losses: number
    draws: number
    win_rate: number
    matches_played: number
    current_streak?: number
  }
  recent_matches: RecentMatch[]
}

interface RecentMatch {
  id: string
  result: 'win' | 'loss' | 'draw'
  opponent: {
    username: string
    bot_name: string
  }
  rounds_fought: number
  elo_change: number
  created_at: string
}

// ============================================================
// Sub-components
// ============================================================

function TierBadge({ elo }: { elo: number }) {
  const tier = getEloTier(elo)
  const color = TIER_COLORS[tier]
  const bg = TIER_BG_COLORS[tier]
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${color} ${bg}`}>
      {tier}
    </span>
  )
}

function ResultBadge({ result }: { result: 'win' | 'loss' | 'draw' }) {
  const config = {
    win: { label: 'W', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    loss: { label: 'L', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    draw: { label: 'D', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  }
  const c = config[result]
  return (
    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  )
}

function StatBar({ label, value, max, icon: Icon, color }: {
  label: string
  value: number
  max: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gray-800 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">{label}</span>
          <span className="text-xs font-mono text-gray-300">{value}</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color.replace('text-', 'bg-')}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, subtext }: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  subtext?: string
}) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 animate-pulse">
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-800 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-gray-800 rounded w-48" />
            <div className="h-4 bg-gray-800 rounded w-32" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 p-4 h-24" />
        ))}
      </div>
    </div>
  )
}

function NotFound({ username }: { username: string }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-white mb-2">Player Not Found</h2>
        <p className="text-gray-400 mb-6">
          No player with username <span className="text-purple-400 font-medium">&quot;{username}&quot;</span> exists.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/leaderboard"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            View Leaderboard
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Main Page Component
// ============================================================

export default function PlayerProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { user: currentUser } = useAuthStore()

  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const isOwnProfile = currentUser?.username === username

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api<PlayerProfile>(`/api/players/${encodeURIComponent(username)}`)
        setProfile(data)
      } catch (err: any) {
        console.error('Failed to fetch player profile:', err)
        if (err.message?.includes('404') || err.message?.includes('not found') || err.message?.includes('Not Found')) {
          setNotFound(true)
        } else {
          setNotFound(true)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [username])

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      {loading && <LoadingSkeleton />}

      {!loading && notFound && <NotFound username={username} />}

      {!loading && profile && (
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">

          {/* ===== Header Section ===== */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 sm:p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-3xl flex-shrink-0">
                {profile.bot.avatar || '🤖'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                    {profile.bot.name}
                  </h1>
                  <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 text-xs font-medium border border-gray-700">
                    Lv.{profile.bot.level}
                  </span>
                  <TierBadge elo={profile.stats.elo} />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-sm text-gray-400">@{profile.user.username}</span>
                  {isOwnProfile && (
                    <span className="text-[10px] bg-purple-600/30 text-purple-300 px-1.5 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </div>

                {profile.bot.tagline && (
                  <p className="text-sm text-gray-500 italic">&ldquo;{profile.bot.tagline}&rdquo;</p>
                )}
              </div>

              {/* ELO + Member since */}
              <div className="text-left sm:text-right flex-shrink-0">
                <div className="text-3xl sm:text-4xl font-bold text-white font-mono">
                  {formatELO(profile.stats.elo)}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">ELO Rating</div>
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 sm:justify-end">
                  <Calendar className="w-3 h-3" />
                  Member since {new Date(profile.user.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ===== Stats Grid ===== */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Win/Loss/Draw */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Swords className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 uppercase tracking-wider">Record</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-green-400">{profile.stats.wins}</span>
                <span className="text-gray-600">/</span>
                <span className="text-lg font-bold text-red-400">{profile.stats.losses}</span>
                <span className="text-gray-600">/</span>
                <span className="text-lg font-bold text-yellow-400">{profile.stats.draws}</span>
              </div>
              <div className="text-[10px] text-gray-600 mt-1">W / L / D</div>
            </div>

            {/* Win Rate */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 uppercase tracking-wider">Win Rate</span>
              </div>
              {(() => {
                const pct = (profile.stats.win_rate * 100).toFixed(1)
                const color =
                  profile.stats.win_rate >= 0.6
                    ? 'text-green-400'
                    : profile.stats.win_rate >= 0.5
                    ? 'text-yellow-400'
                    : 'text-red-400'
                return (
                  <div className={`text-2xl font-bold ${color}`}>{pct}%</div>
                )
              })()}
            </div>

            {/* Total Matches */}
            <StatCard
              label="Matches"
              value={profile.stats.matches_played}
              icon={Target}
              subtext="Total played"
            />

            {/* Streak */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 uppercase tracking-wider">Streak</span>
              </div>
              {profile.stats.current_streak != null && profile.stats.current_streak !== 0 ? (
                <>
                  <div className={`text-2xl font-bold ${profile.stats.current_streak > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {profile.stats.current_streak > 0 ? '+' : ''}{profile.stats.current_streak}
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1">
                    {profile.stats.current_streak > 0 ? 'Win streak' : 'Loss streak'}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-600">—</div>
                  <div className="text-[10px] text-gray-600 mt-1">No active streak</div>
                </>
              )}
            </div>
          </div>

          {/* ===== Base Stats ===== */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              Base Stats
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatBar label="HP" value={profile.bot.base_hp} max={100} icon={Heart} color="text-red-400" />
              <StatBar label="Attack" value={profile.bot.base_attack} max={50} icon={Swords} color="text-orange-400" />
              <StatBar label="Defense" value={profile.bot.base_defense} max={50} icon={Shield} color="text-blue-400" />
              <StatBar label="Speed" value={profile.bot.base_speed} max={50} icon={Zap} color="text-yellow-400" />
            </div>
          </div>

          {/* ===== Recent Matches ===== */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Recent Matches
              </h2>
              {isOwnProfile && (
                <Link
                  href="/history"
                  className="text-xs text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
                >
                  View Full History
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {profile.recent_matches.length > 0 ? (
              <div className="divide-y divide-gray-800/50">
                {profile.recent_matches.map((match) => (
                  <div
                    key={match.id}
                    className="px-6 py-3 flex items-center gap-4 hover:bg-gray-800/30 transition"
                  >
                    {/* Result badge */}
                    <ResultBadge result={match.result} />

                    {/* Opponent & rounds */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-200 truncate">
                        vs <span className="font-medium">{match.opponent.bot_name || match.opponent.username}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {match.rounds_fought} round{match.rounds_fought !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* ELO change */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {match.elo_change > 0 ? (
                        <>
                          <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-sm font-mono font-medium text-green-400">
                            +{match.elo_change}
                          </span>
                        </>
                      ) : match.elo_change < 0 ? (
                        <>
                          <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-sm font-mono font-medium text-red-400">
                            {match.elo_change}
                          </span>
                        </>
                      ) : (
                        <>
                          <Minus className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-sm font-mono font-medium text-gray-500">0</span>
                        </>
                      )}
                    </div>

                    {/* Time ago */}
                    <div className="text-xs text-gray-600 flex-shrink-0 w-14 text-right">
                      {timeAgo(match.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">⚔️</div>
                <p className="text-gray-500 text-sm">No matches played yet.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
