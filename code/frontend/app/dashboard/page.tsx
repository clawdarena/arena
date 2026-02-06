'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, useQueueStore } from '@/lib/store'
import { formatCredits, formatELO, getELORank, getEntryFee, timeAgo } from '@/lib/utils'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import { ALL_SKILLS, type MatchHistoryEntry } from '@/lib/constants'
import { api } from '@/lib/api'
import type { Skill, SkillId } from '../../../shared/types'
import { Swords, Shield, Zap, Heart, TrendingUp, TrendingDown, Minus, ChevronRight, Trophy, Flame, Activity } from 'lucide-react'

function StatBar({ label, value, max, color, icon }: {
  label: string
  value: number
  max: number
  color: string
  icon: React.ReactNode
}) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 text-center">{icon}</div>
      <span className="text-xs text-gray-400 w-8">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-gray-300 w-8 text-right">{value}</span>
    </div>
  )
}

function SkillBadge({ skillId }: { skillId: string }) {
  const skill = ALL_SKILLS[skillId as SkillId]
  if (!skill) return null

  const rarityColors: Record<string, string> = {
    common: 'border-gray-600 bg-gray-800/50 text-gray-300',
    rare: 'border-blue-600/50 bg-blue-900/20 text-blue-400',
    epic: 'border-purple-600/50 bg-purple-900/20 text-purple-400',
    legendary: 'border-yellow-600/50 bg-yellow-900/20 text-yellow-400',
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${rarityColors[skill.rarity] || rarityColors.common}`}>
      <span className="text-sm">✨</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{skill.name}</div>
        <div className="text-xs opacity-60">{skill.cooldown}r cooldown</div>
      </div>
    </div>
  )
}

function MatchHistoryRow({ match }: { match: MatchHistoryEntry }) {
  const isWin = match.winner_id === match.my_bot.id
  const isDraw = match.winner_id === null
  const eloChange = match.my_bot.elo_after - match.my_bot.elo_before

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-800/50 transition group">
      {/* Result indicator */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
        isDraw ? 'bg-gray-700/50 text-gray-400' :
        isWin ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
      }`}>
        {isDraw ? 'D' : isWin ? 'W' : 'L'}
      </div>

      {/* Opponent info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-200 truncate">
          vs {match.opponent.name}
        </div>
        <div className="text-xs text-gray-500">
          {match.rounds_fought} rounds · {timeAgo(match.created_at)}
        </div>
      </div>

      {/* ELO change */}
      <div className={`flex items-center gap-1 text-sm font-mono ${
        eloChange > 0 ? 'text-green-400' : eloChange < 0 ? 'text-red-400' : 'text-gray-500'
      }`}>
        {eloChange > 0 ? <TrendingUp className="w-3.5 h-3.5" /> :
         eloChange < 0 ? <TrendingDown className="w-3.5 h-3.5" /> :
         <Minus className="w-3.5 h-3.5" />}
        {eloChange > 0 ? '+' : ''}{eloChange}
      </div>

      {/* Credits */}
      {match.credits_won > 0 && (
        <span className="text-xs text-yellow-400 font-medium">+{match.credits_won} AC</span>
      )}
    </div>
  )
}

function DashboardContent() {
  const router = useRouter()
  const { user, bots, setUser, setBots, setToken } = useAuthStore()
  const { isQueuing, startQueuing, stopQueuing } = useQueueStore()
  const [selectedTier, setSelectedTier] = useState('ranked_bronze')
  const [recentMatches, setRecentMatches] = useState<MatchHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch real user data from backend
  useEffect(() => {
    async function fetchData() {
      try {
        const me = await api<any>('/api/auth/me')
        setUser({
          id: me.id,
          username: me.username,
          credits: me.credits,
          current_elo: me.current_elo,
          peak_elo: me.peak_elo,
          total_matches: me.total_matches,
          wins: me.wins,
          losses: me.losses,
          created_at: me.created_at,
        })
        if (me.bots?.length) {
          setBots(me.bots)
        }

        // Fetch match history
        try {
          const historyRes = await api<{ matches: MatchHistoryEntry[] }>('/api/matches/history?limit=5')
          setRecentMatches(historyRes.matches || [])
        } catch {
          // No matches yet — that's fine
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [setUser, setBots])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-gray-500">Loading...</div>
    </div>
  )

  if (!user) return null

  const rank = getELORank(user.current_elo)
  const winRate = user.total_matches > 0
    ? ((user.wins / user.total_matches) * 100).toFixed(1)
    : '0.0'

  const bot = bots[0]

  const tiers = [
    { id: 'ranked_bronze', name: 'Bronze', fee: 50, minElo: 0 },
    { id: 'ranked_silver', name: 'Silver', fee: 100, minElo: 1200 },
    { id: 'ranked_gold', name: 'Gold', fee: 200, minElo: 1400 },
    { id: 'ranked_platinum', name: 'Platinum', fee: 400, minElo: 1600 },
    { id: 'ranked_legend', name: 'Legend', fee: 800, minElo: 1800 },
  ]

  function handleFindMatch() {
    if (isQueuing) {
      stopQueuing()
      return
    }

    const fee = getEntryFee(selectedTier)
    if (user && user.credits < fee) {
      alert(`Insufficient credits. Need ${fee} AC.`)
      return
    }

    startQueuing(selectedTier)
    router.push('/queue')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* Top Row: Profile + Credits + Peak */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Profile Card */}
        <div className="md:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-purple-500/20">
              🤖
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.username}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Trophy className={`w-4 h-4 ${rank.color}`} />
                <span className={`text-sm font-semibold ${rank.color}`}>
                  {rank.name}
                </span>
                <span className="text-sm text-gray-500">·</span>
                <span className="text-sm text-gray-300 font-mono">{formatELO(user.current_elo)} ELO</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-800/50 rounded-lg py-3">
              <div className="text-2xl font-bold text-green-400">{user.wins}</div>
              <div className="text-xs text-gray-500 mt-0.5">Wins</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg py-3">
              <div className="text-2xl font-bold text-red-400">{user.losses}</div>
              <div className="text-xs text-gray-500 mt-0.5">Losses</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg py-3">
              <div className="text-2xl font-bold text-blue-400">{winRate}%</div>
              <div className="text-xs text-gray-500 mt-0.5">Win Rate</div>
            </div>
          </div>
        </div>

        {/* Credits Card */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col justify-between">
          <div>
            <div className="text-sm text-gray-500 mb-1">Credits</div>
            <div className="text-3xl font-bold text-yellow-400">
              {formatCredits(user.credits)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Arena Credits</div>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 mt-3 text-xs text-purple-400 hover:text-purple-300 transition"
          >
            Visit shop <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Peak ELO Card */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col justify-between">
          <div>
            <div className="text-sm text-gray-500 mb-1">Peak ELO</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              {formatELO(user.peak_elo)}
            </div>
            <div className="text-xs text-gray-500 mt-1">All-time best</div>
          </div>
          <div className="mt-3 text-xs text-gray-600 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {user.total_matches} matches played
          </div>
        </div>
      </div>

      {/* Middle Row: Bot Stats + Skills + Match Finder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Bot Stats */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-lg">
              🤖
            </div>
            <div>
              <div className="font-semibold">{bot.name}</div>
              <div className="text-xs text-gray-500">Level {bot.level} · {bot.xp} XP</div>
            </div>
          </div>
          <div className="space-y-3">
            <StatBar
              label="HP"
              value={bot.base_hp}
              max={200}
              color="bg-red-500"
              icon={<Heart className="w-3.5 h-3.5 text-red-400" />}
            />
            <StatBar
              label="ATK"
              value={bot.base_attack}
              max={50}
              color="bg-orange-500"
              icon={<Swords className="w-3.5 h-3.5 text-orange-400" />}
            />
            <StatBar
              label="DEF"
              value={bot.base_defense}
              max={40}
              color="bg-blue-500"
              icon={<Shield className="w-3.5 h-3.5 text-blue-400" />}
            />
            <StatBar
              label="SPD"
              value={bot.base_speed}
              max={30}
              color="bg-green-500"
              icon={<Zap className="w-3.5 h-3.5 text-green-400" />}
            />
          </div>
        </div>

        {/* Equipped Skills */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4" />
            Equipped Skills
          </h3>
          <div className="space-y-3">
            {bot.skills.length > 0 ? (
              bot.skills.map((equipped) => (
                <SkillBadge key={equipped.slot} skillId={equipped.skill_id} />
              ))
            ) : (
              <p className="text-sm text-gray-600 text-center py-4">
                No skills equipped. Visit the shop!
              </p>
            )}
          </div>
          {bot.skills.length < 2 && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-xs text-gray-600">
                {2 - bot.skills.length} skill slot{2 - bot.skills.length > 1 ? 's' : ''} available
              </p>
            </div>
          )}
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 mt-4 text-xs text-purple-400 hover:text-purple-300 transition"
          >
            Browse skills <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Match Finder */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
            <Swords className="w-4 h-4" />
            Find a Match
          </h3>

          <div className="space-y-2 mb-4">
            {tiers.map((tier) => {
              const locked = user.current_elo < tier.minElo
              return (
                <button
                  key={tier.id}
                  onClick={() => !locked && setSelectedTier(tier.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-sm transition ${
                    selectedTier === tier.id
                      ? 'border-purple-500 bg-purple-900/30 text-white'
                      : locked
                      ? 'border-gray-800 bg-gray-800/20 text-gray-600 cursor-not-allowed'
                      : 'border-gray-700 hover:border-gray-600 text-gray-300'
                  }`}
                  disabled={locked}
                >
                  <span className="font-medium">{tier.name}</span>
                  <span className="text-xs text-gray-500">
                    {locked ? `🔒 ${tier.minElo}+ ELO` : `${tier.fee} AC`}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            onClick={handleFindMatch}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              isQueuing
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
            }`}
          >
            {isQueuing ? '⏳ Cancel Search' : '⚔️ Find Match'}
          </button>
        </div>
      </div>

      {/* Bottom Row: Recent Matches */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
            📜 Recent Matches
          </h3>
          <Link
            href="/history"
            className="text-xs text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
          >
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {recentMatches.length > 0 ? (
          <div className="divide-y divide-gray-800/50">
            {recentMatches.map((match) => (
              <MatchHistoryRow key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600 text-center py-6">
            No matches yet. Jump into the arena!
          </p>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <DashboardContent />
      </div>
    </ProtectedRoute>
  )
}
