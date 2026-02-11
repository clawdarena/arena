'use client'

import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { MOVES, getCategoryIcon, getCategoryColor, getCategoryBorderColor, getCategoryBgColor } from '@/lib/moves'
import type { Move, MoveCategory } from '@/lib/moves'

interface OverrideModalProps {
  /** Current energy */
  energy: number
  /** Bot's original suggestion (for comparison) */
  botSuggestion: Move
  /** Bot's confidence in their suggestion */
  botConfidence: number
  /** Called when human confirms override */
  onConfirm: (move: Move) => void
  /** Called when human cancels */
  onCancel: () => void
}

type FilterCategory = 'all' | MoveCategory

export function OverrideModal({
  energy,
  botSuggestion,
  botConfidence,
  onConfirm,
  onCancel,
}: OverrideModalProps) {
  const [selectedMove, setSelectedMove] = useState<Move | null>(null)
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [confirmingOverride, setConfirmingOverride] = useState(false)

  const filteredMoves = filter === 'all'
    ? MOVES
    : MOVES.filter((m) => m.category === filter)

  const canAfford = (move: Move) => energy >= move.energyCost
  const highConfidence = botConfidence >= 0.8

  const handleSelect = (move: Move) => {
    setSelectedMove(move)
    setConfirmingOverride(true)
  }

  const handleConfirm = () => {
    if (selectedMove) {
      onConfirm(selectedMove)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="panel p-4 sm:p-6 max-w-2xl w-full mx-4 corner-brackets border-amber-600/40">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <h2 className="arena-title text-lg">Override Bot Suggestion</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {!confirmingOverride ? (
          <>
            {/* Warning */}
            <div className={`p-3 rounded-sm border mb-4 ${
              highConfidence
                ? 'bg-amber-900/20 border-amber-600/40'
                : 'bg-blue-900/20 border-blue-600/40'
            }`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                  highConfidence ? 'text-amber-400' : 'text-blue-400'
                }`} />
                <div>
                  <p className={`text-xs font-medium mb-1 ${
                    highConfidence ? 'text-amber-300' : 'text-blue-300'
                  }`}>
                    {highConfidence
                      ? '⚠️ Bot has high confidence in their suggestion'
                      : 'Bot suggests alternative approach'}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Override costs <span className="text-purple-400 font-mono">-1 Focus Point</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Bot's Suggestion (for reference) */}
            <div className="bg-purple-900/10 border border-purple-600/30 rounded-sm p-3 mb-4">
              <div className="text-[9px] text-purple-400 font-mono mb-1">BOT RECOMMENDS:</div>
              <div className="flex items-center gap-2">
                <span className="text-sm">{getCategoryIcon(botSuggestion.category)}</span>
                <span className="text-sm font-semibold text-white">{botSuggestion.name}</span>
                <div className="flex items-center gap-1 ml-auto">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-[10px] ${i < Math.round(botConfidence * 5) ? 'text-amber-400' : 'text-gray-600'}`}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              {(['all', 'aggressive', 'defensive', 'tactical', 'exploit'] as FilterCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono uppercase whitespace-nowrap transition-all border ${
                    filter === cat
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-transparent border-transparent text-[var(--text-muted)] hover:text-white hover:border-white/10'
                  }`}
                >
                  {cat === 'all' ? '✦' : getCategoryIcon(cat)}
                  <span>{cat}</span>
                </button>
              ))}
            </div>

            {/* Move Selection Grid */}
            <div className="max-h-96 overflow-y-auto scrollbar-thin pr-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredMoves.map((move) => {
                  const affordable = canAfford(move)
                  const isBotPick = move.id === botSuggestion.id
                  
                  return (
                    <button
                      key={move.id}
                      onClick={() => affordable && !isBotPick && handleSelect(move)}
                      disabled={!affordable || isBotPick}
                      className={`relative text-left p-2.5 rounded-sm border transition-all ${
                        isBotPick
                          ? 'bg-purple-900/20 border-purple-600/40 opacity-60 cursor-not-allowed'
                          : affordable
                          ? `${getCategoryBgColor(move.category)} ${getCategoryBorderColor(move.category)} hover:scale-105 cursor-pointer`
                          : 'bg-[var(--bg-void)] border-[var(--border-dim)] opacity-40 cursor-not-allowed'
                      }`}
                    >
                      {/* Bot's pick indicator */}
                      {isBotPick && (
                        <div className="absolute top-1 right-1 text-[8px] bg-purple-600/80 text-white px-1 py-0.5 rounded">
                          BOT
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs">{getCategoryIcon(move.category)}</span>
                        <span className={`text-[9px] font-mono uppercase ${getCategoryColor(move.category)}`}>
                          {move.category}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-white leading-tight mb-1">
                        {move.name}
                      </div>

                      <div className={`text-[10px] font-mono ${affordable ? 'text-cyan-400' : 'text-red-400'}`}>
                        ⚡ {move.energyCost} EN
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Cancel Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-[var(--bg-raised)] border border-[var(--border-mid)] rounded-sm text-xs font-mono text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-bright)] transition-all"
              >
                CANCEL
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation Step */}
            <div className="text-center py-6">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-bold text-amber-400 mb-2">Confirm Override?</h3>
              
              <div className="max-w-md mx-auto space-y-3 mb-6">
                <div className="bg-[var(--bg-raised)] rounded-sm p-3 border border-[var(--border-mid)]">
                  <div className="text-[9px] text-gray-500 font-mono mb-1">CHANGING FROM:</div>
                  <div className="flex items-center justify-center gap-2">
                    <span>{getCategoryIcon(botSuggestion.category)}</span>
                    <span className="text-sm font-semibold">{botSuggestion.name}</span>
                    <span className="text-xs text-gray-500">→</span>
                    <span>{getCategoryIcon(selectedMove!.category)}</span>
                    <span className="text-sm font-semibold">{selectedMove!.name}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-400">
                  This will cost <span className="text-purple-400 font-mono font-bold">-1 Focus Point</span>
                </div>

                {highConfidence && (
                  <div className="bg-amber-900/20 border border-amber-600/40 rounded-sm p-2">
                    <p className="text-[10px] text-amber-400">
                      Bot had {Math.round(botConfidence * 100)}% confidence. Are you sure?
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setConfirmingOverride(false)}
                  className="px-6 py-2 bg-[var(--bg-raised)] border border-[var(--border-mid)] rounded-sm text-xs font-mono text-[var(--text-secondary)] hover:text-white transition-all"
                >
                  BACK
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-500 rounded-sm text-xs font-mono text-white font-bold transition-all active:scale-95"
                >
                  CONFIRM OVERRIDE
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
