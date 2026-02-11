'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'bot' | 'user'
  content: string
  timestamp: number
}

interface CoachingChatProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export function CoachingChat({ messages, onSendMessage, disabled = false }: CoachingChatProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  return (
    <div className="bg-[#0a0a1aee] border border-cyan-800/40 rounded-lg backdrop-blur-sm flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-cyan-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            STRATEGY CHAT
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] max-h-[300px] scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-xs font-mono">
            Ask your bot coach for advice...
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'bot'
                    ? 'bg-cyan-900/40 text-cyan-400'
                    : 'bg-purple-900/40 text-purple-400'
                }`}
              >
                {msg.role === 'bot' ? (
                  <Bot className="w-3.5 h-3.5" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
              <div
                className={`flex-1 text-xs p-2 rounded ${
                  msg.role === 'bot'
                    ? 'bg-cyan-900/20 text-gray-300 border border-cyan-800/30'
                    : 'bg-purple-900/20 text-gray-300 border border-purple-800/30'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-800/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            placeholder="Ask about strategy..."
            className="flex-1 bg-gray-900/50 border border-gray-700 rounded px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white p-2 rounded transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
