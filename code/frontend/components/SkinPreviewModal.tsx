'use client'

import { Suspense, useEffect } from 'react'
import { X, Sparkles, Lock, Check, Star } from 'lucide-react'
import { formatCredits } from '@/lib/utils'
import { RARITY_LABELS, RARITY_HEX, type CosmeticItem, type Rarity } from '@/lib/cosmetics'

// Lazy-load the 3D component
import dynamic from 'next/dynamic'
const SkinPreviewFull = dynamic(
  () => import('@/components/3d/SkinPreview').then(m => ({ default: m.SkinPreviewFull })),
  { ssr: false }
)

interface SkinPreviewModalProps {
  item: CosmeticItem
  owned: boolean
  equipped: boolean
  canAfford: boolean
  onPurchase: () => void
  onEquip: () => void
  onClose: () => void
}

function getRarityBgGlow(rarity: Rarity): string {
  const map: Record<Rarity, string> = {
    common: 'shadow-[0_0_40px_rgba(136,136,136,0.1)]',
    uncommon: 'shadow-[0_0_40px_rgba(46,204,113,0.15)]',
    rare: 'shadow-[0_0_50px_rgba(52,152,219,0.2)]',
    super_rare: 'shadow-[0_0_50px_rgba(155,89,182,0.25)]',
    legendary: 'shadow-[0_0_60px_rgba(243,156,18,0.3)]',
  }
  return map[rarity] || ''
}

export function SkinPreviewModal({
  item,
  owned,
  equipped,
  canAfford,
  onPurchase,
  onEquip,
  onClose,
}: SkinPreviewModalProps) {
  const isSkin = item.category === 'skin'
  const isAccessory = item.category === 'accessory'
  const isFree = item.price === 0
  const rarityColor = RARITY_HEX[item.rarity]

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-lg mx-4 bg-[var(--bg-panel)] border border-[var(--border-mid)] rounded-sm overflow-hidden ${getRarityBgGlow(item.rarity)}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-sm bg-[var(--bg-void)]/60 border border-[var(--border-dim)] text-[var(--text-muted)] hover:text-white hover:border-[var(--border-bright)] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 3D Preview area or accessory display */}
        <div className="relative w-full aspect-square max-h-[50vh] bg-[var(--bg-void)]">
          {isSkin ? (
            <Suspense fallback={
              <div className="flex items-center justify-center w-full h-full">
                <div className="w-8 h-8 border-2 border-[var(--neon-cyan)] border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              <SkinPreviewFull color={item.metadata.color} />
            </Suspense>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full gap-4">
              <span className="text-7xl">{item.metadata.emoji || '🎒'}</span>
              {isAccessory && (
                <div className="text-center px-6">
                  <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
                    {item.metadata.slot} attachment
                  </span>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {item.metadata.attachment}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Rarity shimmer for legendary */}
          {item.rarity === 'legendary' && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent animate-shimmer-slow" />
            </div>
          )}
        </div>

        {/* Info bar */}
        <div className="p-4 border-t border-[var(--border-dim)]">
          {/* Rarity badge + name */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm"
              style={{
                color: rarityColor,
                backgroundColor: `${rarityColor}15`,
                border: `1px solid ${rarityColor}40`,
              }}
            >
              {RARITY_LABELS[item.rarity]}
            </span>
            {equipped && (
              <span className="flex items-center gap-0.5 text-[10px] font-mono font-bold text-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10 px-1.5 py-0.5 rounded-sm">
                <Star className="w-2.5 h-2.5" /> EQUIPPED
              </span>
            )}
            {owned && !equipped && (
              <span className="flex items-center gap-0.5 text-[10px] font-mono font-bold text-[var(--neon-green)] bg-[var(--neon-green-dim)] px-1.5 py-0.5 rounded-sm">
                <Check className="w-2.5 h-2.5" /> OWNED
              </span>
            )}
          </div>

          <h2 className="arena-title text-lg text-[var(--text-primary)] mb-1">{item.name}</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">{item.description}</p>

          {/* Action button */}
          {equipped ? (
            <div className="w-full py-3 rounded-sm text-sm font-mono font-bold bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30 text-[var(--neon-cyan)] text-center">
              ✦ EQUIPPED
            </div>
          ) : owned ? (
            <button
              onClick={onEquip}
              className="w-full py-3 rounded-sm text-sm font-mono font-bold bg-[var(--bg-raised)] border border-[var(--border-mid)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--neon-cyan)]/40 transition"
            >
              EQUIP
            </button>
          ) : isFree ? (
            <div className="w-full py-3 rounded-sm text-sm font-mono font-bold bg-[var(--neon-green-dim)] border border-[var(--neon-green)]/30 text-[var(--neon-green)] text-center">
              FREE · DEFAULT
            </div>
          ) : (
            <button
              onClick={onPurchase}
              disabled={!canAfford}
              className={`w-full py-3 rounded-sm text-sm font-mono font-bold transition ${
                canAfford
                  ? 'bg-[var(--neon-amber)] text-[var(--bg-void)] hover:shadow-lg hover:shadow-[var(--neon-amber-dim)]'
                  : 'bg-[var(--bg-raised)] text-[var(--text-muted)] cursor-not-allowed'
              }`}
            >
              {canAfford ? (
                <span className="flex items-center gap-1.5 justify-center">
                  <Sparkles className="w-4 h-4" /> BUY FOR {formatCredits(item.price)} CR
                </span>
              ) : (
                <span className="flex items-center gap-1.5 justify-center">
                  <Lock className="w-4 h-4" /> {formatCredits(item.price)} CR — NOT ENOUGH
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
