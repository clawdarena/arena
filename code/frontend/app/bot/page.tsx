'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { api, apiPost, apiPatch } from '@/lib/api'
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
  Swords,
  Lock,
  Zap,
  Clock,
} from 'lucide-react'
import { ALL_SKILLS, RARITY_COLORS, SKILL_ENERGY } from '@/lib/constants'
import { PageTransition } from '@/components/PageTransition'
import { StrategyEditor } from '@/components/StrategyEditor'
import { BonusesDisplay } from '@/components/BonusesDisplay'

// Preset avatars players can pick from
const AVATAR_OPTIONS = [
  '⚔️', '🤖', '🦾', '🧠', '💀', '🔥', '⚡', '🛡️',
  '👾', '🎯', '💎', '🌟', '🐉', '🦅', '🐺', '🦇',
  '👁️', '🗡️', '🏴‍☠️', '🎭', '🌀', '💫', '🔮', '⚙️',
]

interface SkillSlot {
  slot: number
  skill_id: string
  skill: { id: string; name: string; description: string; rarity: string; price: number }
}

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
  skills?: SkillSlot[]
}

interface OwnedSkill {
  skill_id: string
  skill: { id: string; name: string; description: string; rarity: string; price: number }
}

function StatDisplay({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="flex items-center justify-between bg-[var(--bg-raised)] rounded-sm px-4 py-2.5">
      <span className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
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
            className="w-24 h-24 rounded-sm bg-[var(--bg-raised)] border-2 border-[var(--border-mid)] hover:border-[var(--neon-cyan)] transition flex items-center justify-center text-5xl relative group"
          >
            {avatar}
            <div className="absolute inset-0 bg-black/50 rounded-sm opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <Pencil className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Avatar picker dropdown */}
          {showAvatarPicker && (
            <div className="absolute top-full left-0 mt-2 z-20 bg-[var(--bg-panel)] border border-[var(--border-mid)] rounded-sm p-3 shadow-2xl w-72">
              <div className="text-xs text-[var(--text-muted)] mb-2 font-medium">Choose Avatar</div>
              <div className="grid grid-cols-8 gap-1">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setAvatar(emoji)
                      setShowAvatarPicker(false)
                    }}
                    className={`w-8 h-8 rounded-sm text-lg flex items-center justify-center transition ${
                      avatar === emoji
                        ? 'bg-[var(--neon-cyan)] ring-2 ring-[var(--neon-cyan)]'
                        : 'hover:bg-[var(--bg-raised)]'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {/* Custom emoji input */}
              <div className="mt-2 pt-2 border-t border-[var(--border-dim)]">
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value.slice(0, 8))}
                  placeholder="Custom emoji..."
                  className="w-full px-3 py-1.5 bg-[var(--bg-raised)] border border-[var(--border-mid)] rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)] text-white placeholder-[var(--text-muted)]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Name + Level */}
        <div className="flex-1 space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
              Bot Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name your bot"
              className="w-full px-4 py-2.5 bg-[var(--bg-raised)] border border-[var(--border-mid)] rounded-sm focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)] focus:border-[var(--neon-cyan)] text-white text-lg font-semibold placeholder-[var(--text-muted)]"
              minLength={2}
              maxLength={30}
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">2-30 chars, letters, numbers, spaces, hyphens</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="px-2.5 py-1 bg-[var(--neon-cyan-dim)] text-[var(--neon-cyan)] rounded-sm font-medium">
              Lv.{bot.level}
            </span>
            <span className="text-[var(--text-muted)]">{bot.xp} XP</span>
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div>
        <label className="text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
          <Quote className="w-3 h-3" />
          Battle Tagline
        </label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Shown to opponents before combat..."
          className="w-full px-4 py-2.5 bg-[var(--bg-raised)] border border-[var(--border-mid)] rounded-sm focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)] focus:border-[var(--neon-cyan)] text-white placeholder-[var(--text-muted)]"
          maxLength={60}
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] text-[var(--text-muted)]">Opponents see this when they face you</p>
          <p className="text-[10px] text-[var(--text-muted)]">{tagline.length}/60</p>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-[var(--bg-raised)] rounded-sm border border-[var(--border-dim)] p-5">
        <div className="text-xs text-[var(--text-muted)] mb-3 uppercase tracking-wider">Match Preview</div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-sm bg-[var(--bg-raised)] border border-[var(--border-mid)] flex items-center justify-center text-3xl">
            {avatar}
          </div>
          <div>
            <div className="font-bold text-white text-lg">{name || 'Unnamed Bot'}</div>
            {tagline && (
              <div className="text-sm text-[var(--text-secondary)] italic">&ldquo;{tagline}&rdquo;</div>
            )}
            <div className="text-xs text-[var(--text-muted)] mt-0.5">Lv.{bot.level}</div>
          </div>
        </div>
      </div>

      {/* Errors/Success */}
      {error && (
        <div className="bg-red-900/20 border border-red-800/30 text-red-400 p-3 rounded-sm text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900/20 border border-green-800/30 text-green-400 p-3 rounded-sm text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {success}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="flex-1 py-3 bg-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)] disabled:opacity-40 disabled:cursor-not-allowed rounded-sm font-semibold transition flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {hasChanges && (
          <button
            onClick={handleReset}
            className="px-4 py-3 bg-[var(--bg-raised)] hover:bg-[var(--bg-hover)] rounded-sm text-[var(--text-secondary)] transition"
            title="Reset changes"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

const SKILL_EMOJI: Record<string, string> = {
  firewall: '🛡️', iron_fortress: '🏰', mirror_coat: '🪞', rollback: '💚',
  power_strike: '⚔️', reasoning_burst: '⚡', spawn_attack: '👻', berserker_rush: '😤',
  sleep_bomb: '💤', emp_pulse: '🔋', time_bomb: '💣', overclock: '⏫',
  scan: '🔍', prompt_injection: '💉', memory_bomb: '🧠', virus: '🦠',
  agent_overflow: '🤖',
}

function SkillLoadout({ bot, onUpdate }: { bot: BotData; onUpdate: (bot: BotData) => void }) {
  const [ownedSkills, setOwnedSkills] = useState<OwnedSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [swapSlot, setSwapSlot] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchSkills() {
      try {
        const res = await api<{ skills: OwnedSkill[] }>('/api/skills/owned')
        setOwnedSkills(res.skills || [])
      } catch (err) {
        console.error('Failed to fetch owned skills:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSkills()
  }, [])

  const equippedIds = new Set((bot.skills || []).map(s => s.skill_id))

  async function equipSkill(skillId: string, slot: number) {
    setSaving(true)
    try {
      await apiPost('/api/bots/equip-skill', { bot_id: bot.id, skill_id: skillId, slot })
      // Refetch bot data
      const res = await api<{ bot: BotData }>(`/api/bots/${bot.id}`)
      onUpdate(res.bot)
      setSwapSlot(null)
    } catch (err) {
      console.error('Equip failed:', err)
    } finally {
      setSaving(false)
    }
  }

  async function unequipSkill(slot: number) {
    setSaving(true)
    try {
      await apiPost('/api/bots/unequip-skill', { bot_id: bot.id, slot })
      const res = await api<{ bot: BotData }>(`/api/bots/${bot.id}`)
      onUpdate(res.bot)
    } catch (err) {
      console.error('Unequip failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const slots = [1, 2, 3, 4]
  const availableSkills = ownedSkills.filter(s => !equippedIds.has(s.skill_id))

  return (
    <div className="bg-[var(--bg-panel)] rounded-sm border border-[var(--border-dim)] p-6">
      <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
        <Swords className="w-4 h-4" />
        Skill Loadout
      </h2>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Equip 4 skills for combat. Basic Attack is always available.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {slots.map(slot => {
          const equipped = (bot.skills || []).find(s => s.slot === slot)
          const skillDef = equipped ? ALL_SKILLS[equipped.skill_id as keyof typeof ALL_SKILLS] : null
          const rarity = skillDef?.rarity || 'common'
          const colors = RARITY_COLORS[rarity] || RARITY_COLORS.common
          const energy = equipped ? SKILL_ENERGY[equipped.skill_id] || 0 : 0

          if (swapSlot === slot) {
            // Show skill picker
            return (
              <div key={slot} className="col-span-2 bg-[var(--bg-raised)] rounded-sm border border-[var(--neon-cyan)] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[var(--neon-cyan)] font-medium">Select skill for Slot {slot}</span>
                  <button onClick={() => setSwapSlot(null)} className="text-[var(--text-muted)] hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {loading ? (
                  <div className="text-xs text-[var(--text-muted)]">Loading...</div>
                ) : availableSkills.length === 0 ? (
                  <div className="text-xs text-[var(--text-muted)]">No unequipped skills available</div>
                ) : (
                  <div className="grid gap-1.5 max-h-48 overflow-y-auto">
                    {availableSkills.map(owned => {
                      const def = ALL_SKILLS[owned.skill_id as keyof typeof ALL_SKILLS]
                      const r = def?.rarity || 'common'
                      const c = RARITY_COLORS[r] || RARITY_COLORS.common
                      const e = SKILL_ENERGY[owned.skill_id] || 0
                      return (
                        <button
                          key={owned.skill_id}
                          onClick={() => equipSkill(owned.skill_id, slot)}
                          disabled={saving}
                          className={`flex items-center gap-2 px-3 py-2 rounded-sm border ${c.border} ${c.bg} hover:brightness-125 transition text-left disabled:opacity-50`}
                        >
                          <span className="text-lg">{SKILL_EMOJI[owned.skill_id] || '❓'}</span>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${c.text}`}>{def?.name || owned.skill_id}</div>
                            <div className="text-[10px] text-[var(--text-muted)] truncate">{def?.description || ''}</div>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                            <Zap className="w-3 h-3" />{e}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <div
              key={slot}
              className={`relative rounded-sm border p-3 transition ${
                equipped
                  ? `${colors.border} ${colors.bg} ${colors.glow}`
                  : 'border-dashed border-[var(--border-dim)] bg-[var(--bg-raised)]'
              }`}
            >
              <div className="text-[10px] text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Slot {slot}</div>
              {equipped && skillDef ? (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{SKILL_EMOJI[equipped.skill_id] || '❓'}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${colors.text}`}>{skillDef.name}</div>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" />{energy}</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{skillDef.cooldown}r</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] leading-tight mb-2">{skillDef.description}</p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setSwapSlot(slot)}
                      className="flex-1 text-[10px] py-1 rounded-sm bg-[var(--bg-raised)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition"
                    >
                      Swap
                    </button>
                    <button
                      onClick={() => unequipSkill(slot)}
                      disabled={saving}
                      className="text-[10px] px-2 py-1 rounded-sm bg-red-900/20 hover:bg-red-900/40 text-red-400 transition disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setSwapSlot(slot)}
                  className="w-full py-4 text-center text-[var(--text-muted)] hover:text-[var(--neon-cyan)] transition"
                >
                  <div className="text-2xl mb-1 opacity-40">+</div>
                  <div className="text-[10px]">Equip Skill</div>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Basic attack always available note */}
      <div className="flex items-center gap-2 p-2.5 bg-[var(--bg-raised)] rounded-sm border border-[var(--border-dim)]">
        <span className="text-lg">👊</span>
        <div className="flex-1">
          <div className="text-xs font-medium text-[var(--text-secondary)]">Basic Attack</div>
          <div className="text-[10px] text-[var(--text-muted)]">Always available • 0 energy • 8-12 damage</div>
        </div>
        <span className="text-[10px] text-green-400 font-medium">FREE</span>
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
        <div className="text-[var(--text-muted)]">Loading bot...</div>
      </div>
    )
  }

  if (!botData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">🤖</div>
          <p className="text-[var(--text-secondary)]">No bot found. Register one first!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Bot className="w-6 h-6 text-[var(--neon-cyan)]" />
        <h1 className="text-2xl font-bold">Bot Identity</h1>
      </div>

      <div className="grid gap-6">
        {/* Identity Editor */}
        <div className="bg-[var(--bg-panel)] rounded-sm border border-[var(--border-dim)] p-6">
          <BotIdentityEditor bot={botData} onSave={handleSave} />
        </div>

        {/* Stats (read-only) */}
        <div className="bg-[var(--bg-panel)] rounded-sm border border-[var(--border-dim)] p-6">
          <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Base Stats
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatDisplay label="HP" value={botData.base_hp} icon="❤️" />
            <StatDisplay label="Attack" value={botData.base_attack} icon="⚔️" />
            <StatDisplay label="Defense" value={botData.base_defense} icon="🛡️" />
            <StatDisplay label="Speed" value={botData.base_speed} icon="⚡" />
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-3 text-center">
            Stats are earned through gameplay — Gauntlet rewards and leveling up
          </p>
        </div>

        {/* Skill Loadout (4 slots) */}
        <SkillLoadout bot={botData} onUpdate={(updated) => setBotData(updated)} />

        {/* AI Strategy Editor */}
        <StrategyEditor botId={botData.id} />

        {/* Skill Bonuses (DQS + Age) */}
        <BonusesDisplay botId={botData.id} />
      </div>
    </div>
  )
}

export default function BotPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-void)] arena-grid-bg">
        <Navbar />
        <BotPageContent />
      </div>
    </ProtectedRoute>
  )
}
