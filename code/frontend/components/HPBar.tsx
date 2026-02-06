'use client'

interface HPBarProps {
  current: number
  max: number
  label?: string
  showText?: boolean
}

/**
 * Animated HP bar component.
 * Color transitions: green (>50%) → yellow (25-50%) → red (<25%)
 */
export function HPBar({ current, max, label, showText = true }: HPBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100))

  let barColor = 'bg-green-500'
  let glowColor = 'shadow-green-500/30'
  if (percentage <= 25) {
    barColor = 'bg-red-500'
    glowColor = 'shadow-red-500/30'
  } else if (percentage <= 50) {
    barColor = 'bg-yellow-500'
    glowColor = 'shadow-yellow-500/30'
  }

  return (
    <div className="w-full">
      {(label || showText) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs text-gray-400">{label}</span>}
          {showText && (
            <span className="text-xs font-mono text-gray-300">
              {current}/{max}
            </span>
          )}
        </div>
      )}
      <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <div
          className={`h-full ${barColor} ${glowColor} shadow-lg rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
