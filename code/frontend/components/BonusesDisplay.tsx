'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Trophy, Clock, Brain, TrendingUp, Shield, Target, Shuffle, Award } from 'lucide-react'

interface BonusData {
  bot_id: string
  bot_age_days: number
  matches_analyzed: number
  age: {
    hp: number
    attack: number
    defense: number
    speed: number
    title: string | null
  }
  dqs: {
    score: number
    tier: 'bronze' | 'silver' | 'gold' | 'diamond'
    bonuses: { hp: number; attack: number; defense: number; speed: number }
    title: string | null
    breakdown: {
      defensive_play: number
      kill_targeting: number
      counter_rate: number
      action_entropy: number
      win_rate_factor: number
    }
  }
  total: { hp: number; attack: number; defense: number; speed: number }
  titles: string[]
}

const TIER_COLORS = {
  bronze: 'text-amber-600 bg-amber-900/20 border-amber-800/30',
  silver: 'text-gray-300 bg-gray-700/20 border-gray-600/30',
  gold: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/30',
  diamond: 'text-cyan-400 bg-cyan-900/20 border-cyan-800/30',
}

const TIER_ICONS = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  diamond: '💎',
}

function DQSBar({ label, value, maxValue, icon }: { label: string; value: number; maxValue: number; icon: React.ReactNode }) {
  const pct = Math.min(100, (value / maxValue) * 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400 flex items-center gap-1.5">{icon} {label}</span>
        <span className="text-gray-300 font-mono">{value}/{maxValue}</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function BonusesDisplay({ botId }: { botId: string }) {
  const [data, setData] = useState<BonusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api<BonusData>(`/api/bots/${botId}/bonuses`)
        setData(res)
      } catch (err) {
        setError('Failed to load bonuses')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [botId])

  if (loading) return <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 animate-pulse h-48" />
  if (error || !data) return null

  const hasAnyBonus = data.total.hp > 0 || data.total.attack > 0 || data.total.defense > 0 || data.total.speed > 0

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <div>
              <h2 className="text-sm font-semibold text-white">Skill Bonuses</h2>
              <p className="text-xs text-gray-500">Earned through gameplay, not purchases</p>
            </div>
          </div>
          {data.titles.length > 0 && (
            <div className="flex gap-2">
              {data.titles.map(title => (
                <span key={title} className="text-xs px-2.5 py-1 bg-purple-900/30 text-purple-400 rounded-full font-medium flex items-center gap-1">
                  <Award className="w-3 h-3" /> {title}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* DQS Score */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-3 h-3" /> Decision Quality Score
            </span>
            <span className={`text-sm font-bold px-3 py-1 rounded-full border ${TIER_COLORS[data.dqs.tier]}`}>
              {TIER_ICONS[data.dqs.tier]} {data.dqs.tier.toUpperCase()} — {data.dqs.score}/100
            </span>
          </div>

          <div className="space-y-2.5">
            <DQSBar label="Defensive Play" value={data.dqs.breakdown.defensive_play} maxValue={20} icon={<Shield className="w-3 h-3" />} />
            <DQSBar label="Kill Targeting" value={data.dqs.breakdown.kill_targeting} maxValue={20} icon={<Target className="w-3 h-3" />} />
            <DQSBar label="Counter Rate" value={data.dqs.breakdown.counter_rate} maxValue={20} icon={<TrendingUp className="w-3 h-3" />} />
            <DQSBar label="Action Variety" value={data.dqs.breakdown.action_entropy} maxValue={20} icon={<Shuffle className="w-3 h-3" />} />
            <DQSBar label="Win Rate" value={data.dqs.breakdown.win_rate_factor} maxValue={20} icon={<Trophy className="w-3 h-3" />} />
          </div>

          <p className="text-[10px] text-gray-600 mt-2">Based on {data.matches_analyzed} recent matches</p>
        </div>

        {/* Bot Age */}
        <div className="flex items-center justify-between bg-gray-800/30 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <span className="text-sm text-gray-300">Bot Age: <span className="font-mono font-semibold">{data.bot_age_days} days</span></span>
              {data.age.title && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full">{data.age.title}</span>
              )}
            </div>
          </div>
          {(data.age.hp > 0 || data.age.defense > 0) && (
            <span className="text-xs text-green-400 font-mono">
              +{data.age.hp} HP {data.age.defense > 0 ? `+${data.age.defense} DEF` : ''}
            </span>
          )}
        </div>

        {/* Total Bonuses */}
        {hasAnyBonus && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Total Stat Bonuses
            </label>
            <div className="grid grid-cols-4 gap-2">
              {data.total.hp > 0 && (
                <div className="bg-green-900/20 border border-green-800/30 rounded-lg px-3 py-2 text-center">
                  <div className="text-green-400 font-mono font-bold">+{data.total.hp}</div>
                  <div className="text-[10px] text-green-600">HP</div>
                </div>
              )}
              {data.total.attack > 0 && (
                <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2 text-center">
                  <div className="text-red-400 font-mono font-bold">+{data.total.attack}</div>
                  <div className="text-[10px] text-red-600">ATK</div>
                </div>
              )}
              {data.total.defense > 0 && (
                <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg px-3 py-2 text-center">
                  <div className="text-blue-400 font-mono font-bold">+{data.total.defense}</div>
                  <div className="text-[10px] text-blue-600">DEF</div>
                </div>
              )}
              {data.total.speed > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg px-3 py-2 text-center">
                  <div className="text-yellow-400 font-mono font-bold">+{data.total.speed}</div>
                  <div className="text-[10px] text-yellow-600">SPD</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
