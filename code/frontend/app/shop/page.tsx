'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useAuthStore, useCosmeticsStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import { api } from '@/lib/api'
import { formatCredits } from '@/lib/utils'
import {
  COSMETICS_BY_CATEGORY,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  ALL_COSMETICS,
  RARITY_ORDER,
  RARITY_LABELS,
  type CosmeticCategory,
  type CosmeticItem,
  type Rarity,
} from '@/lib/cosmetics'
import {
  Check,
  Lock,
  Star,
  Sparkles,
} from 'lucide-react'
import { SkinPreviewModal } from '@/components/SkinPreviewModal'
import dynamic from 'next/dynamic'
import { Bot3D } from '@/components/Bot3D'

const SkinPreviewMini = dynamic(
  () => import('@/components/3d/SkinPreview').then(m => ({ default: m.SkinPreviewMini })),
  { ssr: false }
)

// ============================================================
// Visual thumbnail components for each category
// ============================================================

function SkinThumbnail({ item, isHovered }: { item: CosmeticItem; isHovered: boolean }) {
  const color = item.metadata.color
  const isRainbow = item.metadata.effect === 'rainbow'
  const isGlow = item.metadata.effect === 'glow'

  return (
    <div className="relative w-full aspect-square flex items-center justify-center overflow-hidden rounded-md">
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-20"
        style={{ background: `radial-gradient(circle, ${color}44, transparent 70%)` }}
      />

      {/* 3D mini CrabBot preview */}
      <Suspense fallback={
        <div className="relative">
          <div
            className={`absolute inset-0 rounded-full blur-md transition-opacity duration-300 ${isHovered ? 'opacity-80' : 'opacity-40'}`}
            style={{
              background: isRainbow
                ? 'conic-gradient(#ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff, #ff0000)'
                : color,
              width: '70px',
              height: '70px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
          <div
            className="relative w-14 h-14 rounded-full border-2"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${color}, ${item.metadata.colorAlt})`,
              borderColor: `${color}88`,
            }}
          />
        </div>
      }>
        <SkinPreviewMini color={color} size={110} />
      </Suspense>
    </div>
  )
}

function TauntThumbnail({ item }: { item: CosmeticItem }) {
  const rarityAccent = item.rarity === 'legendary' ? 'var(--neon-amber)' :
    item.rarity === 'super_rare' ? '#9b59b6' :
    item.rarity === 'rare' ? '#3498db' :
    item.rarity === 'uncommon' ? '#2ecc71' : 'var(--text-muted)'

  return (
    <div className="w-full aspect-square flex flex-col items-center justify-center rounded-md relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, var(--bg-void), #0a0a1a)` }}>
      {/* Speech bubble design */}
      <div className="relative">
        <div className="px-3 py-2 rounded-lg border max-w-[90%]"
          style={{ borderColor: `${rarityAccent}44`, background: `${rarityAccent}0a` }}>
          <span className="text-xs font-mono font-bold text-center block" style={{ color: rarityAccent }}>
            &quot;{item.metadata.text}&quot;
          </span>
        </div>
        <div className="w-2 h-2 rotate-45 mx-auto -mt-1 border-r border-b"
          style={{ borderColor: `${rarityAccent}44`, background: 'var(--bg-void)' }} />
      </div>
      {/* Mini bot silhouette at bottom */}
      <div className="mt-2 w-6 h-6 rounded-full border"
        style={{ borderColor: `${rarityAccent}33`, background: `${rarityAccent}11` }} />
    </div>
  )
}

function DanceThumbnail({ item }: { item: CosmeticItem }) {
  const danceIllustrations: Record<string, { lines: string; accent: string }> = {
    robot_spin: { lines: '↻', accent: '#00f0ff' },
    claw_snap: { lines: '✂', accent: '#ff6b00' },
    moonwalk: { lines: '◄', accent: '#b0e0ff' },
    breakdance: { lines: '⟳', accent: '#ff2020' },
    dab: { lines: '╲', accent: '#ffd700' },
    floss: { lines: '↔', accent: '#39ff14' },
    t_pose: { lines: '╋', accent: '#9b30ff' },
    basic_victory: { lines: '▲', accent: '#888' },
  }
  const dance = danceIllustrations[item.metadata.animation || ''] || { lines: '♪', accent: 'var(--neon-cyan)' }

  return (
    <div className="w-full aspect-square flex flex-col items-center justify-center gap-1 rounded-md relative overflow-hidden"
      style={{ background: `linear-gradient(180deg, var(--bg-void), #0a0a1a)` }}>
      {/* Motion lines */}
      <div className="absolute inset-0 opacity-15">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="absolute h-px animate-pulse"
            style={{
              width: `${30 + i * 10}%`,
              top: `${20 + i * 15}%`,
              left: `${10 + (i % 2) * 20}%`,
              background: `linear-gradient(90deg, transparent, ${dance.accent}88, transparent)`,
              animationDelay: `${i * 0.2}s`,
            }} />
        ))}
      </div>
      {/* Stylized motion symbol */}
      <div className="text-4xl font-bold opacity-60 relative z-10" style={{ color: dance.accent }}>
        {dance.lines}
      </div>
      <span className="text-[9px] font-mono uppercase relative z-10 px-2 py-0.5 rounded"
        style={{ color: dance.accent, background: `${dance.accent}15` }}>
        {item.metadata.animation?.replace('_', ' ')}
      </span>
    </div>
  )
}

function ArenaThumbnail({ item }: { item: CosmeticItem }) {
  const c1 = item.metadata.color1 || '#1a1a2e'
  const c2 = item.metadata.color2 || '#16213e'

  const getPattern = () => {
    switch (item.metadata.theme) {
      case 'neon_city':
        return (
          <>
            <div className="absolute bottom-0 left-0 w-full h-1/2"
              style={{ background: `linear-gradient(0deg, ${c1}cc, transparent)` }} />
            <div className="absolute bottom-[10%] left-[15%] w-1.5 h-4 bg-[#ff00ff66] rounded-sm" />
            <div className="absolute bottom-[10%] left-[35%] w-2 h-6 bg-[#00ffff44] rounded-sm" />
            <div className="absolute bottom-[10%] left-[55%] w-1.5 h-5 bg-[#ff00ff44] rounded-sm" />
            <div className="absolute bottom-[10%] left-[75%] w-2 h-3 bg-[#00ffff66] rounded-sm" />
          </>
        )
      case 'space_station':
        return (
          <>
            {[...Array(12)].map((_, i) => (
              <div key={i} className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse"
                style={{
                  top: `${10 + Math.sin(i * 3) * 40 + 40}%`,
                  left: `${10 + Math.cos(i * 5) * 40 + 40}%`,
                  animationDelay: `${i * 0.3}s`,
                  opacity: 0.4 + (i % 3) * 0.2,
                }} />
            ))}
          </>
        )
      case 'volcanic':
        return (
          <div className="absolute bottom-0 w-full h-1/3"
            style={{ background: `linear-gradient(0deg, ${c1}cc, ${c2}44, transparent)` }} />
        )
      case 'underwater':
        return (
          <>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="absolute w-1 rounded-full bg-[#40a0ff33] animate-pulse"
                style={{
                  height: `${3 + i * 2}px`,
                  bottom: `${20 + i * 12}%`,
                  left: `${15 + i * 16}%`,
                  animationDelay: `${i * 0.5}s`,
                }} />
            ))}
          </>
        )
      case 'matrix':
        return (
          <>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="absolute text-[8px] font-mono text-[#00ff0066] animate-pulse leading-none"
                style={{
                  top: `${5 + i * 12}%`,
                  left: `${10 + (i * 23) % 80}%`,
                  animationDelay: `${i * 0.2}s`,
                }}>
                {['0', '1', '0', '1', '0'][i % 5]}
              </div>
            ))}
          </>
        )
      default:
        return null
    }
  }

  return (
    <div
      className="w-full aspect-square rounded-md relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
    >
      {getPattern()}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(${c1}88 1px, transparent 1px), linear-gradient(90deg, ${c1}88 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />
    </div>
  )
}

function EntranceThumbnail({ item }: { item: CosmeticItem }) {
  const effectStyles: Record<string, { color: string; pattern: React.ReactNode }> = {
    standard: { color: '#666', pattern: null },
    lightning: {
      color: '#ffdd00',
      pattern: (
        <>
          <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 100 100">
            <path d="M50 5 L40 45 L55 40 L45 95 L60 50 L45 55 Z" fill="#ffdd0066" stroke="#ffdd00" strokeWidth="1" />
          </svg>
          <div className="absolute inset-0 animate-pulse" style={{ background: 'radial-gradient(circle at 50% 50%, #ffdd0022, transparent 60%)' }} />
        </>
      ),
    },
    teleport: {
      color: '#00ffff',
      pattern: (
        <>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="absolute border rounded animate-pulse"
              style={{
                width: `${30 + i * 20}%`, height: `${30 + i * 20}%`,
                top: `${35 - i * 10}%`, left: `${35 - i * 10}%`,
                borderColor: `#00ffff${40 - i * 10}`,
                animationDelay: `${i * 0.3}s`,
              }} />
          ))}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle, #00ffff11, transparent 50%)' }} />
        </>
      ),
    },
    fire: {
      color: '#ff4400',
      pattern: (
        <div className="absolute bottom-0 w-full h-2/3">
          <div className="absolute bottom-0 w-full h-full" style={{
            background: 'linear-gradient(0deg, #ff440066, #ff880033, transparent)',
          }} />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute bottom-0 rounded-full animate-pulse"
              style={{
                width: '12%', height: `${20 + i * 8}%`,
                left: `${10 + i * 18}%`,
                background: `linear-gradient(0deg, #ff4400${60 - i * 8}, #ff880033, transparent)`,
                animationDelay: `${i * 0.15}s`,
                borderRadius: '50% 50% 30% 30%',
              }} />
          ))}
        </div>
      ),
    },
    portal: {
      color: '#aa44ff',
      pattern: (
        <>
          <div className="absolute inset-[15%] rounded-full border-2 animate-spin"
            style={{ borderColor: '#aa44ff44', borderTopColor: '#aa44ff', animationDuration: '3s' }} />
          <div className="absolute inset-[25%] rounded-full border animate-spin"
            style={{ borderColor: '#aa44ff33', borderBottomColor: '#aa44ffaa', animationDuration: '2s', animationDirection: 'reverse' }} />
          <div className="absolute inset-[35%] rounded-full" style={{ background: 'radial-gradient(circle, #aa44ff33, #1a002a)' }} />
        </>
      ),
    },
  }
  const effect = effectStyles[item.metadata.effect] || effectStyles.standard

  return (
    <div className="w-full aspect-square rounded-md relative overflow-hidden"
      style={{ background: `linear-gradient(180deg, #0a0a1a, var(--bg-void))` }}>
      {effect.pattern}
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded"
          style={{ color: effect.color, background: `${effect.color}15` }}>
          {item.metadata.effect}
        </span>
      </div>
    </div>
  )
}

function AccessoryThumbnail({ item, isHovered }: { item: CosmeticItem; isHovered: boolean }) {
  const slotColors: Record<string, string> = {
    back: '#00f0ff',
    head: '#ffd700',
    face: '#ff6b00',
  }
  const accent = slotColors[item.metadata.slot || 'back'] || '#00f0ff'

  return (
    <div className="w-full aspect-square rounded-md relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, #0a0a1a, var(--bg-void))` }}>
      {/* 3D bot silhouette with attachment indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Bot body outline */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 opacity-30"
            style={{ borderColor: accent }} />
          {/* Slot indicator */}
          {item.metadata.slot === 'head' && (
            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-4 rounded-t-full border-2 transition-opacity ${isHovered ? 'opacity-90' : 'opacity-50'}`}
              style={{ borderColor: accent, background: `${accent}22`, borderBottom: 'none' }} />
          )}
          {item.metadata.slot === 'back' && (
            <div className={`absolute top-1/2 -right-4 -translate-y-1/2 w-6 h-8 rounded-r border-2 transition-opacity ${isHovered ? 'opacity-90' : 'opacity-50'}`}
              style={{ borderColor: accent, background: `${accent}22`, borderLeft: 'none' }} />
          )}
          {item.metadata.slot === 'face' && (
            <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-6 h-3 rounded-sm border transition-opacity ${isHovered ? 'opacity-90' : 'opacity-50'}`}
              style={{ borderColor: accent, background: `${accent}33` }} />
          )}
          {/* Glow effect */}
          <div className={`absolute inset-0 rounded-full blur-md transition-opacity ${isHovered ? 'opacity-40' : 'opacity-15'}`}
            style={{ background: accent }} />
        </div>
      </div>
      {/* Label */}
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded"
          style={{ color: accent, background: `${accent}15` }}>
          {item.metadata.slot}
        </span>
      </div>
    </div>
  )
}

function VisorThumbnail({ item }: { item: CosmeticItem }) {
  return (
    <div className="w-full aspect-square rounded-md relative overflow-hidden bg-gradient-to-b from-[#0a0a2a] via-[#050515] to-[#0a0a1a] flex items-center justify-center">
      <Bot3D visor={item.metadata.effect} size={120} />
    </div>
  )
}

function ClawThumbnail({ item }: { item: CosmeticItem }) {
  return (
    <div className="w-full aspect-square rounded-md relative overflow-hidden bg-gradient-to-b from-[#0a0a2a] via-[#050515] to-[#0a0a1a] flex items-center justify-center">
      <Bot3D clawSkin={item.metadata.effect} size={120} />
    </div>
  )
}

function TopperThumbnail({ item }: { item: CosmeticItem }) {
  return (
    <div className="w-full aspect-square rounded-md relative overflow-hidden bg-gradient-to-b from-[#0a0a2a] via-[#050515] to-[#0a0a1a] flex items-center justify-center">
      <Bot3D topper={item.metadata.effect} size={120} />
    </div>
  )
}

function AuraThumbnail({ item }: { item: CosmeticItem }) {
  return (
    <div className="w-full aspect-square rounded-md relative overflow-hidden bg-gradient-to-b from-[#0a0a2a] via-[#050515] to-[#0a0a1a] flex items-center justify-center">
      <Bot3D aura={item.metadata.effect} size={120} />
    </div>
  )
}

function ItemThumbnail({ item, isHovered }: { item: CosmeticItem; isHovered: boolean }) {
  switch (item.category) {
    case 'skin': return <SkinThumbnail item={item} isHovered={isHovered} />
    case 'taunt': return <TauntThumbnail item={item} />
    case 'dance': return <DanceThumbnail item={item} />
    case 'arena': return <ArenaThumbnail item={item} />
    case 'entrance': return <EntranceThumbnail item={item} />
    case 'accessory': return <AccessoryThumbnail item={item} isHovered={isHovered} />
    case 'visor': return <VisorThumbnail item={item} />
    case 'claw': return <ClawThumbnail item={item} />
    case 'topper': return <TopperThumbnail item={item} />
    case 'aura': return <AuraThumbnail item={item} />
    default: return null
  }
}

// ============================================================
// Rarity border helper
// ============================================================

function getRarityStyles(rarity: Rarity) {
  const styles: Record<Rarity, { border: string; glow: string; badge: string }> = {
    common: {
      border: 'border-gray-600/50',
      glow: '',
      badge: 'bg-gray-700/80 text-gray-300',
    },
    uncommon: {
      border: 'border-green-500/50',
      glow: '',
      badge: 'bg-green-900/80 text-green-300',
    },
    rare: {
      border: 'border-blue-500/50',
      glow: 'shadow-[0_0_8px_rgba(52,152,219,0.15)]',
      badge: 'bg-blue-900/80 text-blue-300',
    },
    super_rare: {
      border: 'border-purple-500/50',
      glow: 'shadow-[0_0_10px_rgba(155,89,182,0.2)]',
      badge: 'bg-purple-900/80 text-purple-300',
    },
    legendary: {
      border: 'border-yellow-500/60',
      glow: 'shadow-[0_0_15px_rgba(243,156,18,0.3)]',
      badge: 'bg-yellow-900/80 text-yellow-300',
    },
  }
  return styles[rarity] || styles.common
}

// ============================================================
// Item Card
// ============================================================

function CosmeticCard({
  item,
  owned,
  equipped,
  canAfford,
  onPurchase,
  onEquip,
  onPreview,
}: {
  item: CosmeticItem
  owned: boolean
  equipped: boolean
  canAfford: boolean
  onPurchase: () => void
  onEquip: () => void
  onPreview: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const rarityStyle = getRarityStyles(item.rarity)
  const isFree = item.price === 0
  const { setPreviewSkinColor } = useCosmeticsStore()
  const isLegendary = item.rarity === 'legendary'

  const handleMouseEnter = () => {
    setHovered(true)
    if (item.category === 'skin') {
      setPreviewSkinColor(item.metadata.color)
    }
  }

  const handleMouseLeave = () => {
    setHovered(false)
    if (item.category === 'skin') {
      setPreviewSkinColor(null)
    }
  }

  return (
    <div
      className={`relative panel p-3 transition-all duration-200 hover:border-[var(--border-bright)] group cursor-pointer
        ${rarityStyle.border} ${rarityStyle.glow}
        ${equipped ? 'ring-1 ring-[var(--neon-cyan)]/40' : ''}
        ${isLegendary ? 'legendary-shimmer' : ''}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onPreview}
    >
      {/* Status badges */}
      <div className="flex items-center justify-between mb-2 min-h-[20px]">
        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${rarityStyle.badge}`}>
          {RARITY_LABELS[item.rarity]}
        </span>
        <div className="flex gap-1">
          {equipped && (
            <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold text-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10 px-1.5 py-0.5 rounded-sm">
              <Star className="w-2.5 h-2.5" /> EQUIPPED
            </span>
          )}
          {owned && !equipped && (
            <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold text-[var(--neon-green)] bg-[var(--neon-green-dim)] px-1.5 py-0.5 rounded-sm">
              <Check className="w-2.5 h-2.5" /> OWNED
            </span>
          )}
        </div>
      </div>

      {/* Thumbnail */}
      <div className="mb-3">
        <ItemThumbnail item={item} isHovered={hovered} />
      </div>

      {/* Info */}
      <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1 font-body truncate">{item.name}</h3>
      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-2 min-h-[32px]">
        {item.description}
      </p>

      {/* Action */}
      <div onClick={e => e.stopPropagation()}>
        {equipped ? (
          <div className="w-full py-2 rounded-sm text-xs font-mono font-bold bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30 text-[var(--neon-cyan)] text-center">
            ✦ EQUIPPED
          </div>
        ) : owned ? (
          <button
            onClick={onEquip}
            className="w-full py-2 rounded-sm text-xs font-mono font-bold bg-[var(--bg-raised)] border border-[var(--border-mid)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--neon-cyan)]/40 transition"
          >
            EQUIP
          </button>
        ) : isFree ? (
          <div className="w-full py-2 rounded-sm text-xs font-mono font-bold bg-[var(--neon-green-dim)] border border-[var(--neon-green)]/30 text-[var(--neon-green)] text-center">
            FREE · DEFAULT
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
            {canAfford ? (
              <span className="flex items-center gap-1 justify-center">
                <Sparkles className="w-3 h-3" /> {formatCredits(item.price)} CR
              </span>
            ) : (
              <span className="flex items-center gap-1 justify-center">
                <Lock className="w-3 h-3" /> {formatCredits(item.price)} CR
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Main Shop Content
// ============================================================

const CATEGORIES: CosmeticCategory[] = ['skin', 'visor', 'claw', 'topper', 'aura', 'accessory', 'taunt', 'dance', 'arena', 'entrance']

function ShopContent() {
  const { user, bots, setUser, setBots, setToken } = useAuthStore()
  const {
    ownedItems,
    equippedItems,
    setOwnedItems,
    addOwnedItem,
    setEquippedItem,
  } = useCosmeticsStore()
  const [activeTab, setActiveTab] = useState<CosmeticCategory>('skin')
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<CosmeticItem | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const me = await api<Record<string, any>>('/api/auth/me')
        setUser({
          id: me.id, username: me.username, credits: me.credits,
          current_elo: me.current_elo, peak_elo: me.peak_elo,
          total_matches: me.total_matches, wins: me.wins, losses: me.losses,
          created_at: me.created_at,
        })
        if (me.bots?.length) {
          setBots(me.bots)
        }

        try {
          const cosmetics = await api<{ items: string[] }>('/api/shop/owned')
          if (cosmetics.items) {
            setOwnedItems(new Set(cosmetics.items))
          }
        } catch {
          const defaults = ALL_COSMETICS.filter(i => i.isDefault).map(i => i.id)
          setOwnedItems(new Set(defaults))
        }

        try {
          if (me.bots?.length) {
            const equipped = await api<{ cosmetics: Record<CosmeticCategory, string | null> }>(
              `/api/bots/${me.bots[0].id}/cosmetics`
            )
            if (equipped.cosmetics) {
              for (const [slot, itemId] of Object.entries(equipped.cosmetics)) {
                setEquippedItem(slot as CosmeticCategory, itemId)
              }
            }
          }
        } catch {
          // Use defaults from store
        }
      } catch (err) {
        console.error('Failed to fetch shop data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [setUser, setBots, setToken, setOwnedItems, setEquippedItem])

  const handlePurchase = useCallback(async (item: CosmeticItem) => {
    if (!user || user.credits < item.price || purchasing) return
    setPurchasing(item.id)
    try {
      const res = await api<{ new_balance: number }>('/api/shop/purchase', {
        method: 'POST',
        body: JSON.stringify({ item_id: item.id }),
      })
      addOwnedItem(item.id)
      setUser({ ...user, credits: res.new_balance })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Purchase failed'
      alert(msg)
    } finally {
      setPurchasing(null)
    }
  }, [user, purchasing, addOwnedItem, setUser])

  const handleEquip = useCallback(async (item: CosmeticItem) => {
    const botId = bots[0]?.id
    if (!botId) return
    try {
      await api('/api/bots/equip-cosmetic', {
        method: 'POST',
        body: JSON.stringify({ bot_id: botId, item_id: item.id, slot: item.category }),
      })
    } catch {
      // Backend might not support yet, still update locally
    }
    setEquippedItem(item.category, item.id)
  }, [bots, setEquippedItem])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-3 text-[var(--text-muted)]">
        <div className="w-4 h-4 border-2 border-[var(--neon-cyan)] border-t-transparent rounded-full animate-spin" />
        <span className="arena-subtitle text-xs">LOADING SHOP</span>
      </div>
    </div>
  )

  if (!user) return null

  const items = COSMETICS_BY_CATEGORY[activeTab]
  const sortedItems = [...items].sort((a, b) => {
    return (RARITY_ORDER[a.rarity] ?? 99) - (RARITY_ORDER[b.rarity] ?? 99)
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="arena-title text-xl text-[var(--text-primary)]">COSMETIC SHOP</h1>
          <div className="h-px flex-1 bg-[var(--border-dim)] min-w-8" />
        </div>
        <div className="flex items-center gap-2 panel-raised px-3 py-1.5">
          <span className="text-[var(--neon-amber)] font-mono font-bold text-sm">{formatCredits(user.credits)}</span>
          <span className="arena-subtitle text-[9px] text-[var(--text-muted)]">CR</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map((cat) => {
            const isActive = activeTab === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-mono font-bold transition-all
                  ${isActive
                    ? 'bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/30'
                    : 'bg-[var(--bg-raised)] text-[var(--text-muted)] border border-[var(--border-dim)] hover:text-[var(--text-secondary)] hover:border-[var(--border-mid)]'
                  }
                `}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                <span>{CATEGORY_LABELS[cat]}</span>
                <span className="text-[9px] opacity-60">({COSMETICS_BY_CATEGORY[cat].length})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Cosmetic info banner */}
      <div className="mb-4 panel px-4 py-2 flex items-center gap-2 text-[11px] text-[var(--text-muted)] font-mono">
        <Sparkles className="w-3.5 h-3.5 text-[var(--neon-amber)] flex-shrink-0" />
        <span>All items are <span className="text-[var(--text-primary)] font-bold">purely cosmetic</span> — zero gameplay advantage. Look cool, fight fair.</span>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {sortedItems.map((item, i) => {
          const isOwned = ownedItems.has(item.id) || item.isDefault === true
          const isEquipped = equippedItems[item.category] === item.id

          return (
            <div
              key={item.id}
              className="animate-grid-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <CosmeticCard
                item={item}
                owned={isOwned}
                equipped={isEquipped}
                canAfford={user.credits >= item.price}
                onPurchase={() => handlePurchase(item)}
                onEquip={() => handleEquip(item)}
                onPreview={() => setPreviewItem(item)}
              />
            </div>
          )
        })}
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <SkinPreviewModal
          item={previewItem}
          owned={ownedItems.has(previewItem.id) || previewItem.isDefault === true}
          equipped={equippedItems[previewItem.category] === previewItem.id}
          canAfford={user.credits >= previewItem.price}
          onPurchase={() => {
            handlePurchase(previewItem)
          }}
          onEquip={() => {
            handleEquip(previewItem)
          }}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  )
}

// ============================================================
// Page Export
// ============================================================

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
