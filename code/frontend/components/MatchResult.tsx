'use client'

import { useRouter } from 'next/navigation'

interface MatchResultProps {
  result: any  // MatchEndPayload — but PvE has different shape
  myBotId: string
}

/**
 * Victory/Defeat overlay shown when a match ends.
 * Handles both PvP (with ELO) and PvE (no ELO) payloads.
 */
export function MatchResult({ result, myBotId }: MatchResultProps) {
  const router = useRouter()

  const isPve = result.match_type === 'pve'
  const isDraw = result.result === 'draw'
  const isWinner = result.result === 'win'

  // Safely extract ELO data (missing in PvE)
  const winner = result.winner || {}
  const loser = result.loser || {}
  const myData = isWinner ? winner : loser
  const eloChange = myData?.elo_change ?? null
  const creditsWon = result.credits_earned ?? winner?.credits_won ?? 0
  const creditsLost = loser?.credits_lost ?? 0
  const creditsChange = isWinner ? creditsWon : -creditsLost
  
  // Determine which side is us (for XP display)
  const iAmBot1 = winner?.bot_id === myBotId ? isWinner : !isWinner

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="panel p-8 max-w-md w-full mx-4 text-center corner-brackets animate-victory">
        {/* Result Header */}
        <div className="mb-6">
          {isDraw ? (
            <>
              <div className="text-5xl mb-3">🤝</div>
              <h2 className="arena-title text-3xl text-[var(--text-primary)] animate-num-pop">DRAW</h2>
            </>
          ) : isWinner ? (
            <>
              <div className="text-5xl mb-3 animate-bounce">🏆</div>
              <h2 className="arena-title text-3xl text-[var(--neon-amber)] glow-amber animate-num-pop">VICTORY</h2>
            </>
          ) : (
            <>
              <div className="text-5xl mb-3">💀</div>
              <h2 className="arena-title text-3xl text-[var(--neon-red)] glow-red animate-num-pop">DEFEAT</h2>
            </>
          )}
          {isPve && (
            <span className="arena-subtitle text-[10px] text-[var(--text-muted)] mt-2 block">PVE TRAINING</span>
          )}
        </div>

        {/* Match Stats */}
        <div className="space-y-1.5 mb-6">
          <div className="flex items-center justify-between bg-[var(--bg-void)] border border-[var(--border-dim)] rounded-sm px-4 py-2.5">
            <span className="arena-subtitle text-[10px] text-[var(--text-muted)]">ROUNDS</span>
            <span className="font-mono font-bold text-sm">{result.rounds_fought}</span>
          </div>
          <div className="flex items-center justify-between bg-[var(--bg-void)] border border-[var(--border-dim)] rounded-sm px-4 py-2.5">
            <span className="arena-subtitle text-[10px] text-[var(--text-muted)]">DURATION</span>
            <span className="font-mono font-bold text-sm">{result.duration_seconds}s</span>
          </div>

          {/* ELO — only show for PvP */}
          {eloChange !== null && (
            <div className="flex items-center justify-between bg-[var(--bg-void)] border border-[var(--border-dim)] rounded-sm px-4 py-2.5">
              <span className="arena-subtitle text-[10px] text-[var(--text-muted)]">ELO</span>
              <span className={`font-mono font-bold text-sm ${eloChange >= 0 ? 'text-[var(--neon-green)]' : 'text-[var(--neon-red)]'}`}>
                {myData.elo_before} → {myData.elo_after}{' '}
                ({eloChange >= 0 ? '+' : ''}{eloChange})
              </span>
            </div>
          )}

          {/* Credits */}
          {(creditsChange !== 0 || creditsWon > 0) && (
            <div className="flex items-center justify-between bg-[var(--bg-void)] border border-[var(--border-dim)] rounded-sm px-4 py-2.5">
              <span className="arena-subtitle text-[10px] text-[var(--text-muted)]">CREDITS</span>
              <span className={`font-mono font-bold text-sm ${creditsChange >= 0 ? 'text-[var(--neon-amber)]' : 'text-[var(--neon-red)]'}`}>
                {creditsChange >= 0 ? '+' : ''}{creditsChange || creditsWon} CR
              </span>
            </div>
          )}

          {/* XP — show if present */}
          {(() => {
            // PvE: xp is { totalXp, ... } directly
            // PvP: xp is { bot1: {totalXp,...}, bot2: {totalXp,...} }
            let totalXp: number | null = null
            if (result.xp?.totalXp) {
              totalXp = result.xp.totalXp
            } else if (result.xp?.bot1 || result.xp?.bot2) {
              const myXp = iAmBot1 ? result.xp.bot1 : result.xp.bot2
              totalXp = myXp?.totalXp ?? null
            }
            return totalXp ? (
              <div className="flex items-center justify-between bg-[var(--bg-void)] border border-[var(--border-dim)] rounded-sm px-4 py-2.5">
                <span className="arena-subtitle text-[10px] text-[var(--text-muted)]">XP EARNED</span>
                <span className="font-mono font-bold text-sm text-[var(--neon-cyan)]">
                  +{totalXp}
                </span>
              </div>
            ) : null
          })()}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-secondary flex-1 py-3"
          >
            HQ
          </button>
          <button
            onClick={() => router.push(isPve ? '/pve' : '/queue')}
            className="btn-primary flex-1 py-3"
          >
            {isPve ? 'TRAIN AGAIN' : 'FIGHT AGAIN'}
          </button>
        </div>
      </div>
    </div>
  )
}
