'use client'

import { Bot3D } from '../Bot3D'
import { ALL_COSMETICS } from '@/lib/cosmetics'
import type { BotAnim } from './BattleArena'

// ============================================================
// BattleBot3D — 3D bot with battle animations for matches
// ============================================================

interface BattleBot3DProps {
  side: 'player' | 'opponent'
  color: string
  anim: BotAnim
  equippedCosmetics?: {
    skin?: string | null
    visor?: string | null
    claw?: string | null
    topper?: string | null
    aura?: string | null
  }
}

export function BattleBot3D({ side, color, anim, equippedCosmetics }: BattleBot3DProps) {
  const cls = [
    'transition-all duration-300',
    anim === 'hit' ? 'animate-bot-hit-slow' : '',
    anim === 'attack-right' ? 'animate-lunge-right-slow' : '',
    anim === 'attack-left' ? 'animate-lunge-left-slow' : '',
    anim === 'dead' ? 'opacity-20 translate-y-6 rotate-[15deg] transition-all duration-1000' : '',
    anim === 'taunt' ? 'animate-taunt' : '',
    anim === 'dance' ? 'animate-dance' : '',
    anim === 'idle' ? 'animate-idle-bob' : '',
  ].join(' ')

  const hitFilter = anim === 'hit' ? 'brightness(4) saturate(0)' : 'none'

  // Map equipped item IDs to effect types
  const getSkinName = (skinId: string | null | undefined): string | undefined => {
    if (!skinId) return undefined
    const item = ALL_COSMETICS.find(i => i.id === skinId)
    if (!item) return undefined
    // Map skin item names to getSkinColors names
    return item.name
  }

  const getEffectType = (itemId: string | null | undefined): string => {
    if (!itemId) return 'none'
    const item = ALL_COSMETICS.find(i => i.id === itemId)
    return item?.metadata.effect || 'none'
  }

  const skinName = getSkinName(equippedCosmetics?.skin)
  const visorEffect = getEffectType(equippedCosmetics?.visor)
  const clawEffect = getEffectType(equippedCosmetics?.claw)
  const topperEffect = getEffectType(equippedCosmetics?.topper)
  const auraEffect = getEffectType(equippedCosmetics?.aura)

  const size = side === 'player' ? 176 : 160

  return (
    <div className={`relative ${cls}`} style={{ filter: hitFilter }}>
      <Bot3D
        skin={skinName}
        visor={visorEffect}
        clawSkin={clawEffect}
        topper={topperEffect}
        aura={auraEffect}
        size={size}
        className="drop-shadow-lg"
      />
    </div>
  )
}
