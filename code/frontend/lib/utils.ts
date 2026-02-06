import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes with clsx */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format credits with comma separators */
export function formatCredits(credits: number): string {
  return credits.toLocaleString()
}

/** Format ELO rating */
export function formatELO(elo: number): string {
  return elo.toLocaleString()
}

/** Get ELO rank name */
export function getELORank(elo: number): { name: string; color: string } {
  if (elo >= 2000) return { name: 'Legend', color: 'text-yellow-400' }
  if (elo >= 1800) return { name: 'Platinum', color: 'text-cyan-400' }
  if (elo >= 1600) return { name: 'Gold', color: 'text-yellow-500' }
  if (elo >= 1400) return { name: 'Silver', color: 'text-gray-400' }
  return { name: 'Bronze', color: 'text-amber-600' }
}

/** Get match entry fee by type */
export function getEntryFee(matchType: string): number {
  const fees: Record<string, number> = {
    ranked_bronze: 50,
    ranked_silver: 100,
    ranked_gold: 250,
    ranked_platinum: 500,
    ranked_legend: 1000,
  }
  return fees[matchType] ?? 0
}

/** Format time duration (seconds to mm:ss) */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/** Format relative time */
export function timeAgo(date: string | Date): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = now - then

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}
