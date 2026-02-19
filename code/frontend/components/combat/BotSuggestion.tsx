'use client'

import { useState } from 'react'
import { getCategoryIcon, getCategoryColor } from '@/lib/moves'
import type { Move } from '@/lib/moves'
import { Sparkles, MessageCircle, X } from 'lucide-react'

// ============================================================
// Bot Suggestion Types
// ============================================================

export interface BotSuggestion {
  /** Recommended move */
  move: Move
  /** Bot's reasoning for this choice */
  reasoning: string
  /** Confidence level (0-1) */
  confidence: number
  /** Alternative moves (up to 2) */
  alternatives?: Array<{
    move: Move
    reason: string
  }>
}

interface BotSuggestionProps {
  /** Bot's current suggestion */
  suggestion: BotSuggestion | null
  /** Current focus points (0-5) */
  focusPoints: number
  /** Max focus points */
  maxFocus?: number
  /** Whether waiting for bot to analyze */
  analyzing?: boolean
  /** Called when human accepts bot's suggestion */
  onAccept: () => void
  /** Called when human wants to override */
  onOverride: () => void
  /** Called when human wants to discuss */
  onDiscuss: () => void
  /** Whether controls are disabled */
  disabled?: boolean
}

// ============================================================
// BotSuggestion Component
// ============================================================

export function BotSuggestion({
  suggestion,
  focusPoints,
  maxFocus = 5,
  analyzing = false,
  onAccept,
  onOverride,
  onDiscuss,
  disabled = false,
}: BotSuggestionProps) {
  const [showAlternatives, setShowAlternatives] = useState(false)

  // Render confidence stars
  const renderConfidence = (confidence: number) => {
    const stars = Math.round(confidence * 5)
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`text-xs ${i < stars ? 'text-amber-400' : 'text-gray-600'}`}
          >
            ⭐
          </span>
        ))}
      </div>
    )
  }

  // Render focus points
  const renderFocusPoints = () => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(maxFocus)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < focusPoints
                ? 'bg-purple-400 shadow-sm shadow-purple-400/50'
                : 'bg-gray-700'
            }`}
          />
        ))}
      </div>
    )
  }

  if (disabled) return null

  return (
    <div className="panel corner-brackets overflow-hidden border-purple-600/30">
      {/* Header */}
      <div className="bg-purple-900/20 px-3 sm:px-4 py-2 border-b border-purple-600/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="arena-subtitle text-[10px] sm:text-xs text-purple-300 uppercase tracking-wider">
              🤖 Bot Suggestion
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-purple-400 font-mono">FOCUS:</span>
            {renderFocusPoints()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        {analyzing && (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs text-purple-300 font-mono">Analyzing situation...</span>
          </div>
        )}

        {!analyzing && suggestion && (
          <>
            {/* Main Suggestion */}
            <div className="bg-[var(--bg-raised)] rounded-sm border border-purple-600/30 p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getCategoryIcon(suggestion.move.category)}</span>
                  <span className="text-sm font-semibold text-white">{suggestion.move.name}</span>
                  <span className={`text-[9px] font-mono ${getCategoryColor(suggestion.move.category)}`}>
                    {suggestion.move.category.toUpperCase()}
                  </span>
                </div>
                <div className="text-[9px] text-cyan-400 font-mono">
                  ⚡ {suggestion.move.energyCost} EN
                </div>
              </div>

              {/* Reasoning */}
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-2">
                {suggestion.reasoning}
              </p>

              {/* Confidence */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-400 font-mono">Confidence:</span>
                {renderConfidence(suggestion.confidence)}
              </div>
            </div>

            {/* Alternatives (if any) */}
            {suggestion.alternatives && suggestion.alternatives.length > 0 && (
              <div className="mb-3">
                <button
                  onClick={() => setShowAlternatives(!showAlternatives)}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-mono mb-2 transition-colors"
                >
                  {showAlternatives ? '▼' : '▶'} Alternative options ({suggestion.alternatives.length})
                </button>
                
                {showAlternatives && (
                  <div className="space-y-2">
                    {suggestion.alternatives.map((alt, i) => (
                      <div
                        key={i}
                        className="bg-[var(--bg-void)] rounded-sm border border-purple-600/20 p-2"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs">{getCategoryIcon(alt.move.category)}</span>
                          <span className="text-xs font-medium text-white">{alt.move.name}</span>
                          <span className="text-[8px] text-cyan-400 font-mono ml-auto">
                            ⚡ {alt.move.energyCost}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                          {alt.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={onAccept}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-900/20 border border-green-600/40 rounded-sm hover:border-green-500 hover:bg-green-900/40 transition-all text-green-400 text-xs font-mono uppercase active:scale-[0.97]"
              >
                <span>✓ Accept</span>
              </button>
              
              <button
                onClick={onOverride}
                disabled={focusPoints === 0}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-sm border text-xs font-mono uppercase transition-all active:scale-[0.97] ${
                  focusPoints === 0
                    ? 'bg-gray-900/20 border-gray-600/20 text-gray-600 cursor-not-allowed'
                    : 'bg-amber-900/20 border-amber-600/40 hover:border-amber-500 hover:bg-amber-900/40 text-amber-400'
                }`}
              >
                <span>🎯 Override</span>
                {focusPoints > 0 && <span className="text-[9px]">(-1)</span>}
              </button>
              
              <button
                onClick={onDiscuss}
                disabled={focusPoints < 0.5}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-sm border text-xs font-mono uppercase transition-all active:scale-[0.97] ${
                  focusPoints < 0.5
                    ? 'bg-gray-900/20 border-gray-600/20 text-gray-600 cursor-not-allowed'
                    : 'bg-purple-900/20 border-purple-600/40 hover:border-purple-500 hover:bg-purple-900/40 text-purple-400'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Focus Point Warning */}
            {focusPoints === 0 && (
              <div className="mt-3 p-2 bg-red-900/20 border border-red-600/30 rounded-sm">
                <p className="text-[10px] text-red-400 font-mono text-center">
                  ⚠️ No Focus Points remaining. Must accept bot's suggestion.
                </p>
              </div>
            )}
            {focusPoints > 0 && focusPoints <= 2 && (
              <div className="mt-3 p-2 bg-amber-900/20 border border-amber-600/30 rounded-sm">
                <p className="text-[10px] text-amber-400 font-mono text-center">
                  ⚡ Low Focus Points. Override carefully!
                </p>
              </div>
            )}
          </>
        )}

        {!analyzing && !suggestion && (
          <div className="text-center py-6">
            <p className="text-xs text-gray-500">Waiting for combat to begin...</p>
          </div>
        )}
      </div>
    </div>
  )
}
