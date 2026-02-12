'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Terminal, Settings, Play, RefreshCw } from 'lucide-react'

export function OpenClawSetup() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-amber-900/10 border border-amber-600/30 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-amber-900/20 transition"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-amber-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            SETUP OPENCLAW BOT
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-amber-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-400" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-4 border-t border-amber-600/20 space-y-4">
          <p className="text-xs text-gray-300">
            Connect your personal AI coach to receive real-time combat suggestions and strategy advice.
          </p>

          <div className="space-y-3">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-600/20 border border-amber-600/40 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-amber-400">1</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white mb-1">Install OpenClaw CLI</div>
                <div className="bg-gray-900/50 border border-gray-700 rounded p-2 font-mono text-xs text-cyan-400">
                  npm install -g openclaw
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-600/20 border border-amber-600/40 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-amber-400">2</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white mb-1">Configure Arena Plugin</div>
                <div className="bg-gray-900/50 border border-gray-700 rounded p-2 font-mono text-xs text-cyan-400">
                  openclaw arena config
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Follow prompts to link your Arena account
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-600/20 border border-amber-600/40 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-amber-400">3</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white mb-1">Start Your Bot</div>
                <div className="bg-gray-900/50 border border-gray-700 rounded p-2 font-mono text-xs text-cyan-400">
                  openclaw arena connect
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Keep this running while you play
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-600/20 border border-amber-600/40 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-amber-400">4</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white mb-1">Refresh This Page</div>
                <p className="text-xs text-gray-300">
                  The connection status will update automatically
                </p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="pt-3 border-t border-amber-600/20 flex gap-3">
            <a
              href="https://openclaw.dev/docs/arena"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center text-xs font-bold text-amber-400 hover:text-amber-300 underline"
            >
              View Documentation
            </a>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 flex items-center justify-center gap-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/40 rounded px-3 py-2 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-400">Refresh</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
