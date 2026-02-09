'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Navbar } from '@/components/Navbar'
import { Play, Pause, SkipForward, Zap } from 'lucide-react'

// ============================================================
// Types
// ============================================================

interface DemoRound {
  round: number
  bot1Move: string
  bot1Type: 'aggressive' | 'defensive' | 'tactical' | 'exploit'
  bot2Move: string
  bot2Type: 'aggressive' | 'defensive' | 'tactical' | 'exploit'
  bot1Dmg: number
  bot2Dmg: number
  bot1HpAfter: number
  bot2HpAfter: number
  bot1Counter: boolean
  bot2Counter: boolean
  bot1Energy: number
  bot2Energy: number
  isKO: boolean
}

// ============================================================
// Demo Data — 7 rounds
// ============================================================

const BOT1 = { name: 'CLAWD-X9', level: 5, maxHp: 100, color: '#00f0ff' }
const BOT2 = { name: 'NEUROVIPER', level: 7, maxHp: 100, color: '#ff4040' }

const ROUNDS: DemoRound[] = [
  { round: 1, bot1Move: 'Power Strike', bot1Type: 'aggressive', bot2Move: 'Firewall', bot2Type: 'defensive', bot1Dmg: 5, bot2Dmg: 0, bot1HpAfter: 100, bot2HpAfter: 95, bot1Counter: false, bot2Counter: true, bot1Energy: 85, bot2Energy: 80 , isKO: false },
  { round: 2, bot1Move: 'Reasoning Burst', bot1Type: 'aggressive', bot2Move: 'Spawn Attack', bot2Type: 'aggressive', bot1Dmg: 18, bot2Dmg: 14, bot1HpAfter: 86, bot2HpAfter: 77, bot1Counter: false, bot2Counter: false, bot1Energy: 65, bot2Energy: 40, isKO: false },
  { round: 3, bot1Move: 'Scan', bot1Type: 'exploit', bot2Move: 'Memory Bomb', bot2Type: 'exploit', bot1Dmg: 8, bot2Dmg: 12, bot1HpAfter: 74, bot2HpAfter: 69, bot1Counter: false, bot2Counter: false, bot1Energy: 70, bot2Energy: 45, isKO: false },
  { round: 4, bot1Move: 'Firewall', bot1Type: 'defensive', bot2Move: 'Stack Overflow', bot2Type: 'aggressive', bot1Dmg: 0, bot2Dmg: 4, bot1HpAfter: 74, bot2HpAfter: 65, bot1Counter: true, bot2Counter: false, bot1Energy: 75, bot2Energy: 20, isKO: false },
  { round: 5, bot1Move: 'Time Bomb', bot1Type: 'tactical', bot2Move: 'Prompt Injection', bot2Type: 'exploit', bot1Dmg: 22, bot2Dmg: 10, bot1HpAfter: 64, bot2HpAfter: 43, bot1Counter: false, bot2Counter: false, bot1Energy: 60, bot2Energy: 30, isKO: false },
  { round: 6, bot1Move: 'Spawn Attack', bot1Type: 'aggressive', bot2Move: 'Rollback', bot2Type: 'defensive', bot1Dmg: 3, bot2Dmg: 0, bot1HpAfter: 64, bot2HpAfter: 40, bot1Counter: false, bot2Counter: true, bot1Energy: 35, bot2Energy: 50, isKO: false },
  { round: 7, bot1Move: 'Reasoning Burst', bot1Type: 'aggressive', bot2Move: 'Power Strike', bot2Type: 'aggressive', bot1Dmg: 40, bot2Dmg: 12, bot1HpAfter: 52, bot2HpAfter: 0, bot1Counter: true, bot2Counter: false, bot1Energy: 15, bot2Energy: 0, isKO: true },
]

// ============================================================
// Attack Animation Components
// ============================================================

function PowerStrikeEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const isLeft = target === 'bot2'
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* Slash arc */}
      <div
        className="absolute animate-slash-arc"
        style={{
          top: target === 'bot2' ? '25%' : '55%',
          left: target === 'bot2' ? '45%' : '15%',
          width: '180px', height: '60px',
        }}
      >
        <svg viewBox="0 0 180 60" className="w-full h-full">
          <path d="M10,50 Q90,0 170,30" stroke={isLeft ? '#00f0ff' : '#ff4040'} strokeWidth="4" fill="none" className="animate-draw-slash" strokeLinecap="round" />
          <path d="M20,45 Q95,5 165,35" stroke="white" strokeWidth="2" fill="none" className="animate-draw-slash" style={{ animationDelay: '0.05s' }} strokeLinecap="round" />
        </svg>
      </div>
      {/* Impact sparks */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-spark"
          style={{
            top: target === 'bot2' ? `${28 + Math.random() * 10}%` : `${58 + Math.random() * 10}%`,
            left: target === 'bot2' ? `${60 + Math.random() * 10}%` : `${25 + Math.random() * 10}%`,
            background: isLeft ? '#00f0ff' : '#ff4040',
            boxShadow: `0 0 8px ${isLeft ? '#00f0ff' : '#ff4040'}`,
            animationDelay: `${0.1 + i * 0.05}s`,
          }}
        />
      ))}
    </div>
  )
}

function ReasoningBurstEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const fromX = target === 'bot2' ? '25%' : '70%'
  const toX = target === 'bot2' ? '65%' : '25%'
  const fromY = target === 'bot2' ? '65%' : '30%'
  const toY = target === 'bot2' ? '30%' : '65%'
  const color = target === 'bot2' ? '#00f0ff' : '#ff4040'

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* Main beam */}
      <div className="absolute inset-0 animate-beam-flash">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <line x1={fromX} y1={fromY} x2={toX} y2={toY} stroke={color} strokeWidth="0.8" className="animate-beam-draw" />
          <line x1={fromX} y1={fromY} x2={toX} y2={toY} stroke="white" strokeWidth="0.3" className="animate-beam-draw" style={{ animationDelay: '0.05s' }} />
        </svg>
      </div>
      {/* Lightning branches */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-lightning-branch"
          style={{
            top: `${parseInt(toY) - 5 + Math.random() * 10}%`,
            left: `${parseInt(toX) - 5 + Math.random() * 10}%`,
            width: '40px', height: '40px',
            animationDelay: `${0.15 + i * 0.08}s`,
          }}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <polyline points={`20,5 ${15 + Math.random() * 10},15 ${18 + Math.random() * 6},18 ${10 + Math.random() * 20},35`} stroke={color} strokeWidth="2" fill="none" opacity="0.7" />
          </svg>
        </div>
      ))}
      {/* Target goes dark */}
      <div
        className="absolute w-32 h-32 animate-electrocute"
        style={{
          top: target === 'bot2' ? '15%' : '45%',
          left: target === 'bot2' ? '55%' : '10%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
        }}
      />
    </div>
  )
}

function FirewallEffect({ defender }: { defender: 'bot1' | 'bot2' }) {
  const cx = defender === 'bot1' ? '22%' : '68%'
  const cy = defender === 'bot1' ? '60%' : '30%'
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <div className="absolute animate-shield-appear" style={{ top: cy, left: cx, transform: 'translate(-50%, -50%)' }}>
        <svg viewBox="0 0 120 120" className="w-28 h-28">
          {/* Hex grid shield */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const r = 40
            const x = 60 + r * Math.cos((angle * Math.PI) / 180)
            const y = 60 + r * Math.sin((angle * Math.PI) / 180)
            return (
              <polygon
                key={i}
                points={`${x},${y - 12} ${x + 10},${y - 6} ${x + 10},${y + 6} ${x},${y + 12} ${x - 10},${y + 6} ${x - 10},${y - 6}`}
                fill="rgba(0,240,255,0.15)"
                stroke="#00f0ff"
                strokeWidth="1"
                className="animate-hex-pop"
                style={{ animationDelay: `${i * 0.08}s` }}
              />
            )
          })}
          <circle cx="60" cy="60" r="50" fill="none" stroke="#00f0ff" strokeWidth="1.5" opacity="0.4" className="animate-shield-pulse" />
        </svg>
      </div>
    </div>
  )
}

function SpawnAttackEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const toX = target === 'bot2' ? 65 : 22
  const toY = target === 'bot2' ? 30 : 60
  const fromX = target === 'bot2' ? 22 : 65
  const fromY = target === 'bot2' ? 60 : 30

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute w-16 h-16 animate-ghost-rush"
          style={{
            left: `${fromX + (i - 1) * 5}%`,
            top: `${fromY + (i - 1) * 8}%`,
            animationDelay: `${i * 0.12}s`,
            '--target-x': `${toX - fromX}%`,
            '--target-y': `${toY - fromY}%`,
          } as React.CSSProperties}
        >
          <div className="w-full h-full rounded-lg border-2 opacity-60" style={{
            borderColor: target === 'bot2' ? '#00f0ff' : '#ff4040',
            background: `radial-gradient(circle, ${target === 'bot2' ? 'rgba(0,240,255,0.3)' : 'rgba(255,64,64,0.3)'}, transparent)`,
            boxShadow: `0 0 20px ${target === 'bot2' ? '#00f0ff44' : '#ff404044'}`,
          }} />
        </div>
      ))}
    </div>
  )
}

function StackOverflowEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const chars = ['{}', '//', '&&', '<<', '>>', ';;', '??', '!!', '##', '$$', '%%', '@@', 'ERR', '404', 'NaN', '0x0']
  const cx = target === 'bot2' ? 65 : 22
  const cy = target === 'bot2' ? 20 : 45

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {chars.map((ch, i) => (
        <div
          key={i}
          className="absolute font-mono text-xs font-bold animate-code-rain"
          style={{
            left: `${cx - 10 + Math.random() * 20}%`,
            top: `${cy - 15}%`,
            color: i % 3 === 0 ? '#00ff00' : i % 3 === 1 ? '#ff4040' : '#ffaa00',
            textShadow: '0 0 6px currentColor',
            animationDelay: `${i * 0.06}s`,
            animationDuration: `${0.6 + Math.random() * 0.4}s`,
          }}
        >
          {ch}
        </div>
      ))}
      {/* Glitch overlay */}
      <div
        className="absolute animate-glitch-tear"
        style={{
          top: `${cy}%`, left: `${cx - 8}%`,
          width: '16%', height: '20%',
          background: 'linear-gradient(transparent 30%, rgba(255,0,0,0.1) 30%, rgba(255,0,0,0.1) 33%, transparent 33%, transparent 60%, rgba(0,255,0,0.08) 60%, rgba(0,255,0,0.08) 62%, transparent 62%)',
        }}
      />
    </div>
  )
}

function ScanEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const cx = target === 'bot2' ? 65 : 22
  const cy = target === 'bot2' ? 25 : 55

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* Scanning line */}
      <div
        className="absolute animate-scan-sweep"
        style={{
          left: `${cx - 8}%`, top: `${cy - 15}%`,
          width: '16%', height: '2px',
          background: 'linear-gradient(90deg, transparent, #00f0ff, transparent)',
          boxShadow: '0 0 10px #00f0ff, 0 0 30px #00f0ff44',
        }}
      />
      {/* Revealed stats */}
      <div
        className="absolute font-mono text-[10px] animate-stats-reveal"
        style={{ left: `${cx + 10}%`, top: `${cy - 5}%`, color: '#00f0ff' }}
      >
        <div>ATK: 15</div>
        <div>DEF: 10</div>
        <div>SPD: 12</div>
        <div className="text-amber-400">WEAK: exploit</div>
      </div>
    </div>
  )
}

function MemoryBombEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const cx = target === 'bot2' ? 65 : 22
  const cy = target === 'bot2' ? 28 : 58

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full animate-memory-particle"
          style={{
            left: `${cx}%`, top: `${cy}%`,
            background: i % 2 === 0 ? '#c084fc' : '#f472b6',
            boxShadow: `0 0 6px ${i % 2 === 0 ? '#c084fc' : '#f472b6'}`,
            '--angle': `${(i / 20) * 360}deg`,
            '--dist': `${30 + Math.random() * 50}px`,
            animationDelay: `${i * 0.03}s`,
          } as React.CSSProperties}
        />
      ))}
      {/* Central burst */}
      <div
        className="absolute w-16 h-16 rounded-full animate-burst-ring"
        style={{
          left: `${cx}%`, top: `${cy}%`,
          transform: 'translate(-50%, -50%)',
          border: '2px solid #c084fc',
          boxShadow: '0 0 20px #c084fc44',
        }}
      />
    </div>
  )
}

function TimeBombEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const cx = target === 'bot2' ? 65 : 22
  const cy = target === 'bot2' ? 28 : 58

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* Ticking orb */}
      <div
        className="absolute w-8 h-8 rounded-full animate-bomb-tick"
        style={{
          left: `${cx}%`, top: `${cy}%`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, #ffaa00, #ff4400)',
          boxShadow: '0 0 15px #ffaa00, 0 0 30px #ff440066',
        }}
      />
      {/* Explosion ring */}
      <div
        className="absolute w-4 h-4 rounded-full animate-explosion-ring"
        style={{
          left: `${cx}%`, top: `${cy}%`,
          transform: 'translate(-50%, -50%)',
          border: '3px solid #ffaa00',
          animationDelay: '0.6s',
        }}
      />
      {/* Shockwave particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-amber-400 rounded-full animate-shockwave-particle"
          style={{
            left: `${cx}%`, top: `${cy}%`,
            '--angle': `${(i / 8) * 360}deg`,
            '--dist': `${40 + Math.random() * 30}px`,
            animationDelay: `${0.6 + i * 0.04}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

function PromptInjectionEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const cx = target === 'bot2' ? 65 : 22
  const cy = target === 'bot2' ? 25 : 55
  const injections = ['> OVERRIDE', '$ rm -rf', 'INJECT:', '// HACK', 'SUDO !!', '0xDEAD']

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* Glitch text injections */}
      {injections.map((txt, i) => (
        <div
          key={i}
          className="absolute font-mono text-[11px] font-bold animate-inject-text"
          style={{
            left: `${cx - 8 + Math.random() * 16}%`,
            top: `${cy - 8 + Math.random() * 16}%`,
            color: '#00ff00',
            textShadow: '0 0 8px #00ff00, 2px 0 #ff0000',
            animationDelay: `${i * 0.1}s`,
          }}
        >
          {txt}
        </div>
      ))}
      {/* Screen tear lines */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute w-full h-px animate-screen-tear"
          style={{
            top: `${cy - 5 + i * 10}%`,
            background: 'linear-gradient(90deg, transparent 20%, rgba(255,0,0,0.4), rgba(0,255,0,0.3), transparent 80%)',
            animationDelay: `${0.2 + i * 0.15}s`,
          }}
        />
      ))}
    </div>
  )
}

function RollbackEffect({ defender }: { defender: 'bot1' | 'bot2' }) {
  const cx = defender === 'bot1' ? 22 : 65
  const cy = defender === 'bot1' ? 60 : 28

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* Rewind clock */}
      <div className="absolute animate-rewind-spin" style={{ left: `${cx}%`, top: `${cy - 12}%`, transform: 'translate(-50%, -50%)' }}>
        <svg viewBox="0 0 40 40" className="w-10 h-10">
          <circle cx="20" cy="20" r="16" fill="none" stroke="#40ff40" strokeWidth="2" opacity="0.5" />
          <line x1="20" y1="20" x2="20" y2="8" stroke="#40ff40" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="20" x2="28" y2="20" stroke="#40ff40" strokeWidth="1.5" strokeLinecap="round" />
          <polygon points="12,18 6,20 12,22" fill="#40ff40" />
        </svg>
      </div>
      {/* Heal particles floating up */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute text-green-400 text-xs font-mono font-bold animate-heal-float"
          style={{
            left: `${cx - 3 + Math.random() * 6}%`,
            top: `${cy}%`,
            animationDelay: `${i * 0.15}s`,
          }}
        >
          +{2 + Math.floor(Math.random() * 4)}
        </div>
      ))}
    </div>
  )
}

// Map move names to effects
function getAttackEffect(moveName: string, target: 'bot1' | 'bot2') {
  switch (moveName) {
    case 'Power Strike': return <PowerStrikeEffect target={target} />
    case 'Reasoning Burst': return <ReasoningBurstEffect target={target} />
    case 'Firewall': return <FirewallEffect defender={target === 'bot2' ? 'bot1' : 'bot2'} />
    case 'Spawn Attack': return <SpawnAttackEffect target={target} />
    case 'Stack Overflow': return <StackOverflowEffect target={target} />
    case 'Scan': return <ScanEffect target={target} />
    case 'Memory Bomb': return <MemoryBombEffect target={target} />
    case 'Time Bomb': return <TimeBombEffect target={target} />
    case 'Prompt Injection': return <PromptInjectionEffect target={target} />
    case 'Rollback': return <RollbackEffect defender={target === 'bot2' ? 'bot1' : 'bot2'} />
    default: return <PowerStrikeEffect target={target} />
  }
}

const TYPE_COLORS: Record<string, string> = {
  aggressive: '#ff4040',
  defensive: '#00f0ff',
  tactical: '#ffaa00',
  exploit: '#c084fc',
}

// ============================================================
// Robot SVG Sprites
// ============================================================

function BotSprite({ side, color, isHit, isAttacking, isDead }: {
  side: 'player' | 'opponent'
  color: string
  isHit: boolean
  isAttacking: boolean
  isDead: boolean
}) {
  const cls = [
    'transition-all duration-200',
    isHit ? 'animate-bot-hit' : '',
    isAttacking ? (side === 'player' ? 'animate-lunge-right' : 'animate-lunge-left') : '',
    isDead ? 'opacity-30 translate-y-4 rotate-12' : '',
    !isHit && !isAttacking && !isDead ? 'animate-idle-bob' : '',
  ].join(' ')

  // Derive dark/mid/bright from accent color
  const isCyan = color.includes('00f0ff')
  const bodyDark = isCyan ? '#0e1e2e' : '#1a0808'
  const bodyMid = isCyan ? '#1a3550' : '#3a1010'
  const bodyBright = isCyan ? '#2a5578' : '#6a1a1a'
  const plateColor = isCyan ? '#3a7090' : '#8a2525'
  const filterId = side === 'player' ? 'glow-p' : 'glow-o'

  if (side === 'player') {
    // Player bot — mech-crab from behind (bottom-left)
    return (
      <div className={`relative ${cls}`} style={{ filter: isHit ? 'brightness(3)' : 'none' }}>
        <svg viewBox="0 0 140 130" className="w-36 h-44 sm:w-44 sm:h-52 drop-shadow-lg">
          <defs>
            <filter id={filterId}><feGaussianBlur stdDeviation="2.5" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <linearGradient id="shell-grad-p" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={bodyBright} />
              <stop offset="50%" stopColor={bodyMid} />
              <stop offset="100%" stopColor={bodyDark} />
            </linearGradient>
          </defs>
          {/* Shadow on ground */}
          <ellipse cx="70" cy="125" rx="45" ry="5" fill={color} opacity="0.1" />
          {/* === LEGS (3 per side, back view) === */}
          {/* Left legs */}
          <line x1="30" y1="80" x2="8" y2="105" stroke={bodyMid} strokeWidth="4" strokeLinecap="round" />
          <line x1="8" y1="105" x2="5" y2="120" stroke={bodyMid} strokeWidth="3" strokeLinecap="round" />
          <circle cx="5" cy="120" r="2" fill={color} opacity="0.6" />
          <line x1="28" y1="75" x2="3" y2="95" stroke={bodyMid} strokeWidth="4" strokeLinecap="round" />
          <line x1="3" y1="95" x2="2" y2="112" stroke={bodyMid} strokeWidth="3" strokeLinecap="round" />
          <circle cx="2" cy="112" r="2" fill={color} opacity="0.6" />
          <line x1="32" y1="85" x2="12" y2="115" stroke={bodyMid} strokeWidth="4" strokeLinecap="round" />
          <line x1="12" y1="115" x2="10" y2="126" stroke={bodyMid} strokeWidth="3" strokeLinecap="round" />
          <circle cx="10" cy="126" r="2" fill={color} opacity="0.6" />
          {/* Right legs */}
          <line x1="110" y1="80" x2="132" y2="105" stroke={bodyMid} strokeWidth="4" strokeLinecap="round" />
          <line x1="132" y1="105" x2="135" y2="120" stroke={bodyMid} strokeWidth="3" strokeLinecap="round" />
          <circle cx="135" cy="120" r="2" fill={color} opacity="0.6" />
          <line x1="112" y1="75" x2="137" y2="95" stroke={bodyMid} strokeWidth="4" strokeLinecap="round" />
          <line x1="137" y1="95" x2="138" y2="112" stroke={bodyMid} strokeWidth="3" strokeLinecap="round" />
          <circle cx="138" cy="112" r="2" fill={color} opacity="0.6" />
          <line x1="108" y1="85" x2="128" y2="115" stroke={bodyMid} strokeWidth="4" strokeLinecap="round" />
          <line x1="128" y1="115" x2="130" y2="126" stroke={bodyMid} strokeWidth="3" strokeLinecap="round" />
          <circle cx="130" cy="126" r="2" fill={color} opacity="0.6" />
          {/* Joint dots */}
          <circle cx="8" cy="105" r="3" fill={color} opacity="0.4" />
          <circle cx="3" cy="95" r="3" fill={color} opacity="0.4" />
          <circle cx="12" cy="115" r="3" fill={color} opacity="0.4" />
          <circle cx="132" cy="105" r="3" fill={color} opacity="0.4" />
          <circle cx="137" cy="95" r="3" fill={color} opacity="0.4" />
          <circle cx="128" cy="115" r="3" fill={color} opacity="0.4" />
          {/* === MAIN SHELL (dome carapace, back view) === */}
          <ellipse cx="70" cy="60" rx="45" ry="35" fill={`url(#shell-grad-p)`} stroke={bodyBright} strokeWidth="1.5" />
          {/* Armor ridge lines across shell */}
          <ellipse cx="70" cy="52" rx="38" ry="10" fill="none" stroke={plateColor} strokeWidth="1.2" opacity="0.5" />
          <ellipse cx="70" cy="62" rx="40" ry="8" fill="none" stroke={plateColor} strokeWidth="1" opacity="0.35" />
          {/* Center spine ridge */}
          <line x1="70" y1="28" x2="70" y2="85" stroke={plateColor} strokeWidth="2" opacity="0.4" />
          {/* Armor plates (segmented look) */}
          <path d="M40,40 Q70,30 100,40" fill="none" stroke={bodyBright} strokeWidth="1.5" opacity="0.6" />
          <path d="M35,55 Q70,48 105,55" fill="none" stroke={bodyBright} strokeWidth="1" opacity="0.4" />
          {/* Back vents */}
          <rect x="55" y="38" width="30" height="14" rx="3" fill={bodyDark} stroke={color} strokeWidth="0.8" opacity="0.6" />
          <rect x="58" y="41" width="7" height="2" rx="1" fill={color} opacity="0.4" />
          <rect x="58" y="45" width="7" height="2" rx="1" fill={color} opacity="0.4" />
          <rect x="58" y="49" width="7" height="2" rx="1" fill={color} opacity="0.4" />
          <rect x="75" y="41" width="7" height="2" rx="1" fill={color} opacity="0.4" />
          <rect x="75" y="45" width="7" height="2" rx="1" fill={color} opacity="0.4" />
          <rect x="75" y="49" width="7" height="2" rx="1" fill={color} opacity="0.4" />
          {/* === CLAWS (extending forward, foreshortened) === */}
          {/* Left claw arm */}
          <path d="M25,60 L8,48 L2,35" stroke={bodyMid} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M2,35 L-5,25" stroke={plateColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M2,35 L6,22" stroke={plateColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx="2" cy="35" r="3.5" fill={bodyDark} stroke={color} strokeWidth="1" />
          {/* Right claw arm */}
          <path d="M115,60 L132,48 L138,35" stroke={bodyMid} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M138,35 L145,25" stroke={plateColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M138,35 L134,22" stroke={plateColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx="138" cy="35" r="3.5" fill={bodyDark} stroke={color} strokeWidth="1" />
          {/* === SENSOR NUBS on shell top === */}
          <line x1="55" y1="30" x2="52" y2="20" stroke={bodyMid} strokeWidth="2" />
          <circle cx="52" cy="19" r="2.5" fill={color} opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <line x1="85" y1="30" x2="88" y2="20" stroke={bodyMid} strokeWidth="2" />
          <circle cx="88" cy="19" r="2.5" fill={color} opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
          </circle>
          {/* Neon accent glow on shell edge */}
          <ellipse cx="70" cy="60" rx="45" ry="35" fill="none" stroke={color} strokeWidth="1" opacity="0.2" filter={`url(#${filterId})`} />
        </svg>
      </div>
    )
  }

  // Opponent bot — mech-crab facing player (top-right)
  return (
    <div className={`relative ${cls}`} style={{ filter: isHit ? 'brightness(3)' : 'none' }}>
      <svg viewBox="0 0 140 130" className="w-32 h-40 sm:w-40 sm:h-48 drop-shadow-lg">
        <defs>
          <filter id={filterId}><feGaussianBlur stdDeviation="2.5" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id="shell-grad-o" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bodyBright} />
            <stop offset="50%" stopColor={bodyMid} />
            <stop offset="100%" stopColor={bodyDark} />
          </linearGradient>
        </defs>
        {/* Shadow */}
        <ellipse cx="70" cy="125" rx="40" ry="4" fill={color} opacity="0.1" />
        {/* === LEGS === */}
        <line x1="30" y1="80" x2="8" y2="105" stroke={bodyMid} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="8" y1="105" x2="5" y2="118" stroke={bodyMid} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="5" cy="118" r="1.8" fill={color} opacity="0.6" />
        <line x1="28" y1="75" x2="3" y2="93" stroke={bodyMid} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="3" y1="93" x2="2" y2="108" stroke={bodyMid} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="2" cy="108" r="1.8" fill={color} opacity="0.6" />
        <line x1="32" y1="85" x2="12" y2="112" stroke={bodyMid} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="12" y1="112" x2="10" y2="124" stroke={bodyMid} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="10" cy="124" r="1.8" fill={color} opacity="0.6" />
        <line x1="110" y1="80" x2="132" y2="105" stroke={bodyMid} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="132" y1="105" x2="135" y2="118" stroke={bodyMid} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="135" cy="118" r="1.8" fill={color} opacity="0.6" />
        <line x1="112" y1="75" x2="137" y2="93" stroke={bodyMid} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="137" y1="93" x2="138" y2="108" stroke={bodyMid} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="138" cy="108" r="1.8" fill={color} opacity="0.6" />
        <line x1="108" y1="85" x2="128" y2="112" stroke={bodyMid} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="128" y1="112" x2="130" y2="124" stroke={bodyMid} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="130" cy="124" r="1.8" fill={color} opacity="0.6" />
        {/* Joint dots */}
        <circle cx="8" cy="105" r="2.5" fill={color} opacity="0.35" />
        <circle cx="3" cy="93" r="2.5" fill={color} opacity="0.35" />
        <circle cx="132" cy="105" r="2.5" fill={color} opacity="0.35" />
        <circle cx="137" cy="93" r="2.5" fill={color} opacity="0.35" />
        {/* === MAIN SHELL (front-facing) === */}
        <ellipse cx="70" cy="58" rx="42" ry="33" fill={`url(#shell-grad-o)`} stroke={bodyBright} strokeWidth="1.5" />
        {/* Armor plates */}
        <ellipse cx="70" cy="50" rx="35" ry="9" fill="none" stroke={plateColor} strokeWidth="1.2" opacity="0.5" />
        <ellipse cx="70" cy="60" rx="37" ry="7" fill="none" stroke={plateColor} strokeWidth="1" opacity="0.35" />
        <path d="M38,42 Q70,32 102,42" fill="none" stroke={bodyBright} strokeWidth="1.5" opacity="0.6" />
        {/* Center spine */}
        <line x1="70" y1="28" x2="70" y2="82" stroke={plateColor} strokeWidth="1.5" opacity="0.3" />
        {/* === VISOR / EYES === */}
        <rect x="45" y="42" width="50" height="10" rx="5" fill={bodyDark} stroke={color} strokeWidth="1" />
        <rect x="50" y="44" width="16" height="6" rx="2" fill={color} opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2.5s" repeatCount="indefinite" />
        </rect>
        <rect x="74" y="44" width="16" height="6" rx="2" fill={color} opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2.5s" repeatCount="indefinite" begin="0.3s" />
        </rect>
        {/* Mandible bumps */}
        <circle cx="55" cy="68" r="4" fill={bodyMid} stroke={bodyBright} strokeWidth="1" />
        <circle cx="85" cy="68" r="4" fill={bodyMid} stroke={bodyBright} strokeWidth="1" />
        {/* Core glow */}
        <circle cx="70" cy="72" r="5" fill="none" stroke={color} strokeWidth="1.2" opacity="0.5">
          <animate attributeName="r" values="5;6;5" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="70" cy="72" r="2.5" fill={color} opacity="0.4" />
        {/* === CLAWS (front view, open pincers) === */}
        {/* Left claw */}
        <path d="M28,55 L10,42 L2,30" stroke={bodyMid} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M2,30 L-8,18" stroke={plateColor} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M2,30 L8,16" stroke={plateColor} strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Claw teeth */}
        <circle cx="-4" cy="24" r="1.5" fill={color} opacity="0.5" />
        <circle cx="5" cy="23" r="1.5" fill={color} opacity="0.5" />
        <circle cx="2" cy="30" r="3.5" fill={bodyDark} stroke={color} strokeWidth="1" />
        {/* Right claw */}
        <path d="M112,55 L130,42 L138,30" stroke={bodyMid} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M138,30 L148,18" stroke={plateColor} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M138,30 L132,16" stroke={plateColor} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="144" cy="24" r="1.5" fill={color} opacity="0.5" />
        <circle cx="135" cy="23" r="1.5" fill={color} opacity="0.5" />
        <circle cx="138" cy="30" r="3.5" fill={bodyDark} stroke={color} strokeWidth="1" />
        {/* === SENSORS === */}
        <line x1="55" y1="28" x2="50" y2="16" stroke={bodyMid} strokeWidth="2" />
        <circle cx="50" cy="15" r="2.5" fill={color} opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <line x1="85" y1="28" x2="90" y2="16" stroke={bodyMid} strokeWidth="2" />
        <circle cx="90" cy="15" r="2.5" fill={color} opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.2s" repeatCount="indefinite" begin="0.4s" />
        </circle>
        {/* Shell edge glow */}
        <ellipse cx="70" cy="58" rx="42" ry="33" fill="none" stroke={color} strokeWidth="1" opacity="0.15" filter={`url(#${filterId})`} />
      </svg>
    </div>
  )
}

// ============================================================
// HP Bar Component (Pokémon style with delayed drain)
// ============================================================

function HPPanel({ name, level, hp, maxHp, energy, maxEnergy, side, showDmg, dmgAmount, isCounter }: {
  name: string; level: number; hp: number; maxHp: number; energy: number; maxEnergy: number;
  side: 'player' | 'opponent'; showDmg: boolean; dmgAmount: number; isCounter: boolean
}) {
  const [displayHp, setDisplayHp] = useState(hp)
  const [delayHp, setDelayHp] = useState(hp)
  const pct = (displayHp / maxHp) * 100
  const delayPct = (delayHp / maxHp) * 100
  const epct = (energy / maxEnergy) * 100
  const barColor = pct > 50 ? '#40ff40' : pct > 25 ? '#ffaa00' : '#ff4040'

  useEffect(() => {
    setDisplayHp(hp)
    const timer = setTimeout(() => setDelayHp(hp), 600)
    return () => clearTimeout(timer)
  }, [hp])

  return (
    <div className={`relative ${side === 'opponent' ? 'text-right' : ''}`}>
      <div className={`inline-block bg-[#0a0a1aee] border rounded-lg px-4 py-2.5 backdrop-blur-sm min-w-[200px] sm:min-w-[260px] ${side === 'opponent' ? 'border-red-800/40' : 'border-cyan-800/40'}`}>
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-bold text-sm text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>{name}</span>
          <span className="text-[10px] text-gray-400 font-mono">Lv.{level}</span>
        </div>
        {/* HP bar with delayed drain */}
        <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden mb-1">
          <div className="absolute inset-0 h-full rounded-full transition-all duration-[600ms] ease-out" style={{ width: `${delayPct}%`, background: '#991b1b' }} />
          <div className="absolute inset-0 h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-1">
          <span>{Math.max(0, displayHp)}/{maxHp}</span>
          <span className="text-cyan-400">⚡{energy}</span>
        </div>
        {/* Energy bar */}
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${epct}%` }} />
        </div>
      </div>
      {/* Floating damage number */}
      {showDmg && dmgAmount > 0 && (
        <div className={`absolute ${side === 'opponent' ? '-left-4' : '-right-4'} -top-8 animate-dmg-float`}>
          <span className={`text-2xl sm:text-3xl font-bold font-mono ${isCounter ? 'text-amber-400 scale-125' : 'text-red-400'}`} style={{ textShadow: `0 0 10px ${isCounter ? '#ffaa00' : '#ff4040'}` }}>
            -{dmgAmount}
          </span>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Main Demo Page
// ============================================================

export default function MatchV2Page() {
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [currentRound, setCurrentRound] = useState(-1)
  const [phase, setPhase] = useState<'idle' | 'round-intro' | 'bot1-announce' | 'bot1-attack' | 'bot1-hit' | 'pause1' | 'bot2-announce' | 'bot2-attack' | 'bot2-hit' | 'pause2' | 'hp-drain' | 'ko' | 'result'>('idle')
  const [bot1Hp, setBot1Hp] = useState(BOT1.maxHp)
  const [bot2Hp, setBot2Hp] = useState(BOT2.maxHp)
  const [bot1Energy, setBot1Energy] = useState(100)
  const [bot2Energy, setBot2Energy] = useState(100)
  const [bot1Hit, setBot1Hit] = useState(false)
  const [bot2Hit, setBot2Hit] = useState(false)
  const [bot1Attacking, setBot1Attacking] = useState(false)
  const [bot2Attacking, setBot2Attacking] = useState(false)
  const [showBot1Dmg, setShowBot1Dmg] = useState(false)
  const [showBot2Dmg, setShowBot2Dmg] = useState(false)
  const [screenShake, setScreenShake] = useState(false)
  const [screenFlash, setScreenFlash] = useState(false)
  const [showEffect, setShowEffect] = useState<React.ReactNode>(null)
  const [announcement, setAnnouncement] = useState<{ text: string; color: string } | null>(null)
  const [counterBanner, setCounterBanner] = useState(false)
  const [actionLog, setActionLog] = useState<string[]>([])
  const [isDead, setIsDead] = useState(false)
  const [slowMo, setSlowMo] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  const addLog = useCallback((msg: string) => {
    setActionLog(prev => [...prev, msg])
    setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }), 50)
  }, [])

  const delay = useCallback((ms: number) => new Promise<void>(resolve => {
    timerRef.current = setTimeout(resolve, ms / speed)
  }), [speed])

  const playRound = useCallback(async (roundIdx: number) => {
    const round = ROUNDS[roundIdx]
    if (!round) return

    // Round intro
    setPhase('round-intro')
    setAnnouncement({ text: `ROUND ${round.round}`, color: '#ffffff' })
    addLog(`══ Round ${round.round} ══`)
    await delay(1000)
    setAnnouncement(null)
    await delay(300)

    // Slow-mo on final round
    if (round.isKO) setSlowMo(true)

    // Bot1 attacks
    setPhase('bot1-announce')
    setAnnouncement({ text: round.bot1Move.toUpperCase(), color: TYPE_COLORS[round.bot1Type] })
    addLog(`${BOT1.name} uses ${round.bot1Move}!`)
    await delay(800)

    setPhase('bot1-attack')
    setBot1Attacking(true)
    setShowEffect(getAttackEffect(round.bot1Move, 'bot2'))
    await delay(500)
    setBot1Attacking(false)

    // Bot2 gets hit
    if (round.bot1Dmg > 0) {
      setPhase('bot1-hit')
      setBot2Hit(true)
      setShowBot2Dmg(true)
      if (round.bot1Dmg >= 15 || round.bot1Counter) {
        setScreenShake(true)
        setScreenFlash(true)
        setTimeout(() => setScreenFlash(false), 150 / speed)
        setTimeout(() => setScreenShake(false), 300 / speed)
      }
      if (round.bot1Counter) {
        setCounterBanner(true)
        addLog('⚡ COUNTER!')
        setTimeout(() => setCounterBanner(false), 1000 / speed)
      }
      addLog(`  → ${round.bot1Dmg} damage to ${BOT2.name}`)
      await delay(600)
      setBot2Hit(false)
      setShowBot2Dmg(false)
    }
    setShowEffect(null)
    setAnnouncement(null)
    await delay(400)

    // Update bot2 HP
    setBot2Hp(round.bot2HpAfter)

    // Bot2 attacks (if alive)
    if (round.bot2HpAfter > 0) {
      setPhase('bot2-announce')
      setAnnouncement({ text: round.bot2Move.toUpperCase(), color: TYPE_COLORS[round.bot2Type] })
      addLog(`${BOT2.name} uses ${round.bot2Move}!`)
      await delay(800)

      setPhase('bot2-attack')
      setBot2Attacking(true)
      setShowEffect(getAttackEffect(round.bot2Move, 'bot1'))
      await delay(500)
      setBot2Attacking(false)

      if (round.bot2Dmg > 0) {
        setPhase('bot2-hit')
        setBot1Hit(true)
        setShowBot1Dmg(true)
        if (round.bot2Dmg >= 15 || round.bot2Counter) {
          setScreenShake(true)
          setTimeout(() => setScreenShake(false), 300 / speed)
        }
        if (round.bot2Counter) {
          setCounterBanner(true)
          addLog('🛡️ COUNTER!')
          setTimeout(() => setCounterBanner(false), 1000 / speed)
        }
        addLog(`  → ${round.bot2Dmg} damage to ${BOT1.name}`)
        await delay(600)
        setBot1Hit(false)
        setShowBot1Dmg(false)
      }
      setShowEffect(null)
      setAnnouncement(null)
    }

    // Update HPs and energy
    setBot1Hp(round.bot1HpAfter)
    setBot1Energy(round.bot1Energy)
    setBot2Energy(round.bot2Energy)
    setPhase('hp-drain')
    await delay(800)

    setSlowMo(false)

    // KO check
    if (round.isKO) {
      setIsDead(true)
      setPhase('ko')
      await delay(500)
      setScreenFlash(true)
      await delay(200)
      setScreenFlash(false)
      await delay(1000)
      setPhase('result')
      addLog(`🏆 ${BOT1.name} WINS!`)
      return
    }

    await delay(500)
  }, [delay, addLog, speed])

  const startDemo = useCallback(async () => {
    // Reset
    setBot1Hp(BOT1.maxHp)
    setBot2Hp(BOT2.maxHp)
    setBot1Energy(100)
    setBot2Energy(100)
    setActionLog([])
    setCurrentRound(-1)
    setPhase('idle')
    setIsDead(false)
    setPlaying(true)

    await new Promise(r => setTimeout(r, 300))

    for (let i = 0; i < ROUNDS.length; i++) {
      setCurrentRound(i)
      await playRound(i)
      if (ROUNDS[i].isKO) break
    }
    setPlaying(false)
  }, [playRound])

  const skipToEnd = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const lastRound = ROUNDS[ROUNDS.length - 1]
    setBot1Hp(lastRound.bot1HpAfter)
    setBot2Hp(lastRound.bot2HpAfter)
    setBot1Energy(lastRound.bot1Energy)
    setBot2Energy(lastRound.bot2Energy)
    setCurrentRound(ROUNDS.length - 1)
    setIsDead(true)
    setPhase('result')
    setPlaying(false)
    addLog(`🏆 ${BOT1.name} WINS!`)
  }, [addLog])

  const curRound = currentRound >= 0 ? ROUNDS[currentRound] : null

  return (
    <div className="min-h-screen bg-[#050510] relative overflow-hidden">
      <Navbar />

      {/* Demo Controls */}
      <div className="sticky top-12 z-50 bg-[#0a0a1aee] border-b border-gray-800 px-4 py-2 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={playing ? () => {} : startDemo}
            disabled={playing && phase !== 'result'}
            className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded transition"
          >
            <Play className="w-3 h-3" /> {phase === 'result' ? 'REPLAY' : 'PLAY DEMO'}
          </button>
          {playing && (
            <button onClick={skipToEnd} className="flex items-center gap-1 text-gray-400 hover:text-white text-xs px-3 py-2 border border-gray-700 rounded transition">
              <SkipForward className="w-3 h-3" /> SKIP
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
          <span>SPEED:</span>
          <button onClick={() => setSpeed(1)} className={`px-2 py-1 rounded ${speed === 1 ? 'bg-cyan-800 text-cyan-300' : 'hover:text-white'}`}>1x</button>
          <button onClick={() => setSpeed(2)} className={`px-2 py-1 rounded ${speed === 2 ? 'bg-cyan-800 text-cyan-300' : 'hover:text-white'}`}>2x</button>
        </div>
        <div className="text-xs font-mono text-gray-500">
          {currentRound >= 0 ? `ROUND ${currentRound + 1}/7` : 'READY'}
        </div>
      </div>

      {/* Arena */}
      <div className={`relative w-full aspect-[16/9] max-h-[65vh] overflow-hidden ${screenShake ? 'animate-screen-shake' : ''} ${slowMo ? 'transition-all duration-1000' : ''}`}>
        {/* Background — TRON arena */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a2a] via-[#050515] to-[#0a0a1a]">
          {/* Grid floor (perspective) */}
          <div className="absolute bottom-0 left-0 right-0 h-[55%]" style={{
            background: 'linear-gradient(transparent 0%, #050510 100%)',
            perspective: '400px',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `linear-gradient(rgba(0,240,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.07) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
              transform: 'rotateX(60deg)',
              transformOrigin: 'bottom',
            }} />
          </div>
          {/* Floating particles */}
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full animate-float-particle"
              style={{
                left: `${5 + Math.random() * 90}%`,
                top: `${10 + Math.random() * 70}%`,
                background: i % 3 === 0 ? '#00f0ff' : i % 3 === 1 ? '#ffaa00' : '#ffffff',
                opacity: 0.3 + Math.random() * 0.3,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
          {/* Vignette */}
          <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 150px rgba(0,0,0,0.7)' }} />
        </div>

        {/* Screen flash overlay */}
        {screenFlash && <div className="absolute inset-0 bg-white/30 z-40 animate-flash" />}

        {/* Attack effects */}
        {showEffect}

        {/* Counter banner */}
        {counterBanner && (
          <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
            <div className="text-4xl sm:text-5xl font-bold animate-banner-slam" style={{ fontFamily: 'Orbitron, sans-serif', color: '#ffaa00', textShadow: '0 0 30px #ffaa0066, 0 0 60px #ffaa0033' }}>
              COUNTER!
            </div>
          </div>
        )}

        {/* Move announcement */}
        {announcement && (
          <div className="absolute inset-0 flex items-center justify-center z-35 pointer-events-none">
            <div
              className={`text-3xl sm:text-4xl font-bold animate-announce-in ${announcement.text.startsWith('ROUND') ? 'text-5xl sm:text-6xl' : ''}`}
              style={{ fontFamily: 'Orbitron, sans-serif', color: announcement.color, textShadow: `0 0 20px ${announcement.color}44, 0 2px 10px rgba(0,0,0,0.8)` }}
            >
              {announcement.text}
            </div>
          </div>
        )}

        {/* Player bot (bottom-left) */}
        <div className="absolute bottom-[8%] left-[5%] sm:left-[10%] z-20">
          <BotSprite side="player" color={BOT1.color} isHit={bot1Hit} isAttacking={bot1Attacking} isDead={false} />
        </div>

        {/* Opponent bot (top-right) */}
        <div className="absolute top-[10%] right-[8%] sm:right-[15%] z-20">
          <BotSprite side="opponent" color={BOT2.color} isHit={bot2Hit} isAttacking={bot2Attacking} isDead={isDead} />
        </div>

        {/* HP Panels */}
        <div className="absolute top-4 right-4 z-30">
          <HPPanel name={BOT2.name} level={BOT2.level} hp={bot2Hp} maxHp={BOT2.maxHp} energy={bot2Energy} maxEnergy={100} side="opponent" showDmg={showBot2Dmg} dmgAmount={curRound?.bot1Dmg ?? 0} isCounter={curRound?.bot1Counter ?? false} />
        </div>
        <div className="absolute bottom-4 left-4 z-30">
          <HPPanel name={BOT1.name} level={BOT1.level} hp={bot1Hp} maxHp={BOT1.maxHp} energy={bot1Energy} maxEnergy={100} side="player" showDmg={showBot1Dmg} dmgAmount={curRound?.bot2Dmg ?? 0} isCounter={curRound?.bot2Counter ?? false} />
        </div>

        {/* Victory overlay */}
        {phase === 'result' && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 animate-fade-in">
            <div className="text-center animate-victory-pop">
              <div className="text-6xl sm:text-7xl font-bold mb-4" style={{ fontFamily: 'Orbitron, sans-serif', color: '#00f0ff', textShadow: '0 0 40px #00f0ff66, 0 0 80px #00f0ff33' }}>
                VICTORY
              </div>
              <div className="text-xl text-gray-300 font-mono">{BOT1.name} wins in {ROUNDS.length} rounds</div>
              <div className="mt-4 flex gap-6 justify-center text-sm font-mono">
                <div className="text-green-400">+32 ELO</div>
                <div className="text-amber-400">+180 CR</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Log */}
      <div className="bg-[#0a0a1a] border-t border-gray-800 px-4 py-2">
        <div ref={logRef} className="max-h-24 overflow-y-auto scrollbar-thin">
          {actionLog.length === 0 ? (
            <div className="text-gray-600 text-xs font-mono text-center py-2">// press PLAY to start demo match</div>
          ) : (
            actionLog.map((log, i) => (
              <div key={i} className="text-[11px] font-mono text-gray-400 py-0.5">
                {log.includes('COUNTER') ? <span className="text-amber-400">{log}</span> :
                 log.includes('WINS') ? <span className="text-cyan-400 font-bold">{log}</span> :
                 log.includes('damage') ? <span className="text-red-400">{log}</span> :
                 log.startsWith('══') ? <span className="text-gray-500">{log}</span> :
                 log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes idle-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .animate-idle-bob { animation: idle-bob 2.5s ease-in-out infinite; }

        @keyframes lunge-right { 0% { transform: translateX(0); } 40% { transform: translateX(40px) translateY(-10px); } 100% { transform: translateX(0); } }
        .animate-lunge-right { animation: lunge-right 0.4s ease-out; }

        @keyframes lunge-left { 0% { transform: translateX(0); } 40% { transform: translateX(-40px) translateY(10px); } 100% { transform: translateX(0); } }
        .animate-lunge-left { animation: lunge-left 0.4s ease-out; }

        @keyframes bot-hit { 0% { transform: translateX(0); filter: brightness(1); } 15% { transform: translateX(-8px); filter: brightness(3); } 30% { transform: translateX(6px); filter: brightness(1); } 50% { transform: translateX(-4px); filter: brightness(2.5); } 70% { transform: translateX(3px); filter: brightness(1); } 100% { transform: translateX(0); filter: brightness(1); } }
        .animate-bot-hit { animation: bot-hit 0.5s ease-out; }

        @keyframes screen-shake { 0%,100% { transform: translate(0); } 10% { transform: translate(-4px, 2px); } 20% { transform: translate(4px, -2px); } 30% { transform: translate(-3px, -1px); } 40% { transform: translate(3px, 1px); } 50% { transform: translate(-2px, 2px); } }
        .animate-screen-shake { animation: screen-shake 0.3s ease-out; }

        @keyframes flash { 0% { opacity: 0.5; } 100% { opacity: 0; } }
        .animate-flash { animation: flash 0.15s ease-out forwards; }

        @keyframes dmg-float { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-40px); opacity: 0; } }
        .animate-dmg-float { animation: dmg-float 1.2s ease-out forwards; }

        @keyframes announce-in { 0% { transform: scale(2); opacity: 0; } 20% { transform: scale(1); opacity: 1; } 80% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.8); opacity: 0; } }
        .animate-announce-in { animation: announce-in 1s ease-out forwards; }

        @keyframes banner-slam { 0% { transform: scale(3) rotate(-5deg); opacity: 0; } 15% { transform: scale(1) rotate(0); opacity: 1; } 70% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.1); opacity: 0; } }
        .animate-banner-slam { animation: banner-slam 1s ease-out forwards; }

        @keyframes victory-pop { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
        .animate-victory-pop { animation: victory-pop 0.6s ease-out; }

        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }

        @keyframes float-particle { 0%,100% { transform: translateY(0) translateX(0); opacity: 0.3; } 50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; } }
        .animate-float-particle { animation: float-particle 4s ease-in-out infinite; }

        @keyframes spark { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(0) translate(var(--tx, 20px), var(--ty, -20px)); opacity: 0; } }
        .animate-spark { animation: spark 0.4s ease-out forwards; }

        @keyframes draw-slash { 0% { stroke-dasharray: 200; stroke-dashoffset: 200; } 100% { stroke-dashoffset: 0; } }
        .animate-draw-slash { animation: draw-slash 0.3s ease-out forwards; stroke-dasharray: 200; }

        @keyframes beam-draw { 0% { stroke-dasharray: 150; stroke-dashoffset: 150; opacity: 0; } 30% { opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 1; } }
        .animate-beam-draw { animation: beam-draw 0.3s ease-out forwards; stroke-dasharray: 150; }

        @keyframes beam-flash { 0%,60% { opacity: 1; } 100% { opacity: 0; } }
        .animate-beam-flash { animation: beam-flash 0.8s ease-out forwards; }

        @keyframes lightning-branch { 0% { opacity: 0; transform: scale(0.5); } 30% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.2); } }
        .animate-lightning-branch { animation: lightning-branch 0.5s ease-out forwards; }

        @keyframes electrocute { 0%,20%,40%,60%,80% { opacity: 0.8; } 10%,30%,50%,70%,90% { opacity: 0; } 100% { opacity: 0; } }
        .animate-electrocute { animation: electrocute 0.6s ease-out forwards; }

        @keyframes shield-appear { 0% { transform: translate(-50%, -50%) scale(0); opacity: 0; } 40% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; } }
        .animate-shield-appear { animation: shield-appear 0.5s ease-out forwards; }

        @keyframes shield-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        .animate-shield-pulse { animation: shield-pulse 1s ease-in-out infinite; }

        @keyframes hex-pop { 0% { opacity: 0; transform: scale(0); } 100% { opacity: 1; transform: scale(1); } }
        .animate-hex-pop { animation: hex-pop 0.3s ease-out forwards; }

        @keyframes ghost-rush { 0% { transform: translate(0, 0); opacity: 0.7; } 70% { opacity: 0.5; } 100% { transform: translate(var(--target-x), var(--target-y)); opacity: 0; } }
        .animate-ghost-rush { animation: ghost-rush 0.5s ease-in forwards; }

        @keyframes code-rain { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(80px); opacity: 0; } }
        .animate-code-rain { animation: code-rain 0.7s ease-in forwards; }

        @keyframes glitch-tear { 0%,100% { opacity: 0; } 20%,80% { opacity: 1; } 30% { transform: translateX(-3px); } 50% { transform: translateX(3px); } 70% { transform: translateX(-1px); } }
        .animate-glitch-tear { animation: glitch-tear 0.6s linear forwards; }

        @keyframes scan-sweep { 0% { transform: translateY(0); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(120px); opacity: 0; } }
        .animate-scan-sweep { animation: scan-sweep 1s ease-in-out forwards; }

        @keyframes stats-reveal { 0% { opacity: 0; transform: translateX(-10px); } 30% { opacity: 1; transform: translateX(0); } 80% { opacity: 1; } 100% { opacity: 0; } }
        .animate-stats-reveal { animation: stats-reveal 1.5s ease-out forwards; }

        @keyframes memory-particle { 0% { transform: translate(0, 0) scale(1); opacity: 1; } 100% { transform: translate(calc(cos(var(--angle)) * var(--dist)), calc(sin(var(--angle)) * var(--dist))) scale(0); opacity: 0; } }
        .animate-memory-particle { animation: memory-particle 0.6s ease-out forwards; }

        @keyframes burst-ring { 0% { width: 0; height: 0; opacity: 1; } 100% { width: 80px; height: 80px; opacity: 0; } }
        .animate-burst-ring { animation: burst-ring 0.5s ease-out forwards; }

        @keyframes bomb-tick { 0%,50% { transform: translate(-50%, -50%) scale(1); } 25% { transform: translate(-50%, -50%) scale(1.2); } 75% { transform: translate(-50%, -50%) scale(0.9); } 100% { transform: translate(-50%, -50%) scale(2); opacity: 0; } }
        .animate-bomb-tick { animation: bomb-tick 0.8s ease-in-out forwards; }

        @keyframes explosion-ring { 0% { width: 4px; height: 4px; opacity: 1; } 100% { width: 120px; height: 120px; opacity: 0; } }
        .animate-explosion-ring { animation: explosion-ring 0.4s ease-out forwards; }

        @keyframes shockwave-particle { 0% { transform: translate(0,0); opacity: 1; } 100% { transform: translate(calc(cos(var(--angle)) * var(--dist)), calc(sin(var(--angle)) * var(--dist))); opacity: 0; } }
        .animate-shockwave-particle { animation: shockwave-particle 0.4s ease-out forwards; }

        @keyframes inject-text { 0% { opacity: 0; transform: translateX(-20px); } 20% { opacity: 1; transform: translateX(0); } 60% { opacity: 1; } 100% { opacity: 0; transform: translateX(10px); } }
        .animate-inject-text { animation: inject-text 0.6s ease-out forwards; }

        @keyframes screen-tear { 0%,100% { opacity: 0; transform: scaleX(0); } 20%,80% { opacity: 1; transform: scaleX(1); } }
        .animate-screen-tear { animation: screen-tear 0.4s ease-out forwards; }

        @keyframes rewind-spin { 0% { transform: translate(-50%, -50%) rotate(0deg) scale(0); opacity: 0; } 30% { transform: translate(-50%, -50%) rotate(-180deg) scale(1); opacity: 1; } 100% { transform: translate(-50%, -50%) rotate(-720deg) scale(0.5); opacity: 0; } }
        .animate-rewind-spin { animation: rewind-spin 1s ease-out forwards; }

        @keyframes heal-float { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-30px); opacity: 0; } }
        .animate-heal-float { animation: heal-float 0.8s ease-out forwards; }

        .z-35 { z-index: 35; }

        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
    </div>
  )
}
