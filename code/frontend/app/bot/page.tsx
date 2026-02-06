'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { api, apiPatch } from '@/lib/api'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import {
  Bot,
  Pencil,
  Check,
  X,
  Sparkles,
  Quote,
  Save,
  RotateCcw,
} from 'lucide-react'

// Preset avatars players can pick from
const AVATAR_OPTIONS = [
  '⚔️', '🤖', '🦾', '🧠', '💀', '🔥', '⚡', '🛡️',
  '👾', '🎯', '💎', '🌟', '🐉', '🦅', '🐺', '🦇',
  '👁️', '🗡️', '🏴‍☠️', '🎭', '🌀', '💫', '🔮', '⚙️',
]

interface BotData {
  id: string
  name: string
  avatar: string
  tagline: string
  level: number
  xp: number
  base_hp: number
  base_attack: number
  base_defense: number
  base_speed: number
}

function StatDisplay({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-2.5">
      <span className="text-sm text-gray-400 flex items-center gap-2">
        <span>{icon}</span> {label}
      </span>
      <span className="text-sm font-mono font-semibold text-white">{value}</span>
    </div>
  )
}

function BotIdentityEditor({ bot, onSave }: { bot: BotData; onSave: (updated: BotData) => void }) {
  const [name, setName] = useState(bot.name)
  const [avatar, setAvatar] = useState(bot.avatar)
  const [tagline, setTagline] = useState(bot.tagline)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  const hasChanges = name !== bot.name || avatar !== bot.avatar || tagline !== bot.tagline

  async function handleSave() {
    if (!hasChanges) return
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const updates: Record<string, string> = {}
      if (name !== bot.name) updates.name = name
      if (avatar !== bot.avatar) updates.avatar = avatar
      if (tagline !== bot.tagline) updates.tagline = tagline

      const res = await apiPatch<{ bot: BotData }>(`/api/bots/${bot.id}`, updates)
      onSave({ ...bot, ...res.bot })
      setSuccess('Identity updated!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setName(bot.name)
    setAvatar(bot.avatar)
    setTagline(bot.tagline)
    setError('')
    setSuccess('')
  }

  return (
    <div className="space-y-6">
      {/* Avatar + Name header */}
      <div className="flex items-start gap-6">
        {/* Avatar picker */}
        <div className="relative">
          <button
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="w-24 h-24 rounded-2xl bg-gray-800 border-2 border-gray-700 hover:border-purple-500 transition flex items-center justify-center text-5xl relative group"
          >
            {avatar}
            <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <Pencil className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Avatar picker dropdown */}
          {showAvatarPicker && (
            <div className="absolute top-full left-0 mt-2 z-20 bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-2xl w-72">
              <div className="text-xs text-gray-500 mb-2 font-medium">Choose Avatar</div>
              <div className="grid grid-cols-8 gap-1">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setAvatar(emoji)
                      setShowAvatarPicker(false)
                    }}
                    className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition ${
                      avatar === emoji
                        ? 'bg-purple-600 ring-2 ring-purple-400'
                        : 'hover:bg-gray-800'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {/* Custom emoji input */}
              <div className="mt-2 pt-2 border-t border-gray-800">
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value.slice(0, 8))}
                  placeholder="Custom emoji..."
                  className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 text-white placeholder-gray-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Name + Level */}
        <div className="flex-1 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              Bot Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name your bot"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-lg font-semibold placeholder-gray-600"
              minLength={2}
              maxLength={30}
            />
            <p className="text-[10px] text-gray-600 mt-1">2-30 chars, letters, numbers, spaces, hyphens</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="px-2.5 py-1 bg-purple-900/30 text-purple-400 rounded-lg font-medium">
              Lv.{bot.level}
            </span>
            <span className="text-gray-500">{bot.xp} XP</span>
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
          <Quote className="w-3 h-3" />
          Battle Tagline
        </label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Shown to opponents before combat..."
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-600"
          maxLength={60}
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] text-gray-600">Opponents see this when they face you</p>
          <p className="text-[10px] text-gray-600">{tagline.length}/60</p>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-800/30 rounded-xl border border-gray-800 p-5">
        <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Match Preview</div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-3xl">
            {avatar}
          </div>
          <div>
            <div className="font-bold text-white text-lg">{name || 'Unnamed Bot'}</div>
            {tagline && (
              <div className="text-sm text-gray-400 italic">&ldquo;{tagline}&rdquo;</div>
            )}
            <div className="text-xs text-gray-600 mt-0.5">Lv.{bot.level}</div>
          </div>
        </div>
      </div>

      {/* Errors/Success */}
      {error && (
        <div className="bg-red-900/20 border border-red-800/30 text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900/20 border border-green-800/30 text-green-400 p-3 rounded-lg text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {success}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-semibold transition flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {hasChanges && (
          <button
            onClick={handleReset}
            className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 transition"
            title="Reset changes"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

function BotPageContent() {
  const { bots, setBots } = useAuthStore()
  const [botData, setBotData] = useState<BotData | null>(null)
  const [loading, setLoading] = useState(true)

  const currentBot = bots[0]

  useEffect(() => {
    async function fetchBot() {
      if (!currentBot?.id) return
      try {
        const res = await api<{ bot: BotData }>(`/api/bots/${currentBot.id}`)
        setBotData(res.bot)
      } catch (err) {
        console.error('Failed to fetch bot:', err)
        // Fallback to local data
        setBotData({
          id: currentBot.id,
          name: currentBot.name || 'My Bot',
          avatar: '⚔️',
          tagline: '',
          level: 1,
          xp: 0,
          base_hp: 100,
          base_attack: 15,
          base_defense: 10,
          base_speed: 10,
        })
      } finally {
        setLoading(false)
      }
    }
    fetchBot()
  }, [currentBot?.id])

  function handleSave(updated: BotData) {
    setBotData(updated)
    // Update global store
    if (bots[0]) {
      const updatedBots = [...bots]
      updatedBots[0] = { ...updatedBots[0], name: updated.name }
      setBots(updatedBots)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading bot...</div>
      </div>
    )
  }

  if (!botData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">🤖</div>
          <p className="text-gray-400">No bot found. Register one first!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Bot className="w-6 h-6 text-purple-400" />
        <h1 className="text-2xl font-bold">Bot Identity</h1>
      </div>

      <div className="grid gap-6">
        {/* Identity Editor */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <BotIdentityEditor bot={botData} onSave={handleSave} />
        </div>

        {/* Stats (read-only) */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Base Stats
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatDisplay label="HP" value={botData.base_hp} icon="❤️" />
            <StatDisplay label="Attack" value={botData.base_attack} icon="⚔️" />
            <StatDisplay label="Defense" value={botData.base_defense} icon="🛡️" />
            <StatDisplay label="Speed" value={botData.base_speed} icon="⚡" />
          </div>
          <p className="text-[10px] text-gray-600 mt-3 text-center">
            Stats are earned through gameplay — Gauntlet rewards and leveling up
          </p>
        </div>
      </div>
    </div>
  )
}

export default function BotPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <BotPageContent />
      </div>
    </ProtectedRoute>
  )
}
