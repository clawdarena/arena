'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import {
  ALL_SKILLS,
  SKILL_LIST,
  RARITY_COLORS,
} from '@/lib/constants'
import { api } from '@/lib/api'
import { formatCredits } from '@/lib/utils'
import type { Skill, SkillId, ShopItem } from '../../../shared/types'
import {
  ShoppingCart,
  Sparkles,
  Timer,
  Target,
  CircleDot,
  Check,
  Package,
  Swords,
  Shield,
  Zap,
  Heart,
  Lock,
} from 'lucide-react'

type ShopTab = 'skills' | 'items'

function SkillCard({
  skill,
  owned,
  equipped,
  onPurchase,
  onEquip,
  onUnequip,
  canAfford,
}: {
  skill: Skill
  owned: boolean
  equipped: boolean
  onPurchase: () => void
  onEquip: () => void
  onUnequip: () => void
  canAfford: boolean
}) {
  const rarity = RARITY_COLORS[skill.rarity] || RARITY_COLORS.common
  const isStarter = skill.price === 0

  return (
    <div className={`relative panel p-4 transition-all hover:border-[var(--border-bright)] group ${rarity.glow ? `shadow-lg ${rarity.glow}` : ''}`}>
      {/* Rarity badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`arena-subtitle text-[9px] ${rarity.text}`}>
          {skill.rarity.toUpperCase()}
        </span>
        {owned && (
          <span className="flex items-center gap-1 text-[10px] text-[var(--neon-green)] font-mono font-bold">
            <Check className="w-3 h-3" /> OWNED
          </span>
        )}
      </div>

      {/* Skill info */}
      <div className="mb-3">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1 font-body">{skill.name}</h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{skill.description}</p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-3 text-[10px] text-[var(--text-muted)] font-mono">
        <span className="flex items-center gap-1">
          <Timer className="w-3 h-3" />
          {skill.cooldown}r
        </span>
        <span className="flex items-center gap-1">
          <Target className="w-3 h-3" />
          {skill.target === 'self' ? 'Self' : 'Enemy'}
        </span>
      </div>

      {/* Action button */}
      {owned ? (
        equipped ? (
          <button
            onClick={onUnequip}
            className="w-full py-2 rounded-sm text-xs font-mono font-bold bg-[var(--bg-raised)] border border-[var(--border-mid)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition"
          >
            UNEQUIP
          </button>
        ) : (
          <button
            onClick={onEquip}
            className="btn-secondary w-full py-2 text-xs"
          >
            EQUIP
          </button>
        )
      ) : isStarter ? (
        <div className="w-full py-2 rounded-sm text-xs font-mono font-bold bg-[var(--neon-green-dim)] border border-[var(--neon-green)] text-[var(--neon-green)] text-center">
          FREE · STARTER
        </div>
      ) : (
        <button
          onClick={onPurchase}
          disabled={!canAfford}
          className={`w-full py-2 rounded-sm text-xs font-mono font-bold transition ${
            canAfford
              ? 'bg-[var(--neon-amber)] text-[var(--bg-void)] hover:shadow-lg hover:shadow-[var(--neon-amber-dim)]'
              : 'bg-[var(--bg-raised)] text-[var(--text-muted)] cursor-not-allowed'
          }`}
        >
          {canAfford ? `${skill.price} CR` : (
            <span className="flex items-center gap-1 justify-center">
              <Lock className="w-3 h-3" /> {skill.price} CR
            </span>
          )}
        </button>
      )}
    </div>
  )
}

function ItemCard({
  item,
  onPurchase,
  canAfford,
}: {
  item: ShopItem
  onPurchase: () => void
  canAfford: boolean
}) {
  const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.common
  const hasBonuses = item.hp_bonus > 0 || item.attack_bonus > 0 || item.defense_bonus > 0 || item.speed_bonus > 0

  const categoryIcons: Record<string, string> = {
    skin: '🎨',
    accessory: '⚙️',
    stat_boost: '📈',
    emote: '😎',
    effect: '✨',
  }

  return (
    <div className={`relative panel p-4 transition-all hover:border-[var(--border-bright)] ${rarity.glow ? `shadow-lg ${rarity.glow}` : ''}`}>
      {/* Limited badge */}
      {item.limited_edition && (
        <div className="absolute -top-1.5 -right-1.5 bg-[var(--neon-red)] text-white arena-subtitle text-[8px] px-2 py-0.5">
          LIMITED
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <span className={`arena-subtitle text-[9px] ${rarity.text}`}>
          {item.rarity.toUpperCase()}
        </span>
        <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">{categoryIcons[item.category]} {item.category}</span>
      </div>

      <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1 font-body">{item.name}</h3>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">{item.description}</p>

      {/* Stat bonuses */}
      {hasBonuses && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {item.hp_bonus > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-[var(--neon-red)] bg-[var(--neon-red-dim)] px-1.5 py-0.5 rounded-sm">
              <Heart className="w-2.5 h-2.5" /> +{item.hp_bonus}
            </span>
          )}
          {item.attack_bonus > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-[var(--neon-amber)] bg-[var(--neon-amber-dim)] px-1.5 py-0.5 rounded-sm">
              <Swords className="w-2.5 h-2.5" /> +{item.attack_bonus}
            </span>
          )}
          {item.defense_bonus > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-[var(--neon-cyan)] bg-[var(--neon-cyan-dim)] px-1.5 py-0.5 rounded-sm">
              <Shield className="w-2.5 h-2.5" /> +{item.defense_bonus}
            </span>
          )}
          {item.speed_bonus > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-[var(--neon-green)] bg-[var(--neon-green-dim)] px-1.5 py-0.5 rounded-sm">
              <Zap className="w-2.5 h-2.5" /> +{item.speed_bonus}
            </span>
          )}
        </div>
      )}

      {item.limited_edition && item.stock_remaining !== null && (
        <div className="text-[10px] text-[var(--neon-red)] font-mono mb-2">
          ⚠ {item.stock_remaining} remaining
        </div>
      )}

      <button
        onClick={onPurchase}
        disabled={!canAfford}
        className={`w-full py-2 rounded-sm text-xs font-mono font-bold transition ${
          canAfford
            ? 'bg-[var(--neon-amber)] text-[var(--bg-void)] hover:shadow-lg hover:shadow-[var(--neon-amber-dim)]'
            : 'bg-[var(--bg-raised)] text-[var(--text-muted)] cursor-not-allowed'
        }`}
      >
        {canAfford ? `${item.price} CR` : (
          <span className="flex items-center gap-1 justify-center">
            <Lock className="w-3 h-3" /> {item.price} CR
          </span>
        )}
      </button>
    </div>
  )
}

function ShopContent() {
  const { user, bots, setUser, setBots, setToken } = useAuthStore()
  const [tab, setTab] = useState<ShopTab>('skills')
  const [ownedSkills, setOwnedSkills] = useState<Set<string>>(new Set())
  const [equippedSkills, setEquippedSkills] = useState<Set<string>>(new Set())
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const me = await api<any>('/api/auth/me')
        setUser({
          id: me.id, username: me.username, credits: me.credits,
          current_elo: me.current_elo, peak_elo: me.peak_elo,
          total_matches: me.total_matches, wins: me.wins, losses: me.losses,
          created_at: me.created_at,
        })
        if (me.bots?.length) {
          setBots(me.bots)
          const bot = me.bots[0]
          if (bot.skills) {
            setEquippedSkills(new Set(bot.skills.map((s: any) => s.skill_id)))
          }
        }

        try {
          const owned = await api<{ skills: any[] }>('/api/skills/owned')
          setOwnedSkills(new Set(owned.skills.map((s: any) => s.skill_id || s.id)))
        } catch { /* starter skills fallback */ }

        try {
          const items = await api<{ items: ShopItem[] }>('/api/shop/items')
          setShopItems(items.items || [])
        } catch { /* no items */ }
      } catch (err) {
        console.error('Failed to fetch shop data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [setUser, setBots, setToken])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-3 text-[var(--text-muted)]">
        <div className="w-4 h-4 border-2 border-[var(--neon-cyan)] border-t-transparent rounded-full animate-spin" />
        <span className="arena-subtitle text-xs">LOADING INVENTORY</span>
      </div>
    </div>
  )

  if (!user) return null

  async function handlePurchaseSkill(skillId: string) {
    const skill = ALL_SKILLS[skillId as SkillId]
    if (!skill || user!.credits < skill.price) return
    try {
      await api('/api/skills/purchase', { method: 'POST', body: JSON.stringify({ skill_id: skillId }) })
      setOwnedSkills((prev) => new Set([...prev, skillId]))
      setUser({ ...user!, credits: user!.credits - skill.price })
    } catch (err: any) {
      alert(err.message || 'Purchase failed')
    }
  }

  async function handleEquipSkill(skillId: string) {
    if (equippedSkills.size >= 2) {
      alert('Max 2 skills equipped. Unequip one first.')
      return
    }
    const slot = equippedSkills.size + 1
    const botId = bots[0]?.id
    if (!botId) return

    try {
      await api('/api/bots/equip-skill', {
        method: 'POST',
        body: JSON.stringify({ bot_id: botId, skill_id: skillId, slot }),
      })
      setEquippedSkills((prev) => new Set([...prev, skillId]))
    } catch (err: any) {
      alert(err.message || 'Failed to equip skill')
    }
  }

  async function handleUnequipSkill(skillId: string) {
    const botId = bots[0]?.id
    if (!botId) return

    // Find the slot this skill is in
    const bot = bots[0]
    const equippedSlot = bot?.skills?.find((s: any) => s.skill_id === skillId)?.slot
    if (!equippedSlot) {
      // Fallback: try both slots
      for (const slot of [1, 2]) {
        try {
          await api('/api/bots/unequip-skill', {
            method: 'POST',
            body: JSON.stringify({ bot_id: botId, slot }),
          })
        } catch { /* ignore */ }
      }
    } else {
      try {
        await api('/api/bots/unequip-skill', {
          method: 'POST',
          body: JSON.stringify({ bot_id: botId, slot: equippedSlot }),
        })
      } catch (err: any) {
        alert(err.message || 'Failed to unequip skill')
        return
      }
    }

    setEquippedSkills((prev) => {
      const next = new Set(prev)
      next.delete(skillId)
      return next
    })
  }

  const rarityOrder: Record<string, number> = { legendary: 0, epic: 1, rare: 2, common: 3 }
  const sortedSkills = [...SKILL_LIST].sort((a, b) => {
    const aOwned = ownedSkills.has(a.id) ? 0 : 1
    const bOwned = ownedSkills.has(b.id) ? 0 : 1
    if (aOwned !== bOwned) return aOwned - bOwned
    return (rarityOrder[a.rarity] ?? 99) - (rarityOrder[b.rarity] ?? 99)
  })

  const sortedItems = [...shopItems].sort((a, b) => {
    return (rarityOrder[a.rarity] ?? 99) - (rarityOrder[b.rarity] ?? 99)
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="arena-title text-xl text-[var(--text-primary)]">ARMORY</h1>
          <div className="h-px flex-1 bg-[var(--border-dim)] min-w-8" />
        </div>
        <div className="flex items-center gap-2 panel-raised px-3 py-1.5">
          <span className="text-[var(--neon-amber)] font-mono font-bold text-sm">{formatCredits(user.credits)}</span>
          <span className="arena-subtitle text-[9px] text-[var(--text-muted)]">CR</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-6">
        <button
          onClick={() => setTab('skills')}
          className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs transition ${
            tab === 'skills'
              ? 'btn-primary'
              : 'bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-dim)]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          SKILLS ({SKILL_LIST.length})
        </button>
        <button
          onClick={() => setTab('items')}
          className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs transition ${
            tab === 'items'
              ? 'btn-primary'
              : 'bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-dim)]'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          ITEMS ({shopItems.length})
        </button>
      </div>

      {/* Equipped skills banner */}
      {tab === 'skills' && (
        <div className="panel p-4 mb-6">
          <h3 className="arena-subtitle text-[10px] text-[var(--text-muted)] mb-3">
            EQUIPPED ({equippedSkills.size}/2 SLOTS)
          </h3>
          <div className="flex gap-2">
            {[...equippedSkills].map((sid) => {
              const s = ALL_SKILLS[sid as SkillId]
              if (!s) return null
              const rc = RARITY_COLORS[s.rarity]
              return (
                <div
                  key={sid}
                  className={`flex items-center gap-2 px-3 py-2 rounded-sm border ${rc.border} ${rc.bg}`}
                >
                  <span className="text-sm">✨</span>
                  <span className={`text-sm font-semibold ${rc.text}`}>{s.name}</span>
                </div>
              )
            })}
            {equippedSkills.size < 2 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-sm border border-dashed border-[var(--border-mid)] text-[var(--text-muted)]">
                <CircleDot className="w-3.5 h-3.5" />
                <span className="text-xs font-mono">EMPTY</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Skills Grid */}
      {tab === 'skills' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sortedSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              owned={ownedSkills.has(skill.id)}
              equipped={equippedSkills.has(skill.id)}
              onPurchase={() => handlePurchaseSkill(skill.id)}
              onEquip={() => handleEquipSkill(skill.id)}
              onUnequip={() => handleUnequipSkill(skill.id)}
              canAfford={user.credits >= skill.price}
            />
          ))}
        </div>
      )}

      {/* Items Grid */}
      {tab === 'items' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sortedItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onPurchase={() => {/* mock */}}
              canAfford={user.credits >= item.price}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ShopPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-void)] arena-grid-bg">
        <Navbar />
        <ShopContent />
      </div>
    </ProtectedRoute>
  )
}
