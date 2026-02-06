'use client'

import { useEffect, useRef } from 'react'
import type { RoundCompletePayload } from '../../shared/types'

interface ActionLogProps {
  rounds: RoundCompletePayload[]
  myBotId: string
}

/**
 * Scrollable log of round results.
 * Auto-scrolls to the newest entry.
 */
export function ActionLog({ rounds, myBotId }: ActionLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [rounds])

  function getActionEmoji(action: string): string {
    switch (action) {
      case 'attack': return '⚔️'
      case 'defend': return '🛡️'
      case 'skill': return '✨'
      default: return '❓'
    }
  }

  function getActionLabel(action: string, target: string | null): string {
    if (action === 'defend') return 'Defend'
    if (action === 'skill') return 'Skill'
    return `Attack → ${target || 'core'}`
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">📜 Combat Log</h3>
      <div
        ref={scrollRef}
        className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-700"
      >
        {rounds.length === 0 && (
          <p className="text-sm text-gray-600 text-center py-4">
            Waiting for combat to start...
          </p>
        )}
        {rounds.map((round) => {
          // Determine which bot is "me" and which is "opponent"
          // bot1/bot2 correspond to the match data; we use myBotId to figure out sides
          // For the log we show both actions regardless
          return (
            <div
              key={round.round}
              className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-purple-400">
                  Round {round.round}
                </span>
                <div className="flex gap-2 text-xs text-gray-500">
                  {round.bot1_timed_out && <span className="text-red-400">⏰ Bot1 timeout</span>}
                  {round.bot2_timed_out && <span className="text-red-400">⏰ Bot2 timeout</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Bot 1</span>
                  <div className="flex items-center gap-1">
                    <span>{getActionEmoji(round.bot1_action)}</span>
                    <span className="text-gray-300">
                      {getActionLabel(round.bot1_action, round.bot1_target)}
                    </span>
                  </div>
                  <span className="text-xs text-orange-400">
                    {round.bot1_damage_dealt > 0 ? `-${round.bot1_damage_dealt} dmg` : 'No damage'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 text-xs">Bot 2</span>
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-gray-300">
                      {getActionLabel(round.bot2_action, round.bot2_target)}
                    </span>
                    <span>{getActionEmoji(round.bot2_action)}</span>
                  </div>
                  <span className="text-xs text-orange-400">
                    {round.bot2_damage_dealt > 0 ? `-${round.bot2_damage_dealt} dmg` : 'No damage'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>HP: {round.bot1_hp}</span>
                <span>HP: {round.bot2_hp}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
