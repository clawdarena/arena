'use client'

import { useRouter } from 'next/navigation'
import type { MatchEndPayload } from '../../shared/types'

interface MatchResultProps {
  result: MatchEndPayload
  myBotId: string
}

/**
 * Victory/Defeat overlay shown when a match ends.
 * Displays ELO change and credits won/lost.
 */
export function MatchResult({ result, myBotId }: MatchResultProps) {
  const router = useRouter()
  const isWinner = result.winner.bot_id === myBotId
  const isDraw = result.result === 'draw'

  const myData = isWinner ? result.winner : result.loser
  const eloChange = isWinner ? result.winner.elo_change : result.loser.elo_change
  const creditsChange = isWinner ? result.winner.credits_won : -result.loser.credits_lost

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 p-8 max-w-md w-full mx-4 text-center animate-in fade-in zoom-in duration-300">
        {/* Result Header */}
        <div className="mb-6">
          {isDraw ? (
            <>
              <div className="text-6xl mb-3">🤝</div>
              <h2 className="text-4xl font-bold text-gray-300">DRAW</h2>
            </>
          ) : isWinner ? (
            <>
              <div className="text-6xl mb-3">🏆</div>
              <h2 className="text-4xl font-bold text-yellow-400">VICTORY</h2>
            </>
          ) : (
            <>
              <div className="text-6xl mb-3">💀</div>
              <h2 className="text-4xl font-bold text-red-400">DEFEAT</h2>
            </>
          )}
        </div>

        {/* Match Stats */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
            <span className="text-gray-400">Rounds</span>
            <span className="font-medium">{result.rounds_fought}</span>
          </div>
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
            <span className="text-gray-400">Duration</span>
            <span className="font-medium">{result.duration_seconds}s</span>
          </div>
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
            <span className="text-gray-400">ELO</span>
            <span className={`font-medium ${eloChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {myData.elo_before} → {myData.elo_after}{' '}
              ({eloChange >= 0 ? '+' : ''}{eloChange})
            </span>
          </div>
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
            <span className="text-gray-400">Credits</span>
            <span className={`font-medium ${creditsChange >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
              {creditsChange >= 0 ? '+' : ''}{creditsChange} AC
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition"
          >
            Dashboard
          </button>
          <button
            onClick={() => router.push('/queue')}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  )
}
