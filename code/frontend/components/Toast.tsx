'use client'

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { X, Trophy, Swords, Coins, AlertTriangle, CheckCircle, Info } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info' | 'match' | 'credits' | 'achievement'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number // ms, 0 = sticky
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  // Convenience helpers
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
  matchFound: (opponent: string) => void
  creditsEarned: (amount: number, reason?: string) => void
  achievement: (title: string, message?: string) => void
}

// ─── Context ────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

// ─── Icons & Styles ─────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, {
  icon: ReactNode
  border: string
  bg: string
  iconColor: string
}> = {
  success: {
    icon: <CheckCircle className="w-5 h-5" />,
    border: 'border-green-800/50',
    bg: 'bg-green-900/20',
    iconColor: 'text-green-400',
  },
  error: {
    icon: <AlertTriangle className="w-5 h-5" />,
    border: 'border-red-800/50',
    bg: 'bg-red-900/20',
    iconColor: 'text-red-400',
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    border: 'border-blue-800/50',
    bg: 'bg-blue-900/20',
    iconColor: 'text-blue-400',
  },
  match: {
    icon: <Swords className="w-5 h-5" />,
    border: 'border-[var(--neon-cyan)]',
    bg: 'bg-[var(--neon-cyan-dim)]',
    iconColor: 'text-[var(--neon-cyan)]',
  },
  credits: {
    icon: <Coins className="w-5 h-5" />,
    border: 'border-yellow-800/50',
    bg: 'bg-yellow-900/20',
    iconColor: 'text-yellow-400',
  },
  achievement: {
    icon: <Trophy className="w-5 h-5" />,
    border: 'border-amber-800/50',
    bg: 'bg-amber-900/20',
    iconColor: 'text-amber-400',
  },
}

// ─── Toast Item ─────────────────────────────────────────────

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const config = TOAST_CONFIG[toast.type]

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-sm border backdrop-blur-sm shadow-2xl max-w-sm w-full animate-slide-in ${config.border} ${config.bg} bg-[var(--bg-panel)]/90`}
      role="alert"
    >
      <div className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">{toast.title}</div>
        {toast.message && (
          <div className="text-xs text-[var(--text-secondary)] mt-0.5">{toast.message}</div>
        )}
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Provider ───────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const duration = toast.duration ?? 4000

    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]) // Keep max 5

    if (duration > 0) {
      const timer = setTimeout(() => removeToast(id), duration)
      timersRef.current.set(id, timer)
    }
  }, [removeToast])

  // Convenience helpers
  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message })
  }, [addToast])

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message, duration: 6000 })
  }, [addToast])

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message })
  }, [addToast])

  const matchFound = useCallback((opponent: string) => {
    addToast({ type: 'match', title: 'Match Found!', message: `Opponent: ${opponent}`, duration: 5000 })
  }, [addToast])

  const creditsEarned = useCallback((amount: number, reason?: string) => {
    addToast({ type: 'credits', title: `+${amount} AC`, message: reason || 'Credits earned', duration: 4000 })
  }, [addToast])

  const achievement = useCallback((title: string, message?: string) => {
    addToast({ type: 'achievement', title, message, duration: 6000 })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, matchFound, creditsEarned, achievement }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
