'use client'

import { Wifi, WifiOff, Loader2 } from 'lucide-react'

export type OpenClawConnectionState = 'connected' | 'disconnected' | 'connecting'

interface OpenClawStatusProps {
  status: OpenClawConnectionState
  model?: string
  provider?: string
  botName?: string
  compact?: boolean
}

export function OpenClawStatus({
  status,
  model,
  provider,
  botName,
  compact = false,
}: OpenClawStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="w-3.5 h-3.5" />,
          text: compact ? 'Connected' : `OpenClaw Connected${model ? ` • ${formatModelName(model)}` : ''}`,
          color: 'text-green-400',
          bg: 'bg-green-900/20',
          border: 'border-green-600/40',
        }
      case 'connecting':
        return {
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
          text: 'Connecting to OpenClaw...',
          color: 'text-blue-400',
          bg: 'bg-blue-900/20',
          border: 'border-blue-600/40',
        }
      case 'disconnected':
      default:
        return {
          icon: <WifiOff className="w-3.5 h-3.5" />,
          text: 'OpenClaw Not Connected',
          color: 'text-amber-400',
          bg: 'bg-amber-900/20',
          border: 'border-amber-600/40',
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bg} ${config.border} ${config.color}`}
    >
      {config.icon}
      <span className="text-xs font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
        {config.text}
      </span>
    </div>
  )
}

function formatModelName(model: string): string {
  // Convert model IDs to friendly names
  const modelMap: Record<string, string> = {
    'claude-opus-4-6': 'Claude Opus 4.6',
    'claude-opus-4': 'Claude Opus 4',
    'claude-sonnet-4-5': 'Claude Sonnet 4.5',
    'claude-sonnet-4': 'Claude Sonnet 4',
    'groq-llama-3-3-70b': 'Groq Llama 3.3 70B',
    'gpt-4': 'GPT-4',
    'gpt-4-turbo': 'GPT-4 Turbo',
  }

  return modelMap[model] || model.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}
