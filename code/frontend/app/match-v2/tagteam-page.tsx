'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Navbar } from '@/components/Navbar'
import { BotSuggestionPanel } from '@/components/BotSuggestionPanel'
import { FocusPointTracker } from '@/components/FocusPointTracker'
import { CoachingChat } from '@/components/CoachingChat'
import { Play, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react'
import { 
  BotSuggestion, 
  ChatMessage, 
  DecisionRecord, 
  FocusPointState,
  SKILL_DATABASE,
  SkillData 
} from '@/lib/tagteam-types'

// Import existing components from match-v2/page.tsx
// (BotSprite, HPPanel, all effects, arena themes, etc. would be imported here)
// For now, simplified demo with mock data

interface DemoRound {
  round: number
  botSuggestion: BotSuggestion
  playerDecision: 'accept' | 'override' | null
  actualSkillUsed: string
  damage: number
  success: boolean
}

// Mock bot AI that generates suggestions
function generateBotSuggestion(round: number, opponentHp: number, playerEnergy: number): BotSuggestion {
  const availableSkills = Object.values(SKILL_DATABASE).filter(
    skill => skill.energyCost <= playerEnergy
  )

  // Simple AI logic
  let selectedSkill: SkillData
  let reasoning: string[] = []
  let confidence = 75
  let riskLevel: 'low' | 'medium' | 'high' = 'medium'

  if (opponentHp < 30) {
    // Finish them!
    selectedSkill = SKILL_DATABASE['reasoning_burst']
    reasoning = [
      'Opponent HP critical (<30)',
      'High damage burst recommended',
      'Energy sufficient for finishing move',
    ]
    confidence = 90
    riskLevel = 'low'
  } else if (playerEnergy < 30) {
    // Conserve energy
    selectedSkill = SKILL_DATABASE['power_strike']
    reasoning = [
      'Energy reserves low',
      'Reliable damage with minimal cost',
      'Preserve energy for critical moments',
    ]
    confidence = 80
    riskLevel = 'low'
  } else if (round % 3 === 0) {
    // Mix it up with tactical
    selectedSkill = SKILL_DATABASE['emp_pulse']
    reasoning = [
      'Drain opponent energy',
      'Limit their offensive options',
      'Creates strategic advantage',
    ]
    confidence = 70
    riskLevel = 'medium'
  } else {
    // Default to aggression
    selectedSkill = availableSkills.find(s => s.type === 'aggressive') || SKILL_DATABASE['power_strike']
    reasoning = [
      'Maintain offensive pressure',
      'Favorable damage trade-off',
      'Build momentum',
    ]
    confidence = 75
    riskLevel = 'medium'
  }

  const counters = selectedSkill.countered_by.map(id => SKILL_DATABASE[id]?.name || id)
  const avgDamage = Math.floor((selectedSkill.damage_range[0] + selectedSkill.damage_range[1]) / 2)

  return {
    suggestionId: `suggestion_${round}_${Date.now()}`,
    skillId: selectedSkill.id,
    skillName: selectedSkill.name,
    emoji: selectedSkill.emoji,
    confidence,
    reasoning,
    counters,
    expectedDamage: avgDamage,
    riskLevel,
    timestamp: Date.now(),
  }
}

export default function TagTeamMatchPage() {
  // Match state
  const [round, setRound] = useState(1)
  const [phase, setPhase] = useState<'idle' | 'waiting' | 'result'>('idle')
  const [playerHp, setPlayerHp] = useState(100)
  const [opponentHp, setOpponentHp] = useState(100)
  const [playerEnergy, setPlayerEnergy] = useState(100)
  const [timeRemaining, setTimeRemaining] = useState(20)

  // Tag team state
  const [focusPoints, setFocusPoints] = useState<FocusPointState>({
    current: 3,
    max: 5,
    last_regen_round: 0,
  })
  const [currentSuggestion, setCurrentSuggestion] = useState<BotSuggestion | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'bot',
      content: 'Ready to assist! I\'ll analyze the match and suggest optimal moves. You can always override my suggestions.',
      timestamp: Date.now(),
    },
  ])
  const [decisions, setDecisions] = useState<DecisionRecord[]>([])
  const [actionLog, setActionLog] = useState<string[]>([])

  const logRef = useRef<HTMLDivElement>(null)

  // Timer
  useEffect(() => {
    if (phase === 'waiting' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [phase, timeRemaining])

  // Auto-generate suggestion when round starts
  useEffect(() => {
    if (phase === 'waiting' && !currentSuggestion) {
      const suggestion = generateBotSuggestion(round, opponentHp, playerEnergy)
      setCurrentSuggestion(suggestion)
      addLog(`🤖 Bot suggests: ${suggestion.skillName} ${suggestion.emoji} (${suggestion.confidence}% confidence)`)
    }
  }, [phase, round, currentSuggestion, opponentHp, playerEnergy])

  // Focus point regeneration
  useEffect(() => {
    if (round > 0 && round % 3 === 0 && round !== focusPoints.last_regen_round) {
      setFocusPoints(prev => ({
        ...prev,
        current: Math.min(prev.current + 1, prev.max),
        last_regen_round: round,
      }))
      addLog('⭐ +1 Focus Point regenerated!')
    }
  }, [round, focusPoints.last_regen_round])

  const addLog = useCallback((msg: string) => {
    setActionLog(prev => [...prev, msg])
    setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }), 50)
  }, [])

  const handleAccept = () => {
    if (!currentSuggestion) return
    
    addLog(`✅ Accepted bot suggestion: ${currentSuggestion.skillName}`)
    executeRound(currentSuggestion.skillId, 'bot', false)
  }

  const handleOverride = () => {
    if (!currentSuggestion || focusPoints.current <= 0) return

    setFocusPoints(prev => ({ ...prev, current: prev.current - 1 }))
    addLog(`⚠️ Override! -1 Focus Point (${focusPoints.current - 1} remaining)`)
    
    // For demo, just use a different skill
    const alternativeSkill = 'firewall'
    executeRound(alternativeSkill, 'human', true)
  }

  const handleDiscuss = () => {
    if (!currentSuggestion) return
    
    const question = `Why ${currentSuggestion.skillName}?`
    const botResponse: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'bot',
      content: `${currentSuggestion.skillName} is optimal because: ${currentSuggestion.reasoning[0]}. The opponent has ${opponentHp} HP and we have ${playerEnergy} energy available.`,
      timestamp: Date.now(),
    }
    
    setChatMessages(prev => [
      ...prev,
      { id: `user_${Date.now()}`, role: 'user', content: question, timestamp: Date.now() },
      botResponse,
    ])
  }

  const handleChatMessage = (message: string) => {
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now(),
    }

    // Simple bot response
    const botMsg: ChatMessage = {
      id: `bot_${Date.now() + 1}`,
      role: 'bot',
      content: `I recommend staying aggressive while conserving energy. Focus on skills that provide good damage-to-cost ratio.`,
      timestamp: Date.now() + 100,
    }

    setChatMessages(prev => [...prev, userMsg, botMsg])
  }

  const executeRound = (skillId: string, source: 'bot' | 'human', wasOverride: boolean) => {
    const skill = SKILL_DATABASE[skillId]
    if (!skill) return

    const damage = Math.floor(
      skill.damage_range[0] + Math.random() * (skill.damage_range[1] - skill.damage_range[0])
    )

    const decision: DecisionRecord = {
      round,
      decision_source: source,
      skill_used: skill.name,
      was_override: wasOverride,
      damage_dealt: damage,
      was_successful: damage >= skill.damage_range[0],
    }

    setDecisions(prev => [...prev, decision])
    setOpponentHp(prev => Math.max(0, prev - damage))
    setPlayerEnergy(prev => Math.max(0, prev - skill.energyCost))

    addLog(`⚔️ Used ${skill.name} — ${damage} damage dealt!`)
    addLog(`🔋 Energy: ${playerEnergy - skill.energyCost}`)

    // Opponent attacks back (simplified)
    setTimeout(() => {
      const opponentDamage = 10 + Math.floor(Math.random() * 8)
      setPlayerHp(prev => Math.max(0, prev - opponentDamage))
      addLog(`🤖 Opponent attacks — ${opponentDamage} damage received!`)

      // Check win condition
      if (opponentHp - damage <= 0) {
        setPhase('result')
        addLog('🏆 VICTORY!')
      } else if (playerHp - opponentDamage <= 0) {
        setPhase('result')
        addLog('💀 DEFEAT!')
      } else {
        // Next round
        setRound(prev => prev + 1)
        setPlayerEnergy(prev => Math.min(100, prev + 10)) // Regen
        setCurrentSuggestion(null)
        setTimeRemaining(20)
        setPhase('waiting')
      }
    }, 1500)

    setPhase('idle')
    setCurrentSuggestion(null)
  }

  const startMatch = () => {
    setRound(1)
    setPhase('waiting')
    setPlayerHp(100)
    setOpponentHp(100)
    setPlayerEnergy(100)
    setTimeRemaining(20)
    setFocusPoints({ current: 3, max: 5, last_regen_round: 0 })
    setDecisions([])
    setActionLog([])
    setCurrentSuggestion(null)
    setChatMessages([
      {
        id: '1',
        role: 'bot',
        content: 'Match started! I\'ll provide strategic suggestions each round.',
        timestamp: Date.now(),
      },
    ])
  }

  const roundsUntilRegen = round === 0 ? 3 : 3 - (round % 3)
  const botDecisions = decisions.filter(d => d.decision_source === 'bot').length
  const humanOverrides = decisions.filter(d => d.was_override).length
  const overrideSuccessRate = humanOverrides > 0
    ? Math.round((decisions.filter(d => d.was_override && d.was_successful).length / humanOverrides) * 100)
    : 0

  return (
    <div className="min-h-screen bg-[#050510]">
      <Navbar />

      {/* Header */}
      <div className="sticky top-12 z-50 bg-[#0a0a1aee] border-b border-gray-800 px-4 py-3 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              TAG TEAM COMBAT
            </h1>
            <div className="text-xs text-gray-500 font-mono">
              Bot + Human Collaborative Strategy
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-mono text-gray-400">
              Round {round}/∞
            </div>
            <button
              onClick={startMatch}
              disabled={phase === 'waiting'}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded transition"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              <Play className="w-4 h-4" />
              {phase === 'idle' ? 'START MATCH' : 'RESTART'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-12 gap-4">
        {/* Left Column - Combat View */}
        <div className="col-span-8 space-y-4">
          {/* Arena */}
          <div className="bg-[#0a0a1a] border border-gray-800 rounded-lg p-6 aspect-video flex items-center justify-center relative overflow-hidden">
            {/* Simplified arena visualization */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a2a] via-[#050515] to-[#0a0a1a]" />
            
            {/* Grid */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{ perspective: '400px' }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(rgba(0,240,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.07) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                transform: 'rotateX(60deg)',
                transformOrigin: 'bottom',
              }} />
            </div>

            {/* Bots */}
            <div className="absolute bottom-12 left-12 text-center">
              <div className="text-6xl mb-2">🤖</div>
              <div className="bg-[#0a0a1aee] border border-cyan-800/40 rounded px-3 py-2">
                <div className="text-xs font-bold text-cyan-400 mb-1">YOU</div>
                <div className="text-sm font-mono text-white">HP: {playerHp}/100</div>
                <div className="text-xs font-mono text-cyan-400">⚡ {playerEnergy}</div>
              </div>
            </div>

            <div className="absolute top-12 right-12 text-center">
              <div className="text-6xl mb-2">👾</div>
              <div className="bg-[#0a0a1aee] border border-red-800/40 rounded px-3 py-2">
                <div className="text-xs font-bold text-red-400 mb-1">OPPONENT</div>
                <div className="text-sm font-mono text-white">HP: {opponentHp}/100</div>
              </div>
            </div>

            {/* Phase indicator */}
            {phase === 'waiting' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-black text-cyan-400 mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    ROUND {round}
                  </div>
                  <div className="text-xl font-mono text-gray-400">
                    {timeRemaining}s
                  </div>
                </div>
              </div>
            )}

            {phase === 'result' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-center">
                  <div className="text-6xl font-black text-cyan-400 mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {opponentHp <= 0 ? 'VICTORY!' : 'DEFEAT!'}
                  </div>
                  <div className="text-lg text-gray-300 mb-6">
                    Match ended in {round} rounds
                  </div>
                  <div className="bg-[#0a0a1aee] border border-cyan-800/40 rounded-lg p-4 inline-block">
                    <div className="text-sm font-bold text-cyan-400 mb-3">OVERRIDE REPORT</div>
                    <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                      <div>
                        <div className="text-gray-400">Bot Decisions</div>
                        <div className="text-white font-bold">{botDecisions}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Human Overrides</div>
                        <div className="text-amber-400 font-bold">{humanOverrides}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-gray-400">Override Success</div>
                        <div className="text-green-400 font-bold">{overrideSuccessRate}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Log */}
          <div className="bg-[#0a0a1a] border border-gray-800 rounded-lg p-4">
            <div className="text-xs font-bold text-gray-400 mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              COMBAT LOG
            </div>
            <div
              ref={logRef}
              className="h-32 overflow-y-auto scrollbar-thin space-y-1"
            >
              {actionLog.length === 0 ? (
                <div className="text-gray-600 text-xs font-mono text-center py-4">
                  // awaiting match start
                </div>
              ) : (
                actionLog.map((log, i) => (
                  <div key={i} className="text-xs font-mono text-gray-300">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Tag Team Interface */}
        <div className="col-span-4 space-y-4">
          {/* Focus Points */}
          <FocusPointTracker
            current={focusPoints.current}
            max={focusPoints.max}
            roundsUntilRegen={roundsUntilRegen}
          />

          {/* Bot Suggestion */}
          <BotSuggestionPanel
            suggestion={currentSuggestion}
            timeRemaining={timeRemaining}
            focusPoints={focusPoints.current}
            onAccept={handleAccept}
            onOverride={handleOverride}
            onDiscuss={handleDiscuss}
            disabled={phase !== 'waiting'}
          />

          {/* Coaching Chat */}
          <CoachingChat
            messages={chatMessages}
            onSendMessage={handleChatMessage}
            disabled={phase === 'result'}
          />
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}
