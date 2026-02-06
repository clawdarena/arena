import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

/**
 * Local combat log that writes match history to JSON files.
 * Stored in ~/.openclaw-arena/logs/
 *
 * PRIVACY: All bot reasoning, full responses, and strategy details
 * stay local in these logs. Only actions were sent to the server.
 */

const LOGS_DIR = path.join(os.homedir(), '.openclaw-arena', 'logs')

export interface MatchLogEntry {
  match_id: string
  match_type: string
  opponent_name: string
  opponent_elo: number
  result: 'win' | 'loss' | 'draw'
  rounds_fought: number
  duration_seconds: number
  elo_before: number
  elo_after: number
  elo_change: number
  credits_change: number
  timestamp: string
}

export interface RoundLogEntry {
  round: number
  my_hp: number
  opponent_hp: number
  my_action: string
  my_target: string | null
  opponent_action: string | null
  damage_dealt: number
  damage_received: number
  response_time_ms: number
  bot_reasoning: string | null   // Full bot reasoning — stays LOCAL
  bot_full_response: string | null  // Raw bot output — stays LOCAL
}

export interface FullMatchLog {
  match: MatchLogEntry
  rounds: RoundLogEntry[]
}

/**
 * Ensure the logs directory exists.
 */
function ensureLogsDir(): void {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true })
  }
}

/**
 * Get the path for the match history file.
 */
function getHistoryPath(): string {
  return path.join(LOGS_DIR, 'match-history.json')
}

/**
 * Get the path for a specific match's detailed log.
 */
function getMatchLogPath(matchId: string): string {
  return path.join(LOGS_DIR, `match-${matchId}.json`)
}

/**
 * Save a complete match log (summary + round details).
 */
export function saveMatchLog(log: FullMatchLog): void {
  ensureLogsDir()

  // Save detailed match log
  const matchPath = getMatchLogPath(log.match.match_id)
  fs.writeFileSync(matchPath, JSON.stringify(log, null, 2), 'utf-8')

  // Append to match history
  const historyPath = getHistoryPath()
  let history: MatchLogEntry[] = []

  if (fs.existsSync(historyPath)) {
    try {
      const raw = fs.readFileSync(historyPath, 'utf-8')
      history = JSON.parse(raw)
    } catch {
      // Corrupted file, start fresh
      history = []
    }
  }

  history.push(log.match)
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8')
}

/**
 * Load match history (summaries only).
 */
export function loadMatchHistory(limit?: number): MatchLogEntry[] {
  const historyPath = getHistoryPath()

  if (!fs.existsSync(historyPath)) {
    return []
  }

  try {
    const raw = fs.readFileSync(historyPath, 'utf-8')
    const history: MatchLogEntry[] = JSON.parse(raw)

    // Return most recent first
    const sorted = history.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return limit ? sorted.slice(0, limit) : sorted
  } catch {
    return []
  }
}

/**
 * Load a detailed match log by match ID.
 */
export function loadMatchLog(matchId: string): FullMatchLog | null {
  const matchPath = getMatchLogPath(matchId)

  if (!fs.existsSync(matchPath)) {
    return null
  }

  try {
    const raw = fs.readFileSync(matchPath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Get total stats from match history.
 */
export function getLocalStats(): {
  totalMatches: number
  wins: number
  losses: number
  draws: number
  winRate: string
  totalCreditsChange: number
  totalEloChange: number
} {
  const history = loadMatchHistory()

  const wins = history.filter((m) => m.result === 'win').length
  const losses = history.filter((m) => m.result === 'loss').length
  const draws = history.filter((m) => m.result === 'draw').length
  const totalCreditsChange = history.reduce((sum, m) => sum + m.credits_change, 0)
  const totalEloChange = history.reduce((sum, m) => sum + m.elo_change, 0)
  const winRate = history.length > 0
    ? ((wins / history.length) * 100).toFixed(1)
    : '0.0'

  return {
    totalMatches: history.length,
    wins,
    losses,
    draws,
    winRate,
    totalCreditsChange,
    totalEloChange,
  }
}
