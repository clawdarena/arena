'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// ============================================================
// Types
// ============================================================

export type BotAnim = 'idle' | 'hit' | 'attack-right' | 'attack-left' | 'dead' | 'taunt' | 'dance'

export interface BattleRoundData {
  round: number
  bot1Action: string
  bot1SkillId?: string
  bot2Action: string
  bot2SkillId?: string
  bot1Dmg: number
  bot2Dmg: number
  bot1HpAfter: number
  bot2HpAfter: number
  bot1Counter: string
  bot2Counter: string
  bot1Energy: number
  bot2Energy: number
  effectsApplied: Array<{ bot: string; effect: string; duration: number; value?: number }>
}

export interface BattleBot {
  name: string
  maxHp: number
  color: string
}

interface BattleArenaProps {
  bot1: BattleBot
  bot2: BattleBot
  round: BattleRoundData | null
  phase: 'waiting' | 'fighting' | 'result'
  winner?: 'bot1' | 'bot2' | 'draw' | null
  onAnimationComplete?: () => void
}

// Bot positions (%) — effects target these exactly
const BOT1_POS = { x: 18, y: 62 }
const BOT2_POS = { x: 72, y: 22 }

// ============================================================
// Skill Name Mapping (ID → display name)
// ============================================================

const SKILL_NAMES: Record<string, { name: string; emoji: string; type: string }> = {
  firewall: { name: 'Firewall', emoji: '🛡️', type: 'defensive' },
  iron_fortress: { name: 'Iron Fortress', emoji: '🏰', type: 'defensive' },
  mirror_coat: { name: 'Mirror Coat', emoji: '🪞', type: 'defensive' },
  rollback: { name: 'Rollback', emoji: '💚', type: 'defensive' },
  power_strike: { name: 'Power Strike', emoji: '⚔️', type: 'aggressive' },
  reasoning_burst: { name: 'Reasoning Burst', emoji: '⚡', type: 'aggressive' },
  spawn_attack: { name: 'Spawn Attack', emoji: '👻', type: 'aggressive' },
  berserker_rush: { name: 'Berserker Rush', emoji: '😤', type: 'aggressive' },
  sleep_bomb: { name: 'Sleep Bomb', emoji: '💤', type: 'tactical' },
  emp_pulse: { name: 'EMP Pulse', emoji: '🔋', type: 'tactical' },
  time_bomb: { name: 'Time Bomb', emoji: '💣', type: 'tactical' },
  overclock: { name: 'Overclock', emoji: '⏫', type: 'tactical' },
  scan: { name: 'Scan', emoji: '🔍', type: 'exploit' },
  prompt_injection: { name: 'Prompt Injection', emoji: '💉', type: 'exploit' },
  memory_bomb: { name: 'Memory Bomb', emoji: '🧠', type: 'exploit' },
  virus: { name: 'Virus', emoji: '🦠', type: 'exploit' },
}

function getSkillDisplay(skillId: string) {
  return SKILL_NAMES[skillId] || { name: skillId, emoji: '⚔️', type: 'aggressive' }
}

function getMoveName(action: string, skillId?: string): string {
  if (action === 'skill' && skillId) return getSkillDisplay(skillId).name
  if (action === 'attack') return 'Basic Attack'
  if (action === 'defend') return 'Defend'
  return action
}

// ============================================================
// Arena Themes
// ============================================================

interface ArenaTheme { name: string; bg: string; grid: string; particles: string[]; glow: string }

const ARENAS: ArenaTheme[] = [
  { name: 'TRON GRID', bg: 'linear-gradient(180deg, #0a0a2a 0%, #050515 50%, #0a0a1a 100%)', grid: 'rgba(0,240,255,0.07)', particles: ['#00f0ff','#ffaa00','#fff'], glow: 'radial-gradient(ellipse at 50% 80%, rgba(0,240,255,0.05) 0%, transparent 60%)' },
  { name: 'INFERNO', bg: 'linear-gradient(180deg, #1a0505 0%, #0d0202 50%, #1a0808 100%)', grid: 'rgba(255,60,20,0.06)', particles: ['#ff4020','#ff8800','#ffcc00'], glow: 'radial-gradient(ellipse at 50% 80%, rgba(255,60,20,0.08) 0%, transparent 60%)' },
  { name: 'VOID', bg: 'linear-gradient(180deg, #050510 0%, #020208 50%, #000 100%)', grid: 'rgba(100,60,255,0.05)', particles: ['#8040ff','#4020cc','#fff'], glow: 'radial-gradient(ellipse at 50% 80%, rgba(100,60,255,0.06) 0%, transparent 60%)' },
]

const TYPE_COLORS: Record<string, string> = { aggressive: '#ff4040', defensive: '#00f0ff', tactical: '#ffaa00', exploit: '#c084fc' }

// ============================================================
// HP Panel
// ============================================================

function HPPanel({ name, hp, maxHp, energy, side, showDmg, dmgAmount, isCounter }: {
  name: string; hp: number; maxHp: number; energy: number
  side: 'player' | 'opponent'; showDmg: boolean; dmgAmount: number; isCounter: boolean
}) {
  const [displayHp, setDisplayHp] = useState(hp)
  const [delayHp, setDelayHp] = useState(hp)
  const pct = Math.max(0, (displayHp / maxHp) * 100)
  const delayPct = Math.max(0, (delayHp / maxHp) * 100)
  const epct = Math.max(0, (energy / 100) * 100)
  const barColor = pct > 50 ? '#40ff40' : pct > 25 ? '#ffaa00' : '#ff4040'

  useEffect(() => {
    setDisplayHp(hp)
    const t = setTimeout(() => setDelayHp(hp), 800)
    return () => clearTimeout(t)
  }, [hp])

  return (
    <div className={`relative ${side === 'opponent' ? 'text-right' : ''}`}>
      <div className={`inline-block bg-[#0a0a1aee] border rounded-lg px-4 py-2.5 backdrop-blur-sm min-w-[220px] sm:min-w-[260px] ${side === 'opponent' ? 'border-red-800/40' : 'border-cyan-800/40'}`}>
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-bold text-sm text-white tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>{name}</span>
        </div>
        <div className="relative h-3.5 bg-gray-800 rounded-full overflow-hidden mb-1 border border-gray-700/50">
          <div className="absolute inset-0 h-full rounded-full transition-all duration-[800ms] ease-out" style={{ width: `${delayPct}%`, background: '#991b1b' }} />
          <div className="absolute inset-0 h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${pct}%`, background: barColor, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }} />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-1.5">
          <span>{Math.max(0, displayHp)}/{maxHp}</span>
          <span className="text-cyan-400">⚡ {energy}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/30">
          <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${epct}%` }} />
        </div>
      </div>
      {showDmg && dmgAmount > 0 && (
        <div className={`absolute ${side === 'opponent' ? '-left-6' : '-right-6'} -top-10 animate-dmg-float-slow`}>
          <span className={`text-3xl sm:text-4xl font-black font-mono ${isCounter ? 'text-amber-300' : 'text-red-400'}`} style={{
            textShadow: `0 0 15px ${isCounter ? '#ffaa00' : '#ff4040'}, 0 2px 4px rgba(0,0,0,0.8)`,
          }}>-{dmgAmount}</span>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Bot Sprite (Mech-Crab SVG)
// ============================================================

function BotSprite({ side, color, anim }: { side: 'player' | 'opponent'; color: string; anim: BotAnim }) {
  const cls = [
    'transition-all duration-300',
    anim === 'hit' ? 'animate-bot-hit-slow' : '',
    anim === 'attack-right' ? 'animate-lunge-right-slow' : '',
    anim === 'attack-left' ? 'animate-lunge-left-slow' : '',
    anim === 'dead' ? 'opacity-20 translate-y-6 rotate-[15deg] transition-all duration-1000' : '',
    anim === 'taunt' ? 'animate-taunt' : '',
    anim === 'dance' ? 'animate-dance' : '',
    anim === 'idle' ? 'animate-idle-bob' : '',
  ].join(' ')

  const isCyan = color.includes('00f0ff')
  const bodyDark = isCyan ? '#0e1e2e' : '#1a0808'
  const bodyMid = isCyan ? '#1a3550' : '#3a1010'
  const bodyBright = isCyan ? '#2a5578' : '#6a1a1a'
  const plateColor = isCyan ? '#3a7090' : '#8a2525'
  const filterId = side === 'player' ? 'glow-p' : 'glow-o'
  const hitFilter = anim === 'hit' ? 'brightness(4) saturate(0)' : 'none'

  if (side === 'player') {
    return (
      <div className={`relative ${cls}`} style={{ filter: hitFilter }}>
        <svg viewBox="0 0 140 130" className="w-36 h-44 sm:w-44 sm:h-52 drop-shadow-lg">
          <defs>
            <filter id={filterId}><feGaussianBlur stdDeviation="2.5" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <linearGradient id={`shell-grad-${side}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={bodyBright} /><stop offset="50%" stopColor={bodyMid} /><stop offset="100%" stopColor={bodyDark} />
            </linearGradient>
          </defs>
          <ellipse cx="70" cy="125" rx="45" ry="5" fill={color} opacity="0.1" />
          <line x1="30" y1="80" x2="8" y2="105" stroke={bodyMid} strokeWidth="4" strokeLinecap="round" />
          <line x1="8" y1="105" x2="5" y2="120" stroke={bodyMid} strokeWidth="3" strokeLinecap="round" />
          <circle cx="5" cy="120" r="2" fill={color} opacity="0.6" />
          <line x1="110" y1="80" x2="132" y2="105" stroke={bodyMid} strokeWidth="4" strokeLinecap="round" />
          <line x1="132" y1="105" x2="135" y2="120" stroke={bodyMid} strokeWidth="3" strokeLinecap="round" />
          <circle cx="135" cy="120" r="2" fill={color} opacity="0.6" />
          <line x1="28" y1="75" x2="3" y2="95" stroke={bodyMid} strokeWidth="4" strokeLinecap="round" />
          <line x1="3" y1="95" x2="2" y2="112" stroke={bodyMid} strokeWidth="3" strokeLinecap="round" />
          <line x1="112" y1="75" x2="137" y2="95" stroke={bodyMid} strokeWidth="4" strokeLinecap="round" />
          <line x1="137" y1="95" x2="138" y2="112" stroke={bodyMid} strokeWidth="3" strokeLinecap="round" />
          <line x1="32" y1="85" x2="12" y2="115" stroke={bodyMid} strokeWidth="4" strokeLinecap="round" />
          <line x1="108" y1="85" x2="128" y2="115" stroke={bodyMid} strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="70" cy="60" rx="45" ry="35" fill={`url(#shell-grad-${side})`} stroke={bodyBright} strokeWidth="1.5" />
          <ellipse cx="70" cy="52" rx="38" ry="10" fill="none" stroke={plateColor} strokeWidth="1.2" opacity="0.5" />
          <line x1="70" y1="28" x2="70" y2="85" stroke={plateColor} strokeWidth="2" opacity="0.4" />
          <rect x="55" y="38" width="30" height="14" rx="3" fill={bodyDark} stroke={color} strokeWidth="0.8" opacity="0.6" />
          <path d="M25,60 L8,48 L2,35" stroke={bodyMid} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M2,35 L-5,25" stroke={plateColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M2,35 L6,22" stroke={plateColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx="2" cy="35" r="3.5" fill={bodyDark} stroke={color} strokeWidth="1" />
          <path d="M115,60 L132,48 L138,35" stroke={bodyMid} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M138,35 L145,25" stroke={plateColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M138,35 L134,22" stroke={plateColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx="138" cy="35" r="3.5" fill={bodyDark} stroke={color} strokeWidth="1" />
          <line x1="55" y1="30" x2="52" y2="20" stroke={bodyMid} strokeWidth="2" />
          <circle cx="52" cy="19" r="2.5" fill={color} opacity="0.7"><animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" repeatCount="indefinite" /></circle>
          <line x1="85" y1="30" x2="88" y2="20" stroke={bodyMid} strokeWidth="2" />
          <circle cx="88" cy="19" r="2.5" fill={color} opacity="0.7"><animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" repeatCount="indefinite" begin="0.5s" /></circle>
          <ellipse cx="70" cy="60" rx="45" ry="35" fill="none" stroke={color} strokeWidth="1" opacity="0.2" filter={`url(#${filterId})`} />
        </svg>
      </div>
    )
  }

  return (
    <div className={`relative ${cls}`} style={{ filter: hitFilter }}>
      <svg viewBox="0 0 140 130" className="w-32 h-40 sm:w-40 sm:h-48 drop-shadow-lg">
        <defs>
          <filter id={filterId}><feGaussianBlur stdDeviation="2.5" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id={`shell-grad-${side}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bodyBright} /><stop offset="50%" stopColor={bodyMid} /><stop offset="100%" stopColor={bodyDark} />
          </linearGradient>
        </defs>
        <ellipse cx="70" cy="125" rx="40" ry="4" fill={color} opacity="0.1" />
        <line x1="30" y1="80" x2="8" y2="105" stroke={bodyMid} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="8" y1="105" x2="5" y2="118" stroke={bodyMid} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="110" y1="80" x2="132" y2="105" stroke={bodyMid} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="132" y1="105" x2="135" y2="118" stroke={bodyMid} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="28" y1="75" x2="3" y2="93" stroke={bodyMid} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="112" y1="75" x2="137" y2="93" stroke={bodyMid} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="32" y1="85" x2="12" y2="112" stroke={bodyMid} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="108" y1="85" x2="128" y2="112" stroke={bodyMid} strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx="70" cy="58" rx="42" ry="33" fill={`url(#shell-grad-${side})`} stroke={bodyBright} strokeWidth="1.5" />
        <ellipse cx="70" cy="50" rx="35" ry="9" fill="none" stroke={plateColor} strokeWidth="1.2" opacity="0.5" />
        <path d="M38,42 Q70,32 102,42" fill="none" stroke={bodyBright} strokeWidth="1.5" opacity="0.6" />
        <rect x="45" y="42" width="50" height="10" rx="5" fill={bodyDark} stroke={color} strokeWidth="1" />
        <rect x="50" y="44" width="16" height="6" rx="2" fill={color} opacity="0.9"><animate attributeName="opacity" values="0.9;0.5;0.9" dur="2.5s" repeatCount="indefinite" /></rect>
        <rect x="74" y="44" width="16" height="6" rx="2" fill={color} opacity="0.9"><animate attributeName="opacity" values="0.9;0.5;0.9" dur="2.5s" repeatCount="indefinite" begin="0.3s" /></rect>
        <circle cx="70" cy="72" r="5" fill="none" stroke={color} strokeWidth="1.2" opacity="0.5"><animate attributeName="r" values="5;6;5" dur="1.5s" repeatCount="indefinite" /></circle>
        <circle cx="70" cy="72" r="2.5" fill={color} opacity="0.4" />
        <path d="M28,55 L10,42 L2,30" stroke={bodyMid} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M2,30 L-8,18" stroke={plateColor} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M2,30 L8,16" stroke={plateColor} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="2" cy="30" r="3.5" fill={bodyDark} stroke={color} strokeWidth="1" />
        <path d="M112,55 L130,42 L138,30" stroke={bodyMid} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M138,30 L148,18" stroke={plateColor} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M138,30 L132,16" stroke={plateColor} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="138" cy="30" r="3.5" fill={bodyDark} stroke={color} strokeWidth="1" />
        <line x1="55" y1="28" x2="50" y2="16" stroke={bodyMid} strokeWidth="2" />
        <circle cx="50" cy="15" r="2.5" fill={color} opacity="0.7"><animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.2s" repeatCount="indefinite" /></circle>
        <line x1="85" y1="28" x2="90" y2="16" stroke={bodyMid} strokeWidth="2" />
        <circle cx="90" cy="15" r="2.5" fill={color} opacity="0.7"><animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.2s" repeatCount="indefinite" begin="0.4s" /></circle>
        <ellipse cx="70" cy="58" rx="42" ry="33" fill="none" stroke={color} strokeWidth="1" opacity="0.15" filter={`url(#${filterId})`} />
      </svg>
    </div>
  )
}

// ============================================================
// Attack Effects (simplified — key ones)
// ============================================================

function SlashEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const pos = target === 'bot2' ? BOT2_POS : BOT1_POS
  const color = target === 'bot2' ? '#00f0ff' : '#ff4040'
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {[0,1,2].map(i => (
        <div key={i} className="absolute animate-slash-arc" style={{ top: `${pos.y - 8 + i * 5}%`, left: `${pos.x - 6}%`, width: '14%', height: '8%', animationDelay: `${i * 0.12}s` }}>
          <svg viewBox="0 0 180 60" className="w-full h-full" style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
            <path d={`M10,${50-i*10} Q90,${i*10} 170,${30+i*5}`} stroke={color} strokeWidth="5" fill="none" className="animate-draw-slash" strokeLinecap="round" />
          </svg>
        </div>
      ))}
      {[...Array(6)].map((_,i) => (
        <div key={i} className="absolute w-2 h-2 rounded-full animate-spark-out" style={{
          top: `${pos.y - 2 + Math.random()*8}%`, left: `${pos.x - 2 + Math.random()*8}%`,
          background: color, boxShadow: `0 0 10px ${color}`,
          animationDelay: `${0.15+i*0.04}s`,
          '--spark-x': `${(Math.random()-0.5)*60}px`, '--spark-y': `${(Math.random()-0.5)*60}px`,
        } as React.CSSProperties} />
      ))}
    </div>
  )
}

function BeamEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const from = target === 'bot2' ? BOT1_POS : BOT2_POS
  const to = target === 'bot2' ? BOT2_POS : BOT1_POS
  const color = target === 'bot2' ? '#00f0ff' : '#ff4040'
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <div className="absolute inset-0 animate-beam-flash-slow">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" style={{ filter: `drop-shadow(0 0 8px ${color})` }}>
          <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth="1" className="animate-beam-draw-slow" />
          <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="white" strokeWidth="0.4" className="animate-beam-draw-slow" style={{ animationDelay: '0.08s' }} />
        </svg>
      </div>
      <div className="absolute animate-electrocute-slow" style={{
        top: `${to.y-10}%`, left: `${to.x-8}%`, width: '16%', height: '20%',
        background: `radial-gradient(circle, rgba(255,255,255,0.5) 0%, ${color}33 40%, transparent 70%)`,
      }} />
    </div>
  )
}

function ShieldEffect({ defender }: { defender: 'bot1' | 'bot2' }) {
  const pos = defender === 'bot1' ? BOT1_POS : BOT2_POS
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <div className="absolute animate-shield-appear-slow" style={{ top: `${pos.y}%`, left: `${pos.x}%`, transform: 'translate(-50%,-50%)' }}>
        <svg viewBox="0 0 140 140" className="w-36 h-36" style={{ filter: 'drop-shadow(0 0 10px #00f0ff44)' }}>
          {[0,60,120,180,240,300].map((a,i) => {
            const r=45, x=70+r*Math.cos(a*Math.PI/180), y=70+r*Math.sin(a*Math.PI/180)
            return <polygon key={i} points={`${x},${y-14} ${x+12},${y-7} ${x+12},${y+7} ${x},${y+14} ${x-12},${y+7} ${x-12},${y-7}`} fill="rgba(0,240,255,0.15)" stroke="#00f0ff" strokeWidth="1.5" className="animate-hex-pop-slow" style={{ animationDelay: `${i*0.1}s` }} />
          })}
          <circle cx="70" cy="70" r="55" fill="none" stroke="#00f0ff" strokeWidth="2" opacity="0.5" className="animate-shield-pulse" />
        </svg>
      </div>
    </div>
  )
}

function StatusEffect({ target, color, emoji }: { target: 'bot1' | 'bot2'; color: string; emoji: string }) {
  const pos = target === 'bot2' ? BOT2_POS : BOT1_POS
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {[...Array(6)].map((_,i) => (
        <div key={i} className="absolute text-2xl animate-sleep-z-float-slow" style={{
          left: `${pos.x-4+Math.random()*8}%`, top: `${pos.y-8}%`,
          animationDelay: `${i*0.2}s`,
        }}>{emoji}</div>
      ))}
      <div className="absolute w-20 h-20 rounded-full" style={{
        left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)',
        background: `radial-gradient(circle, ${color}44, transparent)`,
        animation: 'virus-cloud-slow 1.5s ease-out forwards',
      }} />
    </div>
  )
}

function getEffect(action: string, skillId: string | undefined, target: 'bot1' | 'bot2') {
  if (action === 'defend') return <ShieldEffect defender={target === 'bot2' ? 'bot1' : 'bot2'} />
  if (action === 'attack') return <SlashEffect target={target} />
  if (!skillId) return <SlashEffect target={target} />
  switch (skillId) {
    case 'firewall': return <ShieldEffect defender={target === 'bot2' ? 'bot1' : 'bot2'} />
    case 'iron_fortress': return <ShieldEffect defender={target === 'bot2' ? 'bot1' : 'bot2'} />
    case 'mirror_coat': return <ShieldEffect defender={target === 'bot2' ? 'bot1' : 'bot2'} />
    case 'rollback': return <StatusEffect target={target === 'bot2' ? 'bot1' : 'bot2'} color="#40ff40" emoji="💚" />
    case 'power_strike': return <SlashEffect target={target} />
    case 'reasoning_burst': return <BeamEffect target={target} />
    case 'spawn_attack': return <BeamEffect target={target} />
    case 'berserker_rush': return <BeamEffect target={target} />
    case 'sleep_bomb': return <StatusEffect target={target} color="#8844cc" emoji="💤" />
    case 'emp_pulse': return <StatusEffect target={target} color="#ffff00" emoji="🔋" />
    case 'time_bomb': return <StatusEffect target={target} color="#ffaa00" emoji="💣" />
    case 'overclock': return <StatusEffect target={target === 'bot2' ? 'bot1' : 'bot2'} color="#ffaa00" emoji="⏫" />
    case 'scan': return <StatusEffect target={target} color="#00f0ff" emoji="🔍" />
    case 'prompt_injection': return <StatusEffect target={target} color="#00ff00" emoji="💉" />
    case 'memory_bomb': return <StatusEffect target={target} color="#c084fc" emoji="🧠" />
    case 'virus': return <StatusEffect target={target} color="#00ff00" emoji="🦠" />
    default: return <SlashEffect target={target} />
  }
}

// ============================================================
// Battle Arena Component
// ============================================================

export function BattleArena({ bot1, bot2, round, phase, winner, onAnimationComplete }: BattleArenaProps) {
  const [bot1Hp, setBot1Hp] = useState(bot1.maxHp)
  const [bot2Hp, setBot2Hp] = useState(bot2.maxHp)
  const [bot1Energy, setBot1Energy] = useState(100)
  const [bot2Energy, setBot2Energy] = useState(100)
  const [bot1Anim, setBot1Anim] = useState<BotAnim>('idle')
  const [bot2Anim, setBot2Anim] = useState<BotAnim>('idle')
  const [showBot1Dmg, setShowBot1Dmg] = useState(false)
  const [showBot2Dmg, setShowBot2Dmg] = useState(false)
  const [screenShake, setScreenShake] = useState(false)
  const [screenFlash, setScreenFlash] = useState(false)
  const [showEffect, setShowEffect] = useState<React.ReactNode>(null)
  const [announcement, setAnnouncement] = useState<{ text: string; color: string } | null>(null)
  const [counterBanner, setCounterBanner] = useState(false)
  const [arenaIdx] = useState(0)
  const [curDmg1, setCurDmg1] = useState(0)
  const [curDmg2, setCurDmg2] = useState(0)
  const [curCounter1, setCurCounter1] = useState(false)
  const [curCounter2, setCurCounter2] = useState(false)
  const animatingRef = useRef(false)
  const arena = ARENAS[arenaIdx]

  const delay = useCallback((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)), [])

  // Animate a round when new round data arrives
  useEffect(() => {
    if (!round || animatingRef.current) return
    animatingRef.current = true

    const animate = async () => {
      const r = round
      const isKO = r.bot1HpAfter <= 0 || r.bot2HpAfter <= 0

      // Round announcement
      setAnnouncement({ text: `ROUND ${r.round}`, color: '#ffffff' })
      await delay(1200)
      setAnnouncement(null)
      await delay(300)

      // Bot1 action
      const sk1 = r.bot1SkillId ? getSkillDisplay(r.bot1SkillId) : null
      const move1Name = getMoveName(r.bot1Action, r.bot1SkillId)
      const move1Color = sk1 ? TYPE_COLORS[sk1.type] || '#00f0ff' : (r.bot1Action === 'defend' ? '#00f0ff' : '#ff4040')

      if (r.bot1Action !== 'defend' || r.bot1SkillId) {
        setAnnouncement({ text: `${sk1?.emoji || '⚔️'} ${move1Name.toUpperCase()}`, color: move1Color })
        await delay(800)
        setBot1Anim('attack-right')
        await delay(250)
        setShowEffect(getEffect(r.bot1Action, r.bot1SkillId, 'bot2'))
        await delay(600)

        if (r.bot1Dmg > 0) {
          setCurDmg2(r.bot1Dmg)
          setBot2Anim('hit')
          setShowBot2Dmg(true)
          if (r.bot1Dmg >= 15 || r.bot1Counter !== 'none') {
            setScreenShake(true)
            setTimeout(() => setScreenShake(false), 400)
          }
          if (r.bot1Counter !== 'none') {
            setCurCounter2(true)
            setCounterBanner(true)
            setTimeout(() => { setCounterBanner(false); setCurCounter2(false) }, 1200)
          }
          await delay(800)
          setBot2Anim('idle')
          setShowBot2Dmg(false)
        } else {
          setBot1Anim('idle')
        }
        setShowEffect(null)
        setAnnouncement(null)
      }
      setBot2Hp(r.bot2HpAfter)
      await delay(400)

      // Bot2 action (if alive)
      if (r.bot2HpAfter > 0) {
        const sk2 = r.bot2SkillId ? getSkillDisplay(r.bot2SkillId) : null
        const move2Name = getMoveName(r.bot2Action, r.bot2SkillId)
        const move2Color = sk2 ? TYPE_COLORS[sk2.type] || '#ff4040' : (r.bot2Action === 'defend' ? '#00f0ff' : '#ff4040')

        if (r.bot2Action !== 'defend' || r.bot2SkillId) {
          setAnnouncement({ text: `${sk2?.emoji || '⚔️'} ${move2Name.toUpperCase()}`, color: move2Color })
          await delay(800)
          setBot2Anim('attack-left')
          await delay(250)
          setShowEffect(getEffect(r.bot2Action, r.bot2SkillId, 'bot1'))
          await delay(600)

          if (r.bot2Dmg > 0) {
            setCurDmg1(r.bot2Dmg)
            setBot1Anim('hit')
            setShowBot1Dmg(true)
            if (r.bot2Dmg >= 15 || r.bot2Counter !== 'none') {
              setScreenShake(true)
              setTimeout(() => setScreenShake(false), 400)
            }
            if (r.bot2Counter !== 'none') {
              setCurCounter1(true)
              setCounterBanner(true)
              setTimeout(() => { setCounterBanner(false); setCurCounter1(false) }, 1200)
            }
            await delay(800)
            setBot1Anim('idle')
            setShowBot1Dmg(false)
          } else {
            setBot2Anim('idle')
          }
          setShowEffect(null)
          setAnnouncement(null)
        }
      }

      setBot1Hp(r.bot1HpAfter)
      setBot1Energy(r.bot1Energy)
      setBot2Energy(r.bot2Energy)
      await delay(600)

      // KO
      if (isKO) {
        if (r.bot2HpAfter <= 0) setBot2Anim('dead')
        if (r.bot1HpAfter <= 0) setBot1Anim('dead')
        setScreenFlash(true)
        await delay(300)
        setScreenFlash(false)
        if (r.bot2HpAfter <= 0 && r.bot1HpAfter > 0) {
          setBot1Anim('taunt')
          await delay(1500)
          setBot1Anim('dance')
          await delay(1500)
          setBot1Anim('idle')
        }
        if (r.bot1HpAfter <= 0 && r.bot2HpAfter > 0) {
          setBot2Anim('taunt')
          await delay(1500)
          setBot2Anim('idle')
        }
      }

      animatingRef.current = false
      onAnimationComplete?.()
    }

    animate()
  }, [round, delay, onAnimationComplete])

  // Reset on new match
  useEffect(() => {
    if (phase === 'waiting') {
      setBot1Hp(bot1.maxHp)
      setBot2Hp(bot2.maxHp)
      setBot1Energy(100)
      setBot2Energy(100)
      setBot1Anim('idle')
      setBot2Anim('idle')
    }
  }, [phase, bot1.maxHp, bot2.maxHp])

  return (
    <div className="relative">
      {/* Arena */}
      <div className={`relative w-full aspect-[16/9] max-h-[55vh] overflow-hidden rounded-lg ${screenShake ? 'animate-screen-shake-slow' : ''}`}>
        <div className="absolute inset-0" style={{ background: arena.bg }}>
          <div className="absolute bottom-0 left-0 right-0 h-[55%]" style={{ perspective: '400px' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${arena.grid} 1px, transparent 1px), linear-gradient(90deg, ${arena.grid} 1px, transparent 1px)`, backgroundSize: '40px 40px', transform: 'rotateX(60deg)', transformOrigin: 'bottom' }} />
          </div>
          <div className="absolute inset-0" style={{ background: arena.glow }} />
          {[...Array(12)].map((_,i) => (
            <div key={i} className="absolute rounded-full animate-float-particle" style={{
              left: `${5+Math.random()*90}%`, top: `${8+Math.random()*75}%`,
              width: `${2+Math.random()*2}px`, height: `${2+Math.random()*2}px`,
              background: arena.particles[i % arena.particles.length],
              opacity: 0.2 + Math.random() * 0.35,
              animationDelay: `${Math.random()*6}s`, animationDuration: `${3+Math.random()*5}s`,
            }} />
          ))}
          <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 180px rgba(0,0,0,0.75)' }} />
        </div>

        {screenFlash && <div className="absolute inset-0 bg-white/30 z-40 animate-flash-slow" />}
        {showEffect}

        {counterBanner && (
          <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
            <div className="text-4xl sm:text-6xl font-black animate-banner-slam-slow" style={{ fontFamily: 'Orbitron, sans-serif', color: '#ffaa00', textShadow: '0 0 40px #ffaa0088, 0 0 80px #ffaa0044, 0 4px 8px rgba(0,0,0,0.8)' }}>COUNTER!</div>
          </div>
        )}

        {announcement && (
          <div className="absolute inset-0 flex items-center justify-center z-[35] pointer-events-none">
            <div className={`font-black animate-announce-in-slow ${announcement.text.startsWith('ROUND') ? 'text-5xl sm:text-7xl' : 'text-2xl sm:text-4xl'}`}
              style={{ fontFamily: 'Orbitron, sans-serif', color: announcement.color, textShadow: `0 0 30px ${announcement.color}66, 0 4px 12px rgba(0,0,0,0.9)` }}>
              {announcement.text}
            </div>
          </div>
        )}

        {/* Bots */}
        <div className="absolute z-20" style={{ bottom: `${100-BOT1_POS.y-15}%`, left: `${BOT1_POS.x-7}%` }}>
          <BotSprite side="player" color={bot1.color} anim={bot1Anim} />
        </div>
        <div className="absolute z-20" style={{ top: `${BOT2_POS.y-8}%`, right: `${100-BOT2_POS.x-7}%` }}>
          <BotSprite side="opponent" color={bot2.color} anim={bot2Anim} />
        </div>

        {/* HP Panels */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30">
          <HPPanel name={bot2.name} hp={bot2Hp} maxHp={bot2.maxHp} energy={bot2Energy} side="opponent" showDmg={showBot2Dmg} dmgAmount={curDmg2} isCounter={curCounter2} />
        </div>
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-30">
          <HPPanel name={bot1.name} hp={bot1Hp} maxHp={bot1.maxHp} energy={bot1Energy} side="player" showDmg={showBot1Dmg} dmgAmount={curDmg1} isCounter={curCounter1} />
        </div>

        {/* Victory overlay */}
        {phase === 'result' && winner && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 animate-fade-in">
            <div className="text-center animate-victory-pop">
              <div className="text-5xl sm:text-7xl font-black mb-4" style={{ fontFamily: 'Orbitron, sans-serif', color: winner === 'draw' ? '#ffaa00' : '#00f0ff', textShadow: '0 0 50px currentColor' }}>
                {winner === 'draw' ? 'DRAW' : 'VICTORY'}
              </div>
              <div className="text-lg text-gray-300 font-mono">
                {winner === 'draw' ? 'Both bots destroyed!' : winner === 'bot1' ? `${bot1.name} wins!` : `${bot2.name} wins!`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Animation CSS (must be included on page)
// ============================================================

export const BATTLE_CSS = `
  @keyframes idle-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  .animate-idle-bob { animation: idle-bob 2.8s ease-in-out infinite; }
  @keyframes taunt { 0% { transform: translateY(0) rotate(0); } 15% { transform: translateY(-14px) rotate(-4deg); } 30% { transform: translateY(0) rotate(4deg); } 50% { transform: translateY(-10px) scale(1.06); } 100% { transform: translateY(0); } }
  .animate-taunt { animation: taunt 1.2s ease-out; }
  @keyframes dance { 0% { transform: translateY(0) rotate(0); } 25% { transform: translateY(-12px) rotate(-6deg); } 50% { transform: translateY(3px) scaleX(-1); } 75% { transform: translateY(-12px) rotate(6deg); } 100% { transform: translateY(0); } }
  .animate-dance { animation: dance 2s ease-in-out; }
  @keyframes lunge-right-slow { 0% { transform: translateX(0); } 35% { transform: translateX(50px) translateY(-15px); } 100% { transform: translateX(0); } }
  .animate-lunge-right-slow { animation: lunge-right-slow 0.6s ease-out; }
  @keyframes lunge-left-slow { 0% { transform: translateX(0); } 35% { transform: translateX(-50px) translateY(15px); } 100% { transform: translateX(0); } }
  .animate-lunge-left-slow { animation: lunge-left-slow 0.6s ease-out; }
  @keyframes bot-hit-slow { 0% { transform: translateX(0); } 12% { transform: translateX(-10px); filter: brightness(4) saturate(0); } 25% { transform: translateX(8px); } 55% { transform: translateX(-2px); } 100% { transform: translateX(0); filter: brightness(1); } }
  .animate-bot-hit-slow { animation: bot-hit-slow 0.8s ease-out; }
  @keyframes screen-shake-slow { 0%,100% { transform: translate(0); } 8% { transform: translate(-6px,3px); } 16% { transform: translate(6px,-3px); } 24% { transform: translate(-5px,-2px); } 40% { transform: translate(-3px,3px); } }
  .animate-screen-shake-slow { animation: screen-shake-slow 0.45s ease-out; }
  @keyframes flash-slow { 0% { opacity: 0.6; } 100% { opacity: 0; } }
  .animate-flash-slow { animation: flash-slow 0.2s ease-out forwards; }
  @keyframes dmg-float-slow { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 15% { transform: translateY(-10px) scale(1.2); opacity: 1; } 100% { transform: translateY(-50px); opacity: 0; } }
  .animate-dmg-float-slow { animation: dmg-float-slow 1.8s ease-out forwards; }
  @keyframes announce-in-slow { 0% { transform: scale(2.5); opacity: 0; } 15% { transform: scale(0.95); opacity: 1; } 20% { transform: scale(1); } 75% { opacity: 1; } 100% { transform: scale(0.9); opacity: 0; } }
  .animate-announce-in-slow { animation: announce-in-slow 1.4s ease-out forwards; }
  @keyframes banner-slam-slow { 0% { transform: scale(4) rotate(-8deg); opacity: 0; } 12% { transform: scale(1) rotate(2deg); opacity: 1; } 65% { opacity: 1; } 100% { transform: scale(1.15); opacity: 0; } }
  .animate-banner-slam-slow { animation: banner-slam-slow 1.5s ease-out forwards; }
  @keyframes victory-pop { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
  .animate-victory-pop { animation: victory-pop 0.8s ease-out; }
  @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
  .animate-fade-in { animation: fade-in 0.6s ease-out; }
  @keyframes float-particle { 0%,100% { transform: translateY(0) translateX(0); opacity: 0.2; } 50% { transform: translateY(-25px) translateX(12px); opacity: 0.5; } }
  .animate-float-particle { animation: float-particle 5s ease-in-out infinite; }
  @keyframes spark-out { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(var(--spark-x), var(--spark-y)) scale(0); opacity: 0; } }
  .animate-spark-out { animation: spark-out 0.6s ease-out forwards; }
  @keyframes draw-slash { 0% { stroke-dasharray: 250; stroke-dashoffset: 250; } 100% { stroke-dashoffset: 0; } }
  .animate-draw-slash { animation: draw-slash 0.5s ease-out forwards; stroke-dasharray: 250; }
  @keyframes slash-arc { 0% { opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
  .animate-slash-arc { animation: slash-arc 0.7s ease-out forwards; }
  @keyframes beam-draw-slow { 0% { stroke-dasharray: 200; stroke-dashoffset: 200; opacity: 0; } 20% { opacity: 1; } 100% { stroke-dashoffset: 0; } }
  .animate-beam-draw-slow { animation: beam-draw-slow 0.5s ease-out forwards; stroke-dasharray: 200; }
  @keyframes beam-flash-slow { 0%,55% { opacity: 1; } 100% { opacity: 0; } }
  .animate-beam-flash-slow { animation: beam-flash-slow 1.2s ease-out forwards; }
  @keyframes electrocute-slow { 0%,15%,30%,45%,60% { opacity: 0.7; } 8%,23%,38%,53% { opacity: 0; } 100% { opacity: 0; } }
  .animate-electrocute-slow { animation: electrocute-slow 1s ease-out forwards; }
  @keyframes shield-appear-slow { 0% { transform: translate(-50%,-50%) scale(0); opacity: 0; } 35% { transform: translate(-50%,-50%) scale(1.15); opacity: 1; } 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.9; } }
  .animate-shield-appear-slow { animation: shield-appear-slow 0.8s ease-out forwards; }
  @keyframes shield-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.7; } }
  .animate-shield-pulse { animation: shield-pulse 1.2s ease-in-out infinite; }
  @keyframes hex-pop-slow { 0% { opacity: 0; transform: scale(0); } 100% { opacity: 1; transform: scale(1); } }
  .animate-hex-pop-slow { animation: hex-pop-slow 0.4s ease-out forwards; }
  @keyframes sleep-z-float-slow { 0% { opacity: 0; transform: translateY(0); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateY(-60px); } }
  .animate-sleep-z-float-slow { animation: sleep-z-float-slow 1.5s ease-out forwards; }
  @keyframes virus-cloud-slow { 0% { opacity: 0.6; transform: translate(-50%,-50%) scale(0.5); } 50% { opacity: 0.8; } 100% { opacity: 0; transform: translate(-50%,-50%) scale(2); } }
  .scrollbar-thin::-webkit-scrollbar { width: 4px; }
  .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
  .scrollbar-thin::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
`
