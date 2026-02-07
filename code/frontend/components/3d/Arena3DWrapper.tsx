'use client'

import dynamic from 'next/dynamic'
import type { RoundResult } from '../../../shared/types'

const Arena3D = dynamic(
  () => import('./Arena3D').then((mod) => mod.Arena3D),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full aspect-[16/9] max-h-[400px] rounded-sm border border-[var(--border-dim)] overflow-hidden bg-[#050510] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[var(--neon-cyan)] border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--text-muted)] text-xs arena-subtitle">LOADING ARENA</span>
        </div>
      </div>
    ),
  }
)

interface Arena3DWrapperProps {
  bot1Name: string
  bot2Name: string
  bot1MaxHp: number
  bot2MaxHp: number
  currentRound: RoundResult | null
  previousRound: RoundResult | null
  isAnimating: boolean
  onAnimationComplete?: () => void
}

export function Arena3DView(props: Arena3DWrapperProps) {
  return <Arena3D {...props} />
}
