'use client'

import { Star } from 'lucide-react'

interface FocusPointTrackerProps {
  current: number
  max: number
  roundsUntilRegen: number
}

export function FocusPointTracker({ current, max, roundsUntilRegen }: FocusPointTrackerProps) {
  return (
    <div className="bg-[#0a0a1aee] border border-purple-800/40 rounded-lg p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold text-purple-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          FOCUS POINTS
        </div>
        {roundsUntilRegen > 0 && (
          <div className="text-[10px] font-mono text-gray-400">
            +1 in {roundsUntilRegen}R
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} className="relative">
            {i < current ? (
              <Star className="w-6 h-6 text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
            ) : (
              <Star className="w-6 h-6 text-gray-700" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 text-[10px] text-gray-400 leading-tight">
        <div className="flex items-center gap-1">
          <span className="text-amber-400">•</span>
          <span>Override costs 1 Focus Point</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-purple-400">•</span>
          <span>Regenerates +1 every 3 rounds</span>
        </div>
      </div>
    </div>
  )
}
