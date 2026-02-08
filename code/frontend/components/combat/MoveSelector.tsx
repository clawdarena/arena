'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MOVES, getCategoryIcon, getCategoryColor, getCategoryBorderColor, getCategoryBgColor } from '@/lib/moves'
import type { Move, MoveCategory } from '@/lib/moves'
import { Swords, Shield, Zap, Timer, ChevronDown, ChevronUp } from 'lucide-react'

// ============================================================
// MoveSelector Component
// ============================================================

interface MoveSelectorProps {
  /** Current energy available */
  energy: number
  /** Max energy */
  maxEnergy?: number
  /** Time remaining in seconds */
  timeRemaining: number
  /** Called when a move is selected */
  onSelectMove: (move: Move) => void
  /** Whether selection has already been submitted */
  submitted?: boolean
  /** The submitted move name (if any) */
  submittedMoveName?: string
  /** Whether the selector is disabled */
  disabled?: boolean
  /** Current round number */
  round?: number
}

type FilterCategory = 'all' | MoveCategory

export function MoveSelector({
  energy,
  maxEnergy = 100,
  timeRemaining,
  onSelectMove,
  submitted = false,
  submittedMoveName,
  disabled = false,
  round = 1,
}: MoveSelectorProps) {
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [hoveredMove, setHoveredMove] = useState<Move | null>(null)
  const [expanded, setExpanded] = useState(true)
  const timerRef = useRef<HTMLDivElement>(null)

  // Timer urgency animation
  const isUrgent = timeRemaining <= 5

  const filteredMoves = filter === 'all'
    ? MOVES
    : MOVES.filter((m) => m.category === filter)

  const canAfford = useCallback((move: Move) => energy >= move.energyCost, [energy])

  if (submitted) {
    return (
      <div className="panel p-3 sm:p-4 corner-brackets">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-[var(--neon-green)] rounded-full animate-pulse" />
          <span className="text-sm text-[var(--neon-green)] font-mono uppercase tracking-wider">
            {submittedMoveName ?? 'Move'} submitted — waiting for resolution
          </span>
        </div>
      </div>
    )
  }

  if (disabled) return null

  return (
    <div className="panel corner-brackets overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[var(--neon-amber)]" />
          <span className="arena-subtitle text-[10px] sm:text-xs text-[var(--text-muted)] uppercase tracking-wider">
            Choose your move — R{round}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div
            ref={timerRef}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border ${
              isUrgent
                ? 'border-red-600/60 bg-red-900/20 animate-pulse'
                : 'border-[var(--border-dim)] bg-[var(--bg-raised)]'
            }`}
          >
            <Timer className={`w-3 h-3 ${isUrgent ? 'text-red-400' : 'text-[var(--text-muted)]'}`} />
            <span className={`text-sm font-mono font-bold ${
              isUrgent ? 'text-red-400' : 'text-white'
            }`}>
              {timeRemaining}s
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          {/* Energy Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-cyan-400 font-mono">⚡ ENERGY</span>
              <span className="text-cyan-300 font-mono font-bold">{energy}/{maxEnergy}</span>
            </div>
            <div className="h-2 bg-[var(--bg-raised)] rounded-full overflow-hidden border border-[var(--border-dim)]">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-300 rounded-full transition-all duration-500 shadow-sm shadow-cyan-500/30"
                style={{ width: `${(energy / maxEnergy) * 100}%` }}
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            {(['all', 'aggressive', 'defensive', 'tactical', 'exploit'] as FilterCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] sm:text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all border ${
                  filter === cat
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-transparent border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-white/10'
                }`}
              >
                {cat === 'all' ? '✦' : getCategoryIcon(cat)}
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Move Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {filteredMoves.map((move) => {
              const affordable = canAfford(move)
              return (
                <button
                  key={move.id}
                  onClick={() => affordable && onSelectMove(move)}
                  onMouseEnter={() => setHoveredMove(move)}
                  onMouseLeave={() => setHoveredMove(null)}
                  disabled={!affordable}
                  className={`relative text-left p-2.5 sm:p-3 rounded-sm border transition-all group ${
                    affordable
                      ? `${getCategoryBgColor(move.category)} ${getCategoryBorderColor(move.category)} cursor-pointer active:scale-[0.97]`
                      : 'bg-[var(--bg-void)] border-[var(--border-dim)] opacity-40 cursor-not-allowed'
                  }`}
                >
                  {/* Category icon */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs">{getCategoryIcon(move.category)}</span>
                    <span className={`text-[10px] font-mono uppercase ${getCategoryColor(move.category)}`}>
                      {move.category}
                    </span>
                  </div>

                  {/* Move name */}
                  <div className="text-xs sm:text-sm font-semibold text-white leading-tight mb-1">
                    {move.name}
                  </div>

                  {/* Energy cost */}
                  <div className={`text-[10px] font-mono ${affordable ? 'text-cyan-400' : 'text-red-400'}`}>
                    ⚡ {move.energyCost} EN
                  </div>

                  {/* Hover pulse ring */}
                  {affordable && (
                    <div className="absolute inset-0 rounded-sm border border-white/0 group-hover:border-white/20 transition-all pointer-events-none" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Tooltip / Description */}
          {hoveredMove && (
            <div className="mt-3 p-2.5 bg-[var(--bg-raised)] border border-[var(--border-mid)] rounded-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs">{getCategoryIcon(hoveredMove.category)}</span>
                <span className="text-sm font-semibold text-white">{hoveredMove.name}</span>
                <span className={`text-[10px] font-mono ml-auto ${getCategoryColor(hoveredMove.category)}`}>
                  {hoveredMove.category.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {hoveredMove.description}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono">
                <span className="text-cyan-400">⚡ {hoveredMove.energyCost} Energy</span>
                <span className="text-[var(--text-muted)]">
                  Action: {hoveredMove.actionType.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Quick actions row — basic attack/defend always available */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border-dim)]">
            <button
              onClick={() => onSelectMove({
                id: 'basic_attack',
                name: 'Basic Attack',
                category: 'aggressive',
                energyCost: 0,
                description: 'Standard attack. No energy cost.',
                animationKey: 'basic_attack',
                actionType: 'attack',
              })}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-900/20 border border-red-600/40 rounded-sm hover:border-red-500 hover:bg-red-900/40 transition-all text-red-400 text-xs font-mono uppercase active:scale-[0.97]"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Attack</span>
              <span className="text-[9px] text-red-500/60 ml-1">FREE</span>
            </button>
            <button
              onClick={() => onSelectMove({
                id: 'basic_defend',
                name: 'Defend',
                category: 'defensive',
                energyCost: 0,
                description: 'Defend and recover +15 energy.',
                animationKey: 'basic_defend',
                actionType: 'defend',
              })}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-cyan-900/20 border border-cyan-600/40 rounded-sm hover:border-cyan-500 hover:bg-cyan-900/40 transition-all text-cyan-400 text-xs font-mono uppercase active:scale-[0.97]"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Defend</span>
              <span className="text-[9px] text-cyan-500/60 ml-1">+15EN</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
