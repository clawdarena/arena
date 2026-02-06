'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { api, apiPost } from '@/lib/api'
import { connectSocket } from '@/lib/socket'
import { useMatchStore } from '@/lib/store'
import { formatCredits } from '@/lib/utils'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import {
  Swords,
  Shield,
  Zap,
  Heart,
  Trophy,
  Star,
  Bot as BotIcon,
  Crosshair,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PveBot {
  id: string
  name: string
  difficulty: 'tutorial' | 'easy' | 'medium' | 'hard' | 'expert'
  hp: number
  attack: number
  defense: number
  speed: number
  estimated_elo: number
  reward: number
  description: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const difficultyConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  tutorial: {
    label: 'Tutorial',
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/30',
    border: 'border-emerald-700/50',
  },
  easy: {
    label: 'Easy',
    color: 'text-green-400',
    bg: 'bg-green-900/30',
    border: 'border-green-700/50',
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-400',
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-700/50',
  },
  hard: {
    label: 'Hard',
    color: 'text-orange-400',
    bg: 'bg-orange-900/30',
    border: 'border-orange-700/50',
  },
  expert: {
    label: 'Expert',
    color: 'text-red-400',
    bg: 'bg-red-900/30',
    border: 'border-red-700/50',
  },
}

/* ------------------------------------------------------------------ */
/*  Stat mini-bar                                                      */
/* ------------------------------------------------------------------ */

function MiniStat({
  icon,
  label,
  value,
  max,
  barColor,
}: {
  icon: React.ReactNode
  label: string
  value: number
  max: number
  barColor: string
}) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 flex justify-center">{icon}</div>
      <span className="text-[11px] text-[var(--text-muted)] w-7">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--bg-raised)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-[var(--text-secondary)] w-7 text-right">
        {value}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Bot Card                                                           */
/* ------------------------------------------------------------------ */

function PveBotCard({
  bot,
  onFight,
  fighting,
}: {
  bot: PveBot
  onFight: (aiBot: PveBot) => void
  fighting: boolean
}) {
  const diff = difficultyConfig[bot.difficulty] ?? difficultyConfig.easy

  return (
    <div className="bg-[var(--bg-panel)] rounded-sm border border-[var(--border-dim)] p-5 flex flex-col hover:border-purple-700/40 transition group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[var(--bg-raised)] rounded-sm flex items-center justify-center text-xl">
            <BotIcon className="w-6 h-6 text-[var(--neon-cyan)]" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-100">{bot.name}</h3>
            <span
              className={`text-[11px] font-semibold uppercase tracking-wide ${diff.color} ${diff.bg} ${diff.border} border px-1.5 py-0.5 rounded`}
            >
              {diff.label}
            </span>
          </div>
        </div>

        {/* ELO badge */}
        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <Trophy className="w-3.5 h-3.5" />
          <span className="font-mono">{bot.estimated_elo}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
        {bot.description}
      </p>

      {/* Stats */}
      <div className="space-y-2 mb-5">
        <MiniStat
          icon={<Heart className="w-3 h-3 text-red-400" />}
          label="HP"
          value={bot.hp}
          max={250}
          barColor="bg-red-500"
        />
        <MiniStat
          icon={<Swords className="w-3 h-3 text-orange-400" />}
          label="ATK"
          value={bot.attack}
          max={50}
          barColor="bg-orange-500"
        />
        <MiniStat
          icon={<Shield className="w-3 h-3 text-blue-400" />}
          label="DEF"
          value={bot.defense}
          max={40}
          barColor="bg-blue-500"
        />
        <MiniStat
          icon={<Zap className="w-3 h-3 text-green-400" />}
          label="SPD"
          value={bot.speed}
          max={30}
          barColor="bg-green-500"
        />
      </div>

      {/* Reward + Fight */}
      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-yellow-400">
            {formatCredits(bot.reward)} AC
          </span>
        </div>
        <button
          onClick={() => onFight(bot)}
          disabled={fighting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {fighting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Starting…
            </>
          ) : (
            <>
              <Crosshair className="w-4 h-4" />
              Fight
            </>
          )}
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page Content                                                       */
/* ------------------------------------------------------------------ */

function PveContent() {
  const router = useRouter()
  const { bots } = useAuthStore()
  const [pveBots, setPveBots] = useState<PveBot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fightingId, setFightingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBots() {
      try {
        const data = await api<{ bots: PveBot[] }>('/api/pve/bots')
        setPveBots(data.bots)
      } catch (err: any) {
        setError(err.message ?? 'Failed to load PvE bots')
      } finally {
        setLoading(false)
      }
    }
    fetchBots()
  }, [])

  async function handleFight(aiBot: PveBot) {
    const userBot = bots[0]
    if (!userBot) {
      setError('You need a bot first! Visit your dashboard.')
      return
    }

    setFightingId(aiBot.id)
    try {
      const socket = connectSocket()

      // Listen for match_found from PvE start
      socket.once('match_found', (data: any) => {
        useMatchStore.getState().setMatchData(data)
        router.push('/match')
      })

      socket.once('error', (err: any) => {
        setError(err.message ?? 'Failed to start PvE match')
        setFightingId(null)
      })

      // Start PvE via WebSocket
      socket.emit('pve_start', {
        bot_id: userBot.id,
        ai_bot_id: aiBot.id,
      })
    } catch (err: any) {
      setError(err.message ?? 'Failed to start PvE match')
      setFightingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--text-secondary)] text-sm">Loading opponents…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <Crosshair className="w-8 h-8 text-[var(--neon-cyan)]" />
          PvE Arena
        </h1>
        <p className="text-[var(--text-secondary)]">
          Battle AI opponents to earn credits and sharpen your skills.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-sm border border-red-800 bg-red-900/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Bot Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pveBots.map((bot) => (
          <PveBotCard
            key={bot.id}
            bot={bot}
            onFight={handleFight}
            fighting={fightingId === bot.id}
          />
        ))}
      </div>

      {pveBots.length === 0 && !error && (
        <div className="text-center py-16 text-[var(--text-muted)]">
          No PvE opponents available right now.
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Export                                                              */
/* ------------------------------------------------------------------ */

export default function PvePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-void)]">
        <Navbar />
        <PveContent />
      </div>
    </ProtectedRoute>
  )
}
