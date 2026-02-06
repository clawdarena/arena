'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import {
  ALL_SKILLS,
  SKILL_LIST,
  MOCK_SHOP_ITEMS,
  MOCK_BOT,
  MOCK_USER,
  loadMockData,
  RARITY_COLORS,
} from '@/lib/mock-api'
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
    <div className={`relative rounded-xl border p-4 transition-all hover:scale-[1.02] ${rarity.bg} ${rarity.border} ${rarity.glow ? `shadow-lg ${rarity.glow}` : ''}`}>
      {/* Rarity badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${rarity.text}`}>
          {skill.rarity}
        </span>
        {owned && (
          <span className="flex items-center gap-1 text-[10px] text-green-400 font-medium">
            <Check className="w-3 h-3" /> Owned
          </span>
        )}
      </div>

      {/* Skill info */}
      <div className="mb-3">
        <h3 className="text-base font-bold text-white mb-1">{skill.name}</h3>
        <p className="text-xs text-gray-400 leading-relaxed">{skill.description}</p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Timer className="w-3 h-3" />
          {skill.cooldown}r cooldown
        </span>
        <span className="flex items-center gap-1">
          <Target className="w-3 h-3" />
          {skill.target === 'self' ? 'Self' : 'Opponent'}
        </span>
      </div>

      {/* Action button */}
      {owned ? (
        equipped ? (
          <button
            onClick={onUnequip}
            className="w-full py-2 rounded-lg text-xs font-medium bg-gray-700/50 border border-gray-600/50 text-gray-300 hover:bg-gray-600/50 transition"
          >
            Unequip
          </button>
        ) : (
          <button
            onClick={onEquip}
            className="w-full py-2 rounded-lg text-xs font-medium bg-purple-600/80 hover:bg-purple-600 text-white transition"
          >
            Equip
          </button>
        )
      ) : isStarter ? (
        <div className="w-full py-2 rounded-lg text-xs font-medium bg-green-900/30 border border-green-700/30 text-green-400 text-center">
          Free · Starter Skill
        </div>
      ) : (
        <button
          onClick={onPurchase}
          disabled={!canAfford}
          className={`w-full py-2 rounded-lg text-xs font-medium transition ${
            canAfford
              ? 'bg-yellow-600/80 hover:bg-yellow-600 text-white'
              : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
          }`}
        >
          {canAfford ? `Buy for ${skill.price} AC` : (
            <span className="flex items-center gap-1 justify-center">
              <Lock className="w-3 h-3" /> {skill.price} AC
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
    <div className={`relative rounded-xl border p-4 transition-all hover:scale-[1.02] ${rarity.bg} ${rarity.border} ${rarity.glow ? `shadow-lg ${rarity.glow}` : ''}`}>
      {/* Limited edition badge */}
      {item.limited_edition && (
        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          LIMITED
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${rarity.text}`}>
          {item.rarity}
        </span>
        <span className="text-xs text-gray-500 capitalize">{categoryIcons[item.category]} {item.category}</span>
      </div>

      <h3 className="text-base font-bold text-white mb-1">{item.name}</h3>
      <p className="text-xs text-gray-400 leading-relaxed mb-3">{item.description}</p>

      {/* Stat bonuses */}
      {hasBonuses && (
        <div className="flex flex-wrap gap-2 mb-3">
          {item.hp_bonus > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-900/20 px-1.5 py-0.5 rounded">
              <Heart className="w-2.5 h-2.5" /> +{item.hp_bonus} HP
            </span>
          )}
          {item.attack_bonus > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-orange-400 bg-orange-900/20 px-1.5 py-0.5 rounded">
              <Swords className="w-2.5 h-2.5" /> +{item.attack_bonus} ATK
            </span>
          )}
          {item.defense_bonus > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-900/20 px-1.5 py-0.5 rounded">
              <Shield className="w-2.5 h-2.5" /> +{item.defense_bonus} DEF
            </span>
          )}
          {item.speed_bonus > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-900/20 px-1.5 py-0.5 rounded">
              <Zap className="w-2.5 h-2.5" /> +{item.speed_bonus} SPD
            </span>
          )}
        </div>
      )}

      {item.limited_edition && item.stock_remaining !== null && (
        <div className="text-[10px] text-red-400/80 mb-2">
          ⚠️ {item.stock_remaining} remaining
        </div>
      )}

      <button
        onClick={onPurchase}
        disabled={!canAfford}
        className={`w-full py-2 rounded-lg text-xs font-medium transition ${
          canAfford
            ? 'bg-yellow-600/80 hover:bg-yellow-600 text-white'
            : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
        }`}
      >
        {canAfford ? `Buy for ${item.price} AC` : (
          <span className="flex items-center gap-1 justify-center">
            <Lock className="w-3 h-3" /> {item.price} AC
          </span>
        )}
      </button>
    </div>
  )
}

function ShopContent() {
  const { user, bots, setUser, setBots, setToken } = useAuthStore()
  const [tab, setTab] = useState<ShopTab>('skills')
  const [ownedSkills, setOwnedSkills] = useState<Set<string>>(
    new Set(['power_strike', 'shield_wall', 'overclock', 'scan', 'fireball'])
  )
  const [equippedSkills, setEquippedSkills] = useState<Set<string>>(
    new Set(['fireball', 'shield_wall'])
  )

  useEffect(() => {
    if (!user) {
      const mock = loadMockData()
      setUser(mock.user)
      setBots(mock.bots)
      setToken(mock.token)
    }
  }, [user, setUser, setBots, setToken])

  if (!user) return null

  function handlePurchaseSkill(skillId: string) {
    const skill = ALL_SKILLS[skillId as SkillId]
    if (!skill || user!.credits < skill.price) return
    setOwnedSkills((prev) => new Set([...prev, skillId]))
    // In real app, would deduct credits via API
  }

  function handleEquipSkill(skillId: string) {
    if (equippedSkills.size >= 2) {
      alert('Max 2 skills equipped. Unequip one first.')
      return
    }
    setEquippedSkills((prev) => new Set([...prev, skillId]))
  }

  function handleUnequipSkill(skillId: string) {
    setEquippedSkills((prev) => {
      const next = new Set(prev)
      next.delete(skillId)
      return next
    })
  }

  // Sort skills: owned first, then by rarity
  const rarityOrder: Record<string, number> = { legendary: 0, epic: 1, rare: 2, common: 3 }
  const sortedSkills = [...SKILL_LIST].sort((a, b) => {
    const aOwned = ownedSkills.has(a.id) ? 0 : 1
    const bOwned = ownedSkills.has(b.id) ? 0 : 1
    if (aOwned !== bOwned) return aOwned - bOwned
    return (rarityOrder[a.rarity] ?? 99) - (rarityOrder[b.rarity] ?? 99)
  })

  const sortedItems = [...MOCK_SHOP_ITEMS].sort((a, b) => {
    return (rarityOrder[a.rarity] ?? 99) - (rarityOrder[b.rarity] ?? 99)
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-purple-400" />
          Shop
        </h1>
        <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
          <span className="text-yellow-400 text-sm">💰</span>
          <span className="text-sm font-medium">{formatCredits(user.credits)} AC</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('skills')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'skills'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Skills ({SKILL_LIST.length})
        </button>
        <button
          onClick={() => setTab('items')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'items'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          Items ({MOCK_SHOP_ITEMS.length})
        </button>
      </div>

      {/* Equipped skills banner */}
      {tab === 'skills' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Equipped ({equippedSkills.size}/2 slots)
          </h3>
          <div className="flex gap-3">
            {[...equippedSkills].map((sid) => {
              const s = ALL_SKILLS[sid as SkillId]
              if (!s) return null
              const rc = RARITY_COLORS[s.rarity]
              return (
                <div
                  key={sid}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${rc.border} ${rc.bg}`}
                >
                  <span className="text-sm">✨</span>
                  <span className={`text-sm font-medium ${rc.text}`}>{s.name}</span>
                </div>
              )
            })}
            {equippedSkills.size < 2 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-700 text-gray-600 text-sm">
                <CircleDot className="w-4 h-4" />
                Empty slot
              </div>
            )}
          </div>
        </div>
      )}

      {/* Skills Grid */}
      {tab === 'skills' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <ShopContent />
      </div>
    </ProtectedRoute>
  )
}
