'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { api, apiPost } from '@/lib/api'
import { formatCredits } from '@/lib/utils'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import {
  Trophy,
  Lock,
  CheckCircle2,
  Swords,
  Shield,
  Zap,
  Star,
  ChevronRight,
  Flame,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GauntletReward {
  stat: string
  amount: number
  credits: number
}

interface GauntletTier {
  tier: number
  name: string
  description: string
  opponent: string
  win_condition: string
  reward: GauntletReward
  completed: boolean
  completed_at: string | null
  locked: boolean
}

interface GauntletData {
  tiers: GauntletTier[]
  total_completed: number
  total_tiers: number
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const tierIcons: Record<number, React.ReactNode> = {
  1: <Swords className="w-5 h-5" />,
  2: <Flame className="w-5 h-5" />,
  3: <Zap className="w-5 h-5" />,
  4: <Shield className="w-5 h-5" />,
  5: <Trophy className="w-5 h-5" />,
}

const tierGlows: Record<number, string> = {
  1: 'from-green-600 to-emerald-600',
  2: 'from-orange-600 to-red-600',
  3: 'from-blue-600 to-cyan-600',
  4: 'from-slate-500 to-gray-600',
  5: 'from-yellow-500 to-amber-600',
}

function statLabel(stat: string): string {
  const map: Record<string, string> = {
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    speed: 'Speed',
    base_hp: 'HP',
    base_attack: 'Attack',
    base_defense: 'Defense',
    base_speed: 'Speed',
  }
  return map[stat] ?? stat
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* ------------------------------------------------------------------ */
/*  Bot selector (if user has multiple bots)                           */
/* ------------------------------------------------------------------ */

function BotSelector({
  bots,
  selectedId,
  onChange,
}: {
  bots: { id: string; name: string }[]
  selectedId: string
  onChange: (id: string) => void
}) {
  if (bots.length <= 1) return null
  return (
    <div className="flex items-center gap-3 mb-6">
      <label className="text-sm text-gray-400">Bot:</label>
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
      >
        {bots.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tier Card                                                          */
/* ------------------------------------------------------------------ */

function TierCard({
  tier,
  isCurrentTier,
  onStart,
  starting,
  isLast,
}: {
  tier: GauntletTier
  isCurrentTier: boolean
  onStart: () => void
  starting: boolean
  isLast: boolean
}) {
  const icon = tierIcons[tier.tier] ?? <Star className="w-5 h-5" />
  const glow = tierGlows[tier.tier] ?? 'from-purple-600 to-pink-600'

  return (
    <div className="flex gap-4">
      {/* Timeline column */}
      <div className="flex flex-col items-center">
        {/* Circle */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
            tier.completed
              ? 'border-green-500 bg-green-900/40 text-green-400'
              : tier.locked
              ? 'border-gray-700 bg-gray-800/40 text-gray-600'
              : `border-purple-500 bg-purple-900/40 text-purple-400 shadow-lg shadow-purple-500/20`
          }`}
        >
          {tier.completed ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : tier.locked ? (
            <Lock className="w-4 h-4" />
          ) : (
            icon
          )}
        </div>
        {/* Connector line */}
        {!isLast && (
          <div
            className={`w-0.5 flex-1 min-h-[2rem] ${
              tier.completed ? 'bg-green-700/50' : 'bg-gray-800'
            }`}
          />
        )}
      </div>

      {/* Card */}
      <div
        className={`flex-1 mb-4 rounded-xl border p-5 transition-all ${
          tier.completed
            ? 'bg-gray-900/60 border-green-800/40'
            : tier.locked
            ? 'bg-gray-900/30 border-gray-800/50 opacity-60'
            : isCurrentTier
            ? 'bg-gray-900 border-purple-700/60 shadow-lg shadow-purple-900/20'
            : 'bg-gray-900 border-gray-800'
        }`}
      >
        {/* Tier header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-600 uppercase tracking-wider font-semibold">
                Tier {tier.tier}
              </span>
              {tier.completed && (
                <span className="text-[10px] bg-green-900/40 text-green-400 border border-green-700/50 px-1.5 py-0.5 rounded uppercase font-semibold">
                  Completed
                </span>
              )}
              {isCurrentTier && !tier.completed && (
                <span className="text-[10px] bg-purple-900/40 text-purple-400 border border-purple-700/50 px-1.5 py-0.5 rounded uppercase font-semibold">
                  Current
                </span>
              )}
            </div>
            <h3
              className={`text-lg font-bold ${
                tier.locked ? 'text-gray-600' : 'text-gray-100'
              }`}
            >
              {tier.name}
            </h3>
          </div>
          {tier.completed && tier.completed_at && (
            <span className="text-[11px] text-gray-600">
              {formatDate(tier.completed_at)}
            </span>
          )}
        </div>

        {/* Description */}
        <p
          className={`text-sm mb-3 ${
            tier.locked ? 'text-gray-700' : 'text-gray-400'
          }`}
        >
          {tier.description}
        </p>

        {/* Win Condition */}
        <div
          className={`text-xs mb-4 px-3 py-2 rounded-lg border ${
            tier.locked
              ? 'bg-gray-800/20 border-gray-800/40 text-gray-600'
              : 'bg-gray-800/50 border-gray-700/50 text-gray-300'
          }`}
        >
          <span className="text-gray-500 font-medium">Win condition:</span>{' '}
          {tier.win_condition}
        </div>

        {/* Rewards */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className={`flex items-center gap-1.5 text-sm ${
              tier.locked ? 'text-gray-700' : 'text-yellow-400'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span className="font-medium">
              {formatCredits(tier.reward.credits)} AC
            </span>
          </div>
          {tier.reward.stat && (
            <div
              className={`flex items-center gap-1.5 text-sm ${
                tier.locked ? 'text-gray-700' : 'text-purple-400'
              }`}
            >
              <ChevronRight className="w-3 h-3" />
              <span className="font-medium">
                +{tier.reward.amount} {statLabel(tier.reward.stat)}
              </span>
            </div>
          )}
        </div>

        {/* Action button */}
        {isCurrentTier && !tier.completed && !tier.locked && (
          <button
            onClick={onStart}
            disabled={starting}
            className={`w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 bg-gradient-to-r ${glow} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition`}
          >
            {starting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Starting…
              </>
            ) : (
              <>
                <Swords className="w-4 h-4" />
                Start Challenge
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page Content                                                       */
/* ------------------------------------------------------------------ */

function GauntletContent() {
  const router = useRouter()
  const { bots } = useAuthStore()
  const [selectedBotId, setSelectedBotId] = useState<string>(
    bots[0]?.id ?? ''
  )
  const [data, setData] = useState<GauntletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  // Set initial bot when bots load
  useEffect(() => {
    if (bots.length > 0 && !selectedBotId) {
      setSelectedBotId(bots[0].id)
    }
  }, [bots, selectedBotId])

  // Fetch gauntlet progress
  useEffect(() => {
    if (!selectedBotId) return

    async function fetchGauntlet() {
      setLoading(true)
      try {
        const res = await api<GauntletData>(
          `/api/gauntlet?bot_id=${selectedBotId}`
        )
        setData(res)
      } catch (err: any) {
        setError(err.message ?? 'Failed to load gauntlet data')
      } finally {
        setLoading(false)
      }
    }
    fetchGauntlet()
  }, [selectedBotId])

  async function handleStart(tier: GauntletTier) {
    if (!selectedBotId) return

    setStarting(true)
    try {
      await apiPost('/api/pve/start', {
        bot_id: selectedBotId,
        ai_bot_id: tier.opponent,
      })
      router.push('/match')
    } catch (err: any) {
      setError(err.message ?? 'Failed to start gauntlet match')
      setStarting(false)
    }
  }

  // Find the current (first unlocked & incomplete) tier
  const currentTierNum =
    data?.tiers.find((t) => !t.completed && !t.locked)?.tier ?? -1

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">Loading gauntlet…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-yellow-400" />
          Training Gauntlet
        </h1>
        <p className="text-gray-400">
          Complete all five tiers to prove your worth and earn permanent stat
          upgrades.
        </p>
      </div>

      {/* Bot Selector */}
      <BotSelector
        bots={bots}
        selectedId={selectedBotId}
        onChange={setSelectedBotId}
      />

      {/* Progress bar */}
      {data && (
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Progress</span>
            <span>
              {data.total_completed}/{data.total_tiers} tiers
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-yellow-500 rounded-full transition-all duration-500"
              style={{
                width: `${(data.total_completed / data.total_tiers) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg border border-red-800 bg-red-900/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Timeline */}
      {data && (
        <div>
          {data.tiers.map((tier, i) => (
            <TierCard
              key={tier.tier}
              tier={tier}
              isCurrentTier={tier.tier === currentTierNum}
              onStart={() => handleStart(tier)}
              starting={starting}
              isLast={i === data.tiers.length - 1}
            />
          ))}
        </div>
      )}

      {/* All completed celebration */}
      {data && data.total_completed === data.total_tiers && (
        <div className="mt-8 text-center bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border border-yellow-700/40 rounded-xl p-8">
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-yellow-400 mb-2">
            Gauntlet Complete!
          </h2>
          <p className="text-sm text-gray-400">
            You have conquered all five tiers. You are a true Arena Champion.
          </p>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Export                                                              */
/* ------------------------------------------------------------------ */

export default function GauntletPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <GauntletContent />
      </div>
    </ProtectedRoute>
  )
}
