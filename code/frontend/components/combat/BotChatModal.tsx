'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2 } from 'lucide-react'

interface ChatMessage {
  role: 'human' | 'bot'
  content: string
  timestamp: number
}

interface BotChatModalProps {
  /** Called when human sends a message */
  onSendMessage: (message: string) => Promise<string>
  /** Called when modal is closed */
  onClose: () => void
  /** Current combat context (for display) */
  context?: {
    round: number
    yourHp: number
    opponentHp: number
    yourEnergy: number
  }
}

export function BotChatModal({
  onSendMessage,
  onClose,
  context,
}: BotChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || sending) return

    const userMessage: ChatMessage = {
      role: 'human',
      content: input.trim(),
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setSending(true)

    try {
      const response = await onSendMessage(userMessage.content)
      const botMessage: ChatMessage = {
        role: 'bot',
        content: response,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'bot',
        content: '⚠️ Error communicating with bot. Please try again.',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setSending(false)
    }
  }

  const quickQuestions = [
    "What's their pattern?",
    "Should I save energy?",
    "When should I strike?",
    "What's our win condition?",
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="panel p-0 max-w-2xl w-full h-[600px] mx-4 corner-brackets border-purple-600/40 flex flex-col">
        {/* Header */}
        <div className="bg-purple-900/20 px-4 py-3 border-b border-purple-600/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <div>
              <h2 className="arena-title text-sm">Strategy Discussion</h2>
              {context && (
                <div className="text-[9px] text-purple-400 font-mono">
                  Round {context.round} • HP: {context.yourHp} vs {context.opponentHp} • Energy: {context.yourEnergy}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🤖</div>
              <p className="text-xs text-gray-400 mb-4">
                Ask your bot for strategic advice during combat
              </p>
              <div className="max-w-sm mx-auto text-left space-y-2">
                <p className="text-[10px] text-gray-500 font-mono">Quick questions:</p>
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="block w-full text-left px-3 py-2 bg-[var(--bg-raised)] hover:bg-[var(--bg-panel)] border border-[var(--border-dim)] hover:border-purple-600/40 rounded-sm text-[10px] text-gray-300 transition-all"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'human' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-sm p-3 ${
                  msg.role === 'human'
                    ? 'bg-blue-900/40 border border-blue-600/40'
                    : 'bg-purple-900/20 border border-purple-600/30'
                }`}
              >
                <div className="text-[9px] text-gray-400 font-mono mb-1">
                  {msg.role === 'human' ? 'You' : '🤖 Bot'}
                </div>
                <p className="text-xs text-white leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-purple-900/20 border border-purple-600/30 rounded-sm p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-xs text-purple-400">Bot is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-purple-600/20 p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask your bot anything..."
              disabled={sending}
              className="flex-1 bg-[var(--bg-raised)] border border-[var(--border-mid)] rounded-sm px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:border-purple-600/60 focus:outline-none transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-sm transition-all flex items-center gap-2"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          <div className="mt-2 text-[9px] text-gray-500 font-mono text-center">
            Costs -0.5 Focus Points per message
          </div>
        </div>
      </div>
    </div>
  )
}
