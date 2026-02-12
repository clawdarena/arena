'use client'

import { useState } from 'react'
import { Brain, ThumbsUp, MessageSquare, X, AlertTriangle } from 'lucide-react'
import { OpenClawSetup } from './OpenClawSetup'
import type { OpenClawConnectionState } from './OpenClawStatus'

interface SkillSuggestion {
  skillId: string
  skillName: string
  emoji: string
  confidence: number // 0-100
  reasoning: string[]
  counters: string[]
  expectedDamage: number
  riskLevel: 'low' | 'medium' | 'high'
}

interface BotSuggestionPanelProps {
  suggestion: SkillSuggestion | null
  timeRemaining: number
  focusPoints: number
  onAccept: () => void
  onOverride: () => void
  onDiscuss: () => void
  disabled?: boolean
  openClawStatus?: OpenClawConnectionState
}

export function BotSuggestionPanel({
  suggestion,
  timeRemaining,
  focusPoints,
  onAccept,
  onOverride,
  onDiscuss,
  disabled = false,
  openClawStatus = 'disconnected',
}: BotSuggestionPanelProps) {
  const [expanded, setExpanded] = useState(true)

  console.log('[BotSuggestionPanel] Received suggestion:', suggestion)

  // Show connection required UI when OpenClaw is not connected
  if (openClawStatus !== 'connected') {
    return (
      <div className="bg-[#0a0a1aee] border border-amber-600/40 rounded-lg backdrop-blur-sm">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-amber-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              OpenClaw Not Connected
            </span>
          </div>
          <p className="text-xs text-gray-300 mb-4">
            Connect your OpenClaw bot to receive AI coaching and combat suggestions.
          </p>
          <OpenClawSetup />
        </div>
      </div>
    )
  }

  if (!suggestion) {
    return (
      <div className="bg-[#0a0a1aee] border border-cyan-800/40 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <Brain className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-mono">Bot analyzing...</span>
        </div>
      </div>
    )
  }

  const confidenceColor = 
    suggestion.confidence >= 80 ? '#40ff40' :
    suggestion.confidence >= 60 ? '#ffaa00' :
    '#ff4040'

  const riskColor = 
    suggestion.riskLevel === 'low' ? '#40ff40' :
    suggestion.riskLevel === 'medium' ? '#ffaa00' :
    '#ff4040'

  return (
    <div className="bg-[#0a0a1aee] border border-cyan-800/40 rounded-lg backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-cyan-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            BOT COACH
          </span>
          <div className="flex items-center gap-1 ml-2">
            <div className="text-[10px] font-mono text-gray-400">
              {timeRemaining}s
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-500 hover:text-white transition p-1"
        >
          {expanded ? <X className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <>
          {/* Suggestion */}
          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-3xl">{suggestion.emoji}</div>
              <div className="flex-1">
                <div className="font-bold text-white mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {suggestion.skillName}
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="text-[10px] font-mono text-gray-400">CONFIDENCE</div>
                    <div className="text-xs font-bold font-mono" style={{ color: confidenceColor }}>
                      {suggestion.confidence}%
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="text-[10px] font-mono text-gray-400">RISK</div>
                    <div className="text-xs font-bold font-mono uppercase" style={{ color: riskColor }}>
                      {suggestion.riskLevel}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="text-[10px] font-mono text-gray-400">EST. DMG</div>
                    <div className="text-xs font-bold font-mono text-red-400">
                      ~{suggestion.expectedDamage}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="mb-3">
              <div className="text-[10px] font-mono text-cyan-400 mb-1.5">REASONING:</div>
              <div className="space-y-1">
                {suggestion.reasoning.map((reason, i) => (
                  <div key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Counters */}
            {suggestion.counters.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] font-mono text-amber-400 mb-1.5">COUNTERS:</div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestion.counters.map((counter, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono bg-amber-900/20 text-amber-400 px-2 py-0.5 rounded border border-amber-800/40"
                    >
                      {counter}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onAccept}
                disabled={disabled || openClawStatus !== 'connected'}
                className="flex flex-col items-center gap-1 bg-green-600/20 hover:bg-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed border border-green-600/40 rounded px-3 py-2 transition group"
              >
                <ThumbsUp className="w-4 h-4 text-green-400" />
                <span className="text-[10px] font-bold text-green-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  ACCEPT
                </span>
              </button>
              <button
                onClick={onOverride}
                disabled={disabled || focusPoints <= 0 || openClawStatus !== 'connected'}
                className="flex flex-col items-center gap-1 bg-amber-600/20 hover:bg-amber-600/30 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-600/40 rounded px-3 py-2 transition group"
              >
                <X className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  OVERRIDE
                </span>
                {focusPoints <= 0 && (
                  <span className="text-[8px] text-red-400">No Focus</span>
                )}
              </button>
              <button
                onClick={onDiscuss}
                disabled={disabled || openClawStatus !== 'connected'}
                className="flex flex-col items-center gap-1 bg-cyan-600/20 hover:bg-cyan-600/30 disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-600/40 rounded px-3 py-2 transition group"
              >
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-bold text-cyan-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  DISCUSS
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
