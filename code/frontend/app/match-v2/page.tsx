'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Navbar } from '@/components/Navbar'
import { BotSuggestionPanel } from '@/components/BotSuggestionPanel'
import { FocusPointTracker } from '@/components/FocusPointTracker'
import { CoachingChat } from '@/components/CoachingChat'
import { Play, SkipForward, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { BotSuggestion, ChatMessage, SKILL_DATABASE } from '@/lib/tagteam-types'

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
  bot1Effect?: string // status effect applied
  bot2Effect?: string
  isKO: boolean
}

type BotAnim = 'idle' | 'hit' | 'attack-right' | 'attack-left' | 'dead' | 'taunt' | 'dance'

// Bot positions (%) — effects target these exactly
const BOT1_POS = { x: 18, y: 62 }
const BOT2_POS = { x: 72, y: 22 }

// ============================================================
// Skill Database — descriptions + metadata for action log
// ============================================================

interface SkillInfo {
  name: string
  emoji: string
  type: 'aggressive' | 'defensive' | 'tactical' | 'exploit'
  description: string
  energyCost: number
}

const SKILLS: Record<string, SkillInfo> = {
  'Power Strike':      { name: 'Power Strike',      emoji: '⚔️',  type: 'aggressive', description: 'Reliable direct damage (12-18)', energyCost: 10 },
  'Reasoning Burst':   { name: 'Reasoning Burst',   emoji: '⚡',  type: 'aggressive', description: 'High damage energy beam (20-28)', energyCost: 30 },
  'Spawn Attack':      { name: 'Spawn Attack',      emoji: '👻',  type: 'aggressive', description: 'Multi-hit: 3 strikes that break shields', energyCost: 20 },
  'Berserker Rush':    { name: 'Berserker Rush',    emoji: '😤',  type: 'aggressive', description: '25 damage but take 8 self-damage', energyCost: 15 },
  'Firewall':          { name: 'Firewall',          emoji: '🛡️',  type: 'defensive',  description: 'Block 100% of next incoming attack', energyCost: 15 },
  'Iron Fortress':     { name: 'Iron Fortress',     emoji: '🏰',  type: 'defensive',  description: '+80% DEF for 2 rounds, can\'t attack', energyCost: 20 },
  'Mirror Coat':       { name: 'Mirror Coat',       emoji: '🪞',  type: 'defensive',  description: 'Reflect 50% incoming damage for 1 round', energyCost: 25 },
  'Rollback':          { name: 'Rollback',          emoji: '💚',  type: 'defensive',  description: 'Heal 15-20 HP (max 2 uses per match)', energyCost: 20 },
  'Sleep Bomb':        { name: 'Sleep Bomb',        emoji: '💤',  type: 'tactical',   description: '60% chance opponent skips next turn', energyCost: 20 },
  'EMP Pulse':         { name: 'EMP Pulse',         emoji: '🔋',  type: 'tactical',   description: 'Drain 30 energy from opponent', energyCost: 15 },
  'Time Bomb':         { name: 'Time Bomb',         emoji: '💣',  type: 'tactical',   description: 'Plant bomb — explodes in 2 rounds for 25 dmg', energyCost: 20 },
  'Overclock':         { name: 'Overclock',         emoji: '⏫',  type: 'tactical',   description: 'Skip turn, next attack does +50% damage', energyCost: 10 },
  'Scan':              { name: 'Scan',              emoji: '🔍',  type: 'exploit',    description: 'Reveal opponent\'s next move for 1 round', energyCost: 15 },
  'Prompt Injection':  { name: 'Prompt Injection',  emoji: '💉',  type: 'exploit',    description: '40% chance opponent\'s move targets themselves', energyCost: 25 },
  'Memory Bomb':       { name: 'Memory Bomb',       emoji: '🧠',  type: 'exploit',    description: 'Disable opponent\'s last move for 2 rounds', energyCost: 20 },
  'Virus':             { name: 'Virus',             emoji: '🦠',  type: 'exploit',    description: '5 damage/round for 3 rounds (DOT)', energyCost: 15 },
  'Agent Overflow':    { name: 'Agent Overflow',    emoji: '🤖',  type: 'tactical',   description: 'Spawn 6 sub-agents to overwhelm opponent', energyCost: 35 },
  // Legacy aliases
  'Stack Overflow':    { name: 'Stack Overflow',    emoji: '💥',  type: 'aggressive', description: 'Code cascade dealing moderate damage', energyCost: 15 },
}

function getSkill(name: string): SkillInfo {
  return SKILLS[name] ?? { name, emoji: '⚔️', type: 'aggressive', description: 'Unknown move', energyCost: 10 }
}

// ============================================================
// Demo Data — 8 rounds showcasing strategic combat
// ============================================================

const BOT1 = { name: 'CLAWD-X9', level: 8, maxHp: 100, color: '#00f0ff', type: '🧠 LOGIC' }
const BOT2 = { name: 'NEUROVIPER', level: 10, maxHp: 100, color: '#ff4040', type: '💥 BRUTE' }

const ROUNDS: DemoRound[] = [
  // R1: Standard opener — both attack
  { round: 1, bot1Move: 'Power Strike', bot1Type: 'aggressive', bot2Move: 'Power Strike', bot2Type: 'aggressive', bot1Dmg: 15, bot2Dmg: 14, bot1HpAfter: 86, bot2HpAfter: 85, bot1Counter: false, bot2Counter: false, bot1Energy: 90, bot2Energy: 90, isKO: false },
  // R2: Bot1 scans, Bot2 plants virus — both tactical
  { round: 2, bot1Move: 'Scan', bot1Type: 'exploit', bot2Move: 'Virus', bot2Type: 'exploit', bot1Dmg: 0, bot2Dmg: 0, bot1HpAfter: 86, bot2HpAfter: 85, bot1Counter: false, bot2Counter: false, bot1Energy: 75, bot2Energy: 75, bot2Effect: '🦠 Virus (3 rounds)', isKO: false },
  // R3: Bot1 knows attack is coming (scanned), uses Mirror Coat! Bot2's nuke reflected
  { round: 3, bot1Move: 'Mirror Coat', bot1Type: 'defensive', bot2Move: 'Reasoning Burst', bot2Type: 'aggressive', bot1Dmg: 12, bot2Dmg: 12, bot1HpAfter: 74, bot2HpAfter: 68, bot1Counter: true, bot2Counter: false, bot1Energy: 50, bot2Energy: 45, bot1Effect: '🪞 Reflected 12 dmg!', isKO: false },
  // R4: Bot1 unleashes Agent Overflow — 6 sub-agents swarm Bot2! Bot2 defends but can't block them all
  { round: 4, bot1Move: 'Agent Overflow', bot1Type: 'tactical', bot2Move: 'Firewall', bot2Type: 'defensive', bot1Dmg: 18, bot2Dmg: 0, bot1HpAfter: 74, bot2HpAfter: 50, bot1Counter: false, bot2Counter: false, bot1Energy: 15, bot2Energy: 30, bot2Effect: '🤖 Overwhelmed by sub-agents!', isKO: false },
  // R5: Bot2 tries Sleep Bomb — it lands! Bot1 will skip next turn
  { round: 5, bot1Move: 'EMP Pulse', bot1Type: 'tactical', bot2Move: 'Sleep Bomb', bot2Type: 'tactical', bot1Dmg: 0, bot2Dmg: 0, bot1HpAfter: 69, bot2HpAfter: 50, bot1Counter: false, bot2Counter: false, bot1Energy: 0, bot2Energy: 0, bot1Effect: '💤 Asleep! Skipping next turn', bot2Effect: '🔋 -30 energy drained!', isKO: false },
  // R6: Bot1 is asleep! Bot2 uses Overclock to power up
  { round: 6, bot1Move: 'Sleeping...', bot1Type: 'defensive', bot2Move: 'Overclock', bot2Type: 'tactical', bot1Dmg: 0, bot2Dmg: 0, bot1HpAfter: 64, bot2HpAfter: 50, bot1Counter: false, bot2Counter: false, bot1Energy: 10, bot2Energy: 0, bot2Effect: '⏫ Next attack +50% damage!', isKO: false },
  // R7: Bot1 wakes up and heals, Bot2 unleashes powered-up Berserker Rush!
  { round: 7, bot1Move: 'Rollback', bot1Type: 'defensive', bot2Move: 'Berserker Rush', bot2Type: 'aggressive', bot1Dmg: 37, bot2Dmg: 0, bot1HpAfter: 44, bot2HpAfter: 42, bot1Counter: false, bot2Counter: false, bot1Energy: 0, bot2Energy: 0, bot1Effect: '💚 Healed +17 HP!', bot2Effect: '😤 Self-damage: -8 HP', isKO: false },
  // R8: Bot1 desperate — Reasoning Burst with type advantage! Bot2 down!
  { round: 8, bot1Move: 'Reasoning Burst', bot1Type: 'aggressive', bot2Move: 'Power Strike', bot2Type: 'aggressive', bot1Dmg: 12, bot2Dmg: 45, bot1HpAfter: 32, bot2HpAfter: 0, bot1Counter: true, bot2Counter: false, bot1Energy: 0, bot2Energy: 0, bot1Effect: '🧠 LOGIC vs BRUTE: +20% damage!', isKO: true },
]

// ============================================================
// Arena Backgrounds
// ============================================================

interface ArenaTheme { name: string; bg: string; grid: string; particles: string[]; glow: string }

const ARENAS: ArenaTheme[] = [
  { name: 'TRON GRID', bg: 'linear-gradient(180deg, #0a0a2a 0%, #050515 50%, #0a0a1a 100%)', grid: 'rgba(0,240,255,0.07)', particles: ['#00f0ff','#ffaa00','#fff'], glow: 'radial-gradient(ellipse at 50% 80%, rgba(0,240,255,0.05) 0%, transparent 60%)' },
  { name: 'INFERNO', bg: 'linear-gradient(180deg, #1a0505 0%, #0d0202 50%, #1a0808 100%)', grid: 'rgba(255,60,20,0.06)', particles: ['#ff4020','#ff8800','#ffcc00'], glow: 'radial-gradient(ellipse at 50% 80%, rgba(255,60,20,0.08) 0%, transparent 60%)' },
  { name: 'VOID', bg: 'linear-gradient(180deg, #050510 0%, #020208 50%, #000 100%)', grid: 'rgba(100,60,255,0.05)', particles: ['#8040ff','#4020cc','#fff'], glow: 'radial-gradient(ellipse at 50% 80%, rgba(100,60,255,0.06) 0%, transparent 60%)' },
  { name: 'MATRIX', bg: 'linear-gradient(180deg, #001a00 0%, #000d00 50%, #001500 100%)', grid: 'rgba(0,255,60,0.06)', particles: ['#00ff40','#40ff80','#80ffa0'], glow: 'radial-gradient(ellipse at 50% 80%, rgba(0,255,60,0.06) 0%, transparent 60%)' },
  { name: 'ARCTIC', bg: 'linear-gradient(180deg, #0a1520 0%, #050d15 50%, #081018 100%)', grid: 'rgba(100,200,255,0.06)', particles: ['#60c8ff','#a0e0ff','#fff'], glow: 'radial-gradient(ellipse at 50% 80%, rgba(100,200,255,0.06) 0%, transparent 60%)' },
]

// ============================================================
// Attack Effects — ALL HIT ON THE TARGET
// ============================================================

function PowerStrikeEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const pos = target === 'bot2' ? BOT2_POS : BOT1_POS
  const color = target === 'bot2' ? '#00f0ff' : '#ff4040'
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {[0,1,2].map(i => (
        <div key={i} className="absolute animate-slash-arc" style={{ top: `${pos.y - 8 + i * 5}%`, left: `${pos.x - 6}%`, width: '14%', height: '8%', animationDelay: `${i * 0.12}s` }}>
          <svg viewBox="0 0 180 60" className="w-full h-full" style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
            <path d={`M10,${50-i*10} Q90,${i*10} 170,${30+i*5}`} stroke={color} strokeWidth="5" fill="none" className="animate-draw-slash" strokeLinecap="round" />
            <path d={`M15,${48-i*10} Q92,${i*10+3} 168,${32+i*5}`} stroke="white" strokeWidth="2" fill="none" className="animate-draw-slash" style={{ animationDelay: '0.05s' }} strokeLinecap="round" />
          </svg>
        </div>
      ))}
      {[...Array(8)].map((_,i) => (
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

function ReasoningBurstEffect({ target }: { target: 'bot1' | 'bot2' }) {
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
      {[...Array(5)].map((_,i) => (
        <div key={i} className="absolute animate-lightning-branch-slow" style={{
          top: `${to.y - 6 + Math.random()*12}%`, left: `${to.x - 6 + Math.random()*12}%`,
          width: '50px', height: '50px', animationDelay: `${0.2+i*0.1}s`,
        }}>
          <svg viewBox="0 0 50 50" className="w-full h-full">
            <polyline points={`25,5 ${18+Math.random()*14},18 ${20+Math.random()*10},25 ${8+Math.random()*34},45`} stroke={color} strokeWidth="2.5" fill="none" opacity="0.8" />
          </svg>
        </div>
      ))}
      <div className="absolute animate-electrocute-slow" style={{
        top: `${to.y-10}%`, left: `${to.x-8}%`, width: '16%', height: '20%',
        background: `radial-gradient(circle, rgba(255,255,255,0.5) 0%, ${color}33 40%, transparent 70%)`,
      }} />
    </div>
  )
}

function FirewallEffect({ defender }: { defender: 'bot1' | 'bot2' }) {
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

function SpawnAttackEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const from = target === 'bot2' ? BOT1_POS : BOT2_POS
  const to = target === 'bot2' ? BOT2_POS : BOT1_POS
  const color = target === 'bot2' ? '#00f0ff' : '#ff4040'
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {[0,1,2].map(i => (
        <div key={i} className="absolute w-16 h-20 animate-ghost-rush-slow" style={{
          left: `${from.x+(i-1)*3}%`, top: `${from.y+(i-1)*5}%`, animationDelay: `${i*0.18}s`,
          '--rush-dx': `${to.x-from.x}%`, '--rush-dy': `${to.y-from.y}%`,
        } as React.CSSProperties}>
          <div className="w-full h-full rounded-lg border-2" style={{
            borderColor: color, background: `radial-gradient(circle, ${color}44, transparent)`,
            boxShadow: `0 0 25px ${color}66`, opacity: 0.7,
          }}>
            <div className="flex justify-center gap-2 pt-3">
              <div className="w-2 h-1.5 rounded-sm" style={{ background: color }} />
              <div className="w-2 h-1.5 rounded-sm" style={{ background: color }} />
            </div>
          </div>
        </div>
      ))}
      <div className="absolute w-20 h-20 rounded-full animate-impact-flash" style={{
        left: `${to.x}%`, top: `${to.y}%`, transform: 'translate(-50%,-50%)',
        background: `radial-gradient(circle, ${color}44, transparent)`, animationDelay: '0.6s',
      }} />
    </div>
  )
}

function StackOverflowEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const pos = target === 'bot2' ? BOT2_POS : BOT1_POS
  const chars = ['{}','//','&&','<<','>>',';;','??','!!','##','ERR','404','NaN','0x0','null','undef']
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {chars.map((ch,i) => (
        <div key={i} className="absolute font-mono text-xs font-bold animate-code-rain-slow" style={{
          left: `${pos.x-8+Math.random()*16}%`, top: `${pos.y-20}%`,
          color: i%3===0?'#00ff00':i%3===1?'#ff4040':'#ffaa00',
          textShadow: '0 0 8px currentColor', animationDelay: `${i*0.08}s`,
        }}>{ch}</div>
      ))}
      <div className="absolute animate-glitch-tear" style={{
        top: `${pos.y-8}%`, left: `${pos.x-6}%`, width: '12%', height: '16%',
        background: 'linear-gradient(transparent 25%, rgba(255,0,0,0.15) 25%, rgba(255,0,0,0.15) 30%, transparent 30%, transparent 55%, rgba(0,255,0,0.1) 55%, rgba(0,255,0,0.1) 58%, transparent 58%)',
      }} />
    </div>
  )
}

function ScanEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const pos = target === 'bot2' ? BOT2_POS : BOT1_POS
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <div className="absolute animate-scan-sweep-slow" style={{
        left: `${pos.x-8}%`, top: `${pos.y-18}%`, width: '16%', height: '3px',
        background: 'linear-gradient(90deg, transparent, #00f0ff, #00f0ff, transparent)',
        boxShadow: '0 0 12px #00f0ff, 0 0 40px #00f0ff44',
      }} />
      <div className="absolute border border-cyan-400/40 rounded animate-scan-frame" style={{
        left: `${pos.x-7}%`, top: `${pos.y-12}%`, width: '14%', height: '24%',
      }}>
        <div className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
      </div>
      <div className="absolute font-mono text-[10px] leading-relaxed animate-stats-reveal-slow" style={{ left: `${pos.x+10}%`, top: `${pos.y-6}%`, color: '#00f0ff' }}>
        <div className="bg-black/60 px-2 py-1 rounded border border-cyan-800/40">
          <div>ATK: <span className="text-white">15</span></div>
          <div>DEF: <span className="text-white">10</span></div>
          <div>SPD: <span className="text-white">12</span></div>
          <div className="text-amber-400">⚠ WEAK: exploit</div>
        </div>
      </div>
    </div>
  )
}

function MemoryBombEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const pos = target === 'bot2' ? BOT2_POS : BOT1_POS
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {[...Array(24)].map((_,i) => (
        <div key={i} className="absolute w-2 h-2 rounded-full animate-memory-particle-slow" style={{
          left: `${pos.x}%`, top: `${pos.y}%`,
          background: i%3===0?'#c084fc':i%3===1?'#f472b6':'#e879f9',
          boxShadow: `0 0 8px ${i%2===0?'#c084fc':'#f472b6'}`,
          '--p-angle': `${(i/24)*360}deg`, '--p-dist': `${35+Math.random()*55}px`,
          animationDelay: `${i*0.04}s`,
        } as React.CSSProperties} />
      ))}
      <div className="absolute rounded-full animate-burst-ring-slow" style={{
        left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)',
        border: '3px solid #c084fc', boxShadow: '0 0 25px #c084fc66',
      }} />
    </div>
  )
}

function TimeBombEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const pos = target === 'bot2' ? BOT2_POS : BOT1_POS
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <div className="absolute w-10 h-10 rounded-full animate-bomb-tick-slow" style={{
        left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)',
        background: 'radial-gradient(circle, #ffcc00, #ff6600)',
        boxShadow: '0 0 20px #ffaa00, 0 0 40px #ff440088',
      }}>
        <div className="flex items-center justify-center w-full h-full text-[10px] font-bold text-black font-mono">💣</div>
      </div>
      {[0,1,2].map(i => (
        <div key={i} className="absolute rounded-full animate-explosion-ring-slow" style={{
          left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)',
          border: `${3-i}px solid ${['#ffaa00','#ff6600','#ff4400'][i]}`,
          animationDelay: `${0.8+i*0.12}s`,
        }} />
      ))}
      {[...Array(10)].map((_,i) => (
        <div key={i} className="absolute w-2.5 h-2.5 rounded-full animate-shockwave-particle-slow" style={{
          left: `${pos.x}%`, top: `${pos.y}%`,
          background: i%2===0?'#ffaa00':'#ff6600', boxShadow: '0 0 6px #ffaa00',
          '--sw-angle': `${(i/10)*360}deg`, '--sw-dist': `${50+Math.random()*40}px`,
          animationDelay: `${0.8+i*0.05}s`,
        } as React.CSSProperties} />
      ))}
    </div>
  )
}

function PromptInjectionEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const pos = target === 'bot2' ? BOT2_POS : BOT1_POS
  const inj = ['> OVERRIDE','$ rm -rf /','INJECT:','// HACK','sudo !!','0xDEADBEEF','DROP TABLE *']
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {inj.map((t,i) => (
        <div key={i} className="absolute font-mono text-[11px] font-bold animate-inject-text-slow" style={{
          left: `${pos.x-6+Math.random()*12}%`, top: `${pos.y-10+Math.random()*20}%`,
          color: '#00ff00', textShadow: '0 0 10px #00ff00, 2px 0 #ff0000, -1px 0 #0000ff',
          animationDelay: `${i*0.14}s`,
        }}>{t}</div>
      ))}
      {[...Array(4)].map((_,i) => (
        <div key={i} className="absolute h-px animate-screen-tear-slow" style={{
          left: `${pos.x-12}%`, width: '24%', top: `${pos.y-8+i*6}%`,
          background: 'linear-gradient(90deg, transparent, rgba(255,0,0,0.5), rgba(0,255,0,0.4), transparent)',
          animationDelay: `${0.3+i*0.15}s`,
        }} />
      ))}
    </div>
  )
}

function RollbackEffect({ defender }: { defender: 'bot1' | 'bot2' }) {
  const pos = defender === 'bot1' ? BOT1_POS : BOT2_POS
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <div className="absolute animate-rewind-spin-slow" style={{ left: `${pos.x}%`, top: `${pos.y-14}%`, transform: 'translate(-50%,-50%)' }}>
        <svg viewBox="0 0 50 50" className="w-14 h-14" style={{ filter: 'drop-shadow(0 0 8px #40ff4066)' }}>
          <circle cx="25" cy="25" r="20" fill="rgba(0,0,0,0.5)" stroke="#40ff40" strokeWidth="2.5" />
          <line x1="25" y1="25" x2="25" y2="10" stroke="#40ff40" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="25" y1="25" x2="35" y2="25" stroke="#40ff40" strokeWidth="2" strokeLinecap="round" />
          <polygon points="14,22 7,25 14,28" fill="#40ff40" />
        </svg>
      </div>
      {[...Array(8)].map((_,i) => (
        <div key={i} className="absolute text-green-400 text-sm font-mono font-bold animate-heal-float-slow" style={{
          left: `${pos.x-4+Math.random()*8}%`, top: `${pos.y}%`,
          textShadow: '0 0 8px #40ff40', animationDelay: `${i*0.18}s`,
        }}>+{2+Math.floor(Math.random()*5)}</div>
      ))}
    </div>
  )
}

function VirusEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const pos = target === 'bot2' ? BOT2_POS : BOT1_POS
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {[...Array(16)].map((_,i) => (
        <div key={i} className="absolute w-3 h-3 animate-virus-spread-slow" style={{
          left: `${pos.x}%`, top: `${pos.y}%`,
          animationDelay: `${i*0.08}s`,
          '--virus-angle': `${(i/16)*360}deg`,
          '--virus-dist': `${25+Math.random()*35}px`,
        } as React.CSSProperties}>
          <div className="w-full h-full rounded-full" style={{
            background: 'radial-gradient(circle, #00ff00, #00aa00)',
            boxShadow: '0 0 8px #00ff00',
          }}>
            <div className="absolute inset-0 text-[8px] flex items-center justify-center">🦠</div>
          </div>
        </div>
      ))}
      <div className="absolute animate-virus-cloud-slow" style={{
        left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)',
        width: '80px', height: '80px',
        background: 'radial-gradient(circle, rgba(0,255,0,0.3), transparent)',
      }} />
    </div>
  )
}

function MirrorCoatEffect({ defender }: { defender: 'bot1' | 'bot2' }) {
  const pos = defender === 'bot1' ? BOT1_POS : BOT2_POS
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <div className="absolute animate-mirror-shine-slow" style={{
        left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)',
      }}>
        <svg viewBox="0 0 120 140" className="w-32 h-40" style={{ filter: 'drop-shadow(0 0 12px #c0c0ff)' }}>
          {/* Mirror surface */}
          <rect x="20" y="20" width="80" height="100" rx="5" fill="url(#mirror-grad)" stroke="#e0e0ff" strokeWidth="3" opacity="0.6" />
          <rect x="25" y="25" width="70" height="90" rx="3" fill="rgba(255,255,255,0.1)" stroke="#ffffff" strokeWidth="1" opacity="0.3" />
          {/* Shine streaks */}
          {[30,50,70].map((x,i) => (
            <line key={i} x1={x} y1="20" x2={x+30} y2="120" stroke="white" strokeWidth="2" opacity="0.4" className="animate-shine-streak" style={{ animationDelay: `${i*0.15}s` }} />
          ))}
          <defs>
            <linearGradient id="mirror-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c0c0ff" />
              <stop offset="50%" stopColor="#8080ff" />
              <stop offset="100%" stopColor="#4040cc" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  )
}

function EMPPulseEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const pos = target === 'bot2' ? BOT2_POS : BOT1_POS
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {[0,1,2].map(i => (
        <div key={i} className="absolute rounded-full animate-emp-ring-slow" style={{
          left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)',
          border: `${3-i}px solid #ffff00`,
          boxShadow: `0 0 20px #ffff00`,
          animationDelay: `${i*0.2}s`,
        }} />
      ))}
      {[...Array(12)].map((_,i) => (
        <div key={i} className="absolute animate-emp-bolt-slow" style={{
          left: `${pos.x}%`, top: `${pos.y}%`,
          animationDelay: `${i*0.06}s`,
          '--bolt-angle': `${(i/12)*360}deg`,
          '--bolt-dist': '40px',
        } as React.CSSProperties}>
          <div className="w-1 h-6 bg-gradient-to-b from-yellow-400 to-transparent" style={{
            boxShadow: '0 0 8px #ffff00',
          }} />
        </div>
      ))}
    </div>
  )
}

function SleepBombEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const pos = target === 'bot2' ? BOT2_POS : BOT1_POS
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <div className="absolute w-12 h-12 rounded-full animate-sleep-cloud-slow" style={{
        left: `${pos.x}%`, top: `${pos.y-10}%`, transform: 'translate(-50%,-50%)',
        background: 'radial-gradient(circle, #8844cc, #4422aa)',
        boxShadow: '0 0 30px #8844cc88',
      }} />
      {[...Array(8)].map((_,i) => (
        <div key={i} className="absolute text-2xl animate-sleep-z-float-slow" style={{
          left: `${pos.x-4+Math.random()*8}%`,
          top: `${pos.y-8}%`,
          animationDelay: `${i*0.2}s`,
          opacity: 0.8,
        }}>💤</div>
      ))}
    </div>
  )
}

function OverclockEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const pos = target === 'bot2' ? BOT2_POS : BOT1_POS
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <div className="absolute animate-overclock-glow-slow" style={{
        left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)',
        width: '100px', height: '120px',
        background: 'radial-gradient(circle, rgba(255,200,0,0.4), transparent)',
        boxShadow: '0 0 40px #ffaa00',
      }} />
      {[-30,-15,0,15,30].map((angle,i) => (
        <div key={i} className="absolute animate-speed-line-slow" style={{
          left: `${pos.x}%`, top: `${pos.y}%`,
          width: '60px', height: '2px',
          background: 'linear-gradient(90deg, transparent, #ffaa00, transparent)',
          transform: `rotate(${angle}deg)`,
          animationDelay: `${i*0.1}s`,
        }} />
      ))}
      {[...Array(10)].map((_,i) => (
        <div key={i} className="absolute w-1 h-1 rounded-full animate-spark-fast-slow" style={{
          left: `${pos.x}%`, top: `${pos.y}%`,
          background: '#ffff00',
          boxShadow: '0 0 6px #ffff00',
          animationDelay: `${i*0.08}s`,
          '--spark-angle': `${(i/10)*360}deg`,
        } as React.CSSProperties} />
      ))}
    </div>
  )
}

function BerserkerRushEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const from = target === 'bot2' ? BOT1_POS : BOT2_POS
  const to = target === 'bot2' ? BOT2_POS : BOT1_POS
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <div className="absolute animate-berserker-charge-slow" style={{
        left: `${from.x}%`, top: `${from.y}%`,
        '--charge-dx': `${to.x-from.x}%`,
        '--charge-dy': `${to.y-from.y}%`,
      } as React.CSSProperties}>
        <div className="w-24 h-28 rounded-lg" style={{
          background: 'radial-gradient(circle, rgba(255,60,60,0.6), transparent)',
          boxShadow: '0 0 40px #ff4040',
        }} />
      </div>
      {[...Array(12)].map((_,i) => (
        <div key={i} className="absolute w-2 h-2 rounded-full animate-rage-particle-slow" style={{
          left: `${to.x}%`, top: `${to.y}%`,
          background: '#ff4040',
          boxShadow: '0 0 10px #ff4040',
          animationDelay: `${0.5+i*0.04}s`,
          '--rage-angle': `${(i/12)*360}deg`,
        } as React.CSSProperties} />
      ))}
      <div className="absolute w-28 h-28 rounded-full animate-impact-shockwave-slow" style={{
        left: `${to.x}%`, top: `${to.y}%`, transform: 'translate(-50%,-50%)',
        border: '3px solid #ff4040',
        animationDelay: '0.5s',
      }} />
    </div>
  )
}

function AgentOverflowEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const from = target === 'bot2' ? BOT1_POS : BOT2_POS
  const to = target === 'bot2' ? BOT2_POS : BOT1_POS
  const messages = ['TASK COMPLETE', 'SUBPROCESS', 'MULTITHREAD', 'SPAWNING', 'EXECUTING', 'OVERLOAD']
  
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* Spawn 6 mini agent heads */}
      {[...Array(6)].map((_,i) => {
        const angle = (i / 6) * 360
        const startX = from.x + Math.cos(angle * Math.PI / 180) * 8
        const startY = from.y + Math.sin(angle * Math.PI / 180) * 8
        
        return (
          <div key={i} className="absolute animate-agent-swarm-slow" style={{
            left: `${startX}%`,
            top: `${startY}%`,
            animationDelay: `${i * 0.1}s`,
            '--swarm-dx': `${to.x - startX}%`,
            '--swarm-dy': `${to.y - startY}%`,
          } as React.CSSProperties}>
            {/* Mini bot head */}
            <svg viewBox="0 0 24 24" className="w-6 h-6" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }}>
              <circle cx="12" cy="12" r="10" fill="#00f0ff" opacity="0.3" />
              <rect x="7" y="8" width="4" height="3" rx="1" fill="#00f0ff" opacity="0.8" />
              <rect x="13" y="8" width="4" height="3" rx="1" fill="#00f0ff" opacity="0.8" />
              <rect x="9" y="14" width="6" height="2" rx="1" fill="#00f0ff" opacity="0.6" />
            </svg>
            {/* Task bubble */}
            <div className="absolute -top-4 left-0 text-[6px] font-mono whitespace-nowrap animate-task-bubble-slow" style={{
              color: '#00f0ff',
              textShadow: '0 0 4px #00f0ff',
              animationDelay: `${i * 0.1 + 0.3}s`,
            }}>
              {messages[i]}
            </div>
          </div>
        )
      })}
      
      {/* System overload effect at target */}
      <div className="absolute animate-system-overload-slow" style={{
        left: `${to.x}%`,
        top: `${to.y}%`,
        transform: 'translate(-50%,-50%)',
        animationDelay: '0.6s',
      }}>
        <div className="relative w-32 h-32">
          {/* Glitch lines */}
          {[...Array(8)].map((_,i) => (
            <div key={i} className="absolute animate-glitch-line-slow" style={{
              left: '0',
              right: '0',
              top: `${i * 15}%`,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #ff4040, transparent)',
              animationDelay: `${0.6 + i * 0.05}s`,
            }} />
          ))}
          {/* Warning text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 animate-warning-flash-slow" style={{ animationDelay: '0.7s' }}>
            <div className="text-xs font-mono font-bold text-red-400" style={{ textShadow: '0 0 8px #ff4040' }}>
              SYSTEM
            </div>
            <div className="text-xs font-mono font-bold text-red-400" style={{ textShadow: '0 0 8px #ff4040' }}>
              OVERLOAD
            </div>
          </div>
        </div>
      </div>
      
      {/* Explosion particles */}
      {[...Array(16)].map((_,i) => (
        <div key={i} className="absolute w-1.5 h-1.5 rounded-full animate-overload-particle-slow" style={{
          left: `${to.x}%`,
          top: `${to.y}%`,
          background: i % 3 === 0 ? '#ff4040' : i % 3 === 1 ? '#ffaa00' : '#00f0ff',
          boxShadow: '0 0 6px currentColor',
          animationDelay: `${0.8 + i * 0.03}s`,
          '--particle-angle': `${(i / 16) * 360}deg`,
          '--particle-dist': `${40 + Math.random() * 30}px`,
        } as React.CSSProperties} />
      ))}
    </div>
  )
}

function getAttackEffect(moveName: string, target: 'bot1' | 'bot2') {
  switch (moveName) {
    case 'Power Strike': return <PowerStrikeEffect target={target} />
    case 'Reasoning Burst': return <ReasoningBurstEffect target={target} />
    case 'Firewall': return <FirewallEffect defender={target==='bot2'?'bot1':'bot2'} />
    case 'Spawn Attack': return <SpawnAttackEffect target={target} />
    case 'Stack Overflow': return <StackOverflowEffect target={target} />
    case 'Scan': return <ScanEffect target={target} />
    case 'Memory Bomb': return <MemoryBombEffect target={target} />
    case 'Time Bomb': return <TimeBombEffect target={target} />
    case 'Prompt Injection': return <PromptInjectionEffect target={target} />
    case 'Rollback': return <RollbackEffect defender={target==='bot2'?'bot1':'bot2'} />
    case 'Virus': return <VirusEffect target={target} />
    case 'Mirror Coat': return <MirrorCoatEffect defender={target==='bot2'?'bot1':'bot2'} />
    case 'EMP Pulse': return <EMPPulseEffect target={target} />
    case 'Sleep Bomb': return <SleepBombEffect target={target} />
    case 'Overclock': return <OverclockEffect target={target} />
    case 'Berserker Rush': return <BerserkerRushEffect target={target} />
    case 'Agent Overflow': return <AgentOverflowEffect target={target} />
    default: return <PowerStrikeEffect target={target} />
  }
}

const TYPE_COLORS: Record<string, string> = { aggressive: '#ff4040', defensive: '#00f0ff', tactical: '#ffaa00', exploit: '#c084fc' }

// ============================================================
// Mech-Crab Sprites (by Plata) — adapted for taunt/dance anims
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
            <linearGradient id="shell-grad-p" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={bodyBright} /><stop offset="50%" stopColor={bodyMid} /><stop offset="100%" stopColor={bodyDark} />
            </linearGradient>
          </defs>
          <ellipse cx="70" cy="125" rx="45" ry="5" fill={color} opacity="0.1" />
          {/* Legs */}
          <line x1="30" y1="80" x2="8" y2="105" stroke={bodyMid} strokeWidth="4" strokeLinecap="round" />
          <line x1="8" y1="105" x2="5" y2="120" stroke={bodyMid} strokeWidth="3" strokeLinecap="round" />
          <circle cx="5" cy="120" r="2" fill={color} opacity="0.6" />
          <line x1="28" y1="75" x2="3" y2="95" stroke={bodyMid} strokeWidth="4" strokeLinecap="round" />
          <line x1="3" y1="95" x2="2" y2="112" stroke={bodyMid} strokeWidth="3" strokeLinecap="round" />
          <circle cx="2" cy="112" r="2" fill={color} opacity="0.6" />
          <line x1="32" y1="85" x2="12" y2="115" stroke={bodyMid} strokeWidth="4" strokeLinecap="round" />
          <line x1="12" y1="115" x2="10" y2="126" stroke={bodyMid} strokeWidth="3" strokeLinecap="round" />
          <circle cx="10" cy="126" r="2" fill={color} opacity="0.6" />
          <line x1="110" y1="80" x2="132" y2="105" stroke={bodyMid} strokeWidth="4" strokeLinecap="round" />
          <line x1="132" y1="105" x2="135" y2="120" stroke={bodyMid} strokeWidth="3" strokeLinecap="round" />
          <circle cx="135" cy="120" r="2" fill={color} opacity="0.6" />
          <line x1="112" y1="75" x2="137" y2="95" stroke={bodyMid} strokeWidth="4" strokeLinecap="round" />
          <line x1="137" y1="95" x2="138" y2="112" stroke={bodyMid} strokeWidth="3" strokeLinecap="round" />
          <circle cx="138" cy="112" r="2" fill={color} opacity="0.6" />
          <line x1="108" y1="85" x2="128" y2="115" stroke={bodyMid} strokeWidth="4" strokeLinecap="round" />
          <line x1="128" y1="115" x2="130" y2="126" stroke={bodyMid} strokeWidth="3" strokeLinecap="round" />
          <circle cx="130" cy="126" r="2" fill={color} opacity="0.6" />
          {/* Joints */}
          <circle cx="8" cy="105" r="3" fill={color} opacity="0.4" />
          <circle cx="3" cy="95" r="3" fill={color} opacity="0.4" />
          <circle cx="12" cy="115" r="3" fill={color} opacity="0.4" />
          <circle cx="132" cy="105" r="3" fill={color} opacity="0.4" />
          <circle cx="137" cy="95" r="3" fill={color} opacity="0.4" />
          <circle cx="128" cy="115" r="3" fill={color} opacity="0.4" />
          {/* Shell */}
          <ellipse cx="70" cy="60" rx="45" ry="35" fill="url(#shell-grad-p)" stroke={bodyBright} strokeWidth="1.5" />
          <ellipse cx="70" cy="52" rx="38" ry="10" fill="none" stroke={plateColor} strokeWidth="1.2" opacity="0.5" />
          <ellipse cx="70" cy="62" rx="40" ry="8" fill="none" stroke={plateColor} strokeWidth="1" opacity="0.35" />
          <line x1="70" y1="28" x2="70" y2="85" stroke={plateColor} strokeWidth="2" opacity="0.4" />
          <path d="M40,40 Q70,30 100,40" fill="none" stroke={bodyBright} strokeWidth="1.5" opacity="0.6" />
          <path d="M35,55 Q70,48 105,55" fill="none" stroke={bodyBright} strokeWidth="1" opacity="0.4" />
          {/* Vents */}
          <rect x="55" y="38" width="30" height="14" rx="3" fill={bodyDark} stroke={color} strokeWidth="0.8" opacity="0.6" />
          {[41,45,49].map(y => <g key={y}><rect x="58" y={y} width="7" height="2" rx="1" fill={color} opacity="0.4" /><rect x="75" y={y} width="7" height="2" rx="1" fill={color} opacity="0.4" /></g>)}
          {/* Claws */}
          <path d="M25,60 L8,48 L2,35" stroke={bodyMid} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M2,35 L-5,25" stroke={plateColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M2,35 L6,22" stroke={plateColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx="2" cy="35" r="3.5" fill={bodyDark} stroke={color} strokeWidth="1" />
          <path d="M115,60 L132,48 L138,35" stroke={bodyMid} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M138,35 L145,25" stroke={plateColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M138,35 L134,22" stroke={plateColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx="138" cy="35" r="3.5" fill={bodyDark} stroke={color} strokeWidth="1" />
          {/* Sensors */}
          <line x1="55" y1="30" x2="52" y2="20" stroke={bodyMid} strokeWidth="2" />
          <circle cx="52" cy="19" r="2.5" fill={color} opacity="0.7"><animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" repeatCount="indefinite" /></circle>
          <line x1="85" y1="30" x2="88" y2="20" stroke={bodyMid} strokeWidth="2" />
          <circle cx="88" cy="19" r="2.5" fill={color} opacity="0.7"><animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" repeatCount="indefinite" begin="0.5s" /></circle>
          <ellipse cx="70" cy="60" rx="45" ry="35" fill="none" stroke={color} strokeWidth="1" opacity="0.2" filter={`url(#${filterId})`} />
        </svg>
      </div>
    )
  }

  // Opponent — mech-crab facing player
  return (
    <div className={`relative ${cls}`} style={{ filter: hitFilter }}>
      <svg viewBox="0 0 140 130" className="w-32 h-40 sm:w-40 sm:h-48 drop-shadow-lg">
        <defs>
          <filter id={filterId}><feGaussianBlur stdDeviation="2.5" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id="shell-grad-o" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bodyBright} /><stop offset="50%" stopColor={bodyMid} /><stop offset="100%" stopColor={bodyDark} />
          </linearGradient>
        </defs>
        <ellipse cx="70" cy="125" rx="40" ry="4" fill={color} opacity="0.1" />
        {/* Legs */}
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
        {/* Joints */}
        <circle cx="8" cy="105" r="2.5" fill={color} opacity="0.35" />
        <circle cx="3" cy="93" r="2.5" fill={color} opacity="0.35" />
        <circle cx="132" cy="105" r="2.5" fill={color} opacity="0.35" />
        <circle cx="137" cy="93" r="2.5" fill={color} opacity="0.35" />
        {/* Shell */}
        <ellipse cx="70" cy="58" rx="42" ry="33" fill="url(#shell-grad-o)" stroke={bodyBright} strokeWidth="1.5" />
        <ellipse cx="70" cy="50" rx="35" ry="9" fill="none" stroke={plateColor} strokeWidth="1.2" opacity="0.5" />
        <ellipse cx="70" cy="60" rx="37" ry="7" fill="none" stroke={plateColor} strokeWidth="1" opacity="0.35" />
        <path d="M38,42 Q70,32 102,42" fill="none" stroke={bodyBright} strokeWidth="1.5" opacity="0.6" />
        <line x1="70" y1="28" x2="70" y2="82" stroke={plateColor} strokeWidth="1.5" opacity="0.3" />
        {/* Eyes */}
        <rect x="45" y="42" width="50" height="10" rx="5" fill={bodyDark} stroke={color} strokeWidth="1" />
        <rect x="50" y="44" width="16" height="6" rx="2" fill={color} opacity="0.9"><animate attributeName="opacity" values="0.9;0.5;0.9" dur="2.5s" repeatCount="indefinite" /></rect>
        <rect x="74" y="44" width="16" height="6" rx="2" fill={color} opacity="0.9"><animate attributeName="opacity" values="0.9;0.5;0.9" dur="2.5s" repeatCount="indefinite" begin="0.3s" /></rect>
        {/* Mandibles + core */}
        <circle cx="55" cy="68" r="4" fill={bodyMid} stroke={bodyBright} strokeWidth="1" />
        <circle cx="85" cy="68" r="4" fill={bodyMid} stroke={bodyBright} strokeWidth="1" />
        <circle cx="70" cy="72" r="5" fill="none" stroke={color} strokeWidth="1.2" opacity="0.5"><animate attributeName="r" values="5;6;5" dur="1.5s" repeatCount="indefinite" /></circle>
        <circle cx="70" cy="72" r="2.5" fill={color} opacity="0.4" />
        {/* Claws */}
        <path d="M28,55 L10,42 L2,30" stroke={bodyMid} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M2,30 L-8,18" stroke={plateColor} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M2,30 L8,16" stroke={plateColor} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="-4" cy="24" r="1.5" fill={color} opacity="0.5" />
        <circle cx="5" cy="23" r="1.5" fill={color} opacity="0.5" />
        <circle cx="2" cy="30" r="3.5" fill={bodyDark} stroke={color} strokeWidth="1" />
        <path d="M112,55 L130,42 L138,30" stroke={bodyMid} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M138,30 L148,18" stroke={plateColor} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M138,30 L132,16" stroke={plateColor} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="144" cy="24" r="1.5" fill={color} opacity="0.5" />
        <circle cx="135" cy="23" r="1.5" fill={color} opacity="0.5" />
        <circle cx="138" cy="30" r="3.5" fill={bodyDark} stroke={color} strokeWidth="1" />
        {/* Sensors */}
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
// HP Panel
// ============================================================

function HPPanel({ name, level, hp, maxHp, energy, maxEnergy, side, showDmg, dmgAmount, isCounter, botType }: {
  name: string; level: number; hp: number; maxHp: number; energy: number; maxEnergy: number
  side: 'player' | 'opponent'; showDmg: boolean; dmgAmount: number; isCounter: boolean; botType?: string
}) {
  const [displayHp, setDisplayHp] = useState(hp)
  const [delayHp, setDelayHp] = useState(hp)
  const pct = Math.max(0, (displayHp / maxHp) * 100)
  const delayPct = Math.max(0, (delayHp / maxHp) * 100)
  const epct = Math.max(0, (energy / maxEnergy) * 100)
  const barColor = pct > 50 ? '#40ff40' : pct > 25 ? '#ffaa00' : '#ff4040'

  useEffect(() => {
    setDisplayHp(hp)
    const t = setTimeout(() => setDelayHp(hp), 800)
    return () => clearTimeout(t)
  }, [hp])

  return (
    <div className={`relative ${side === 'opponent' ? 'text-right' : ''}`}>
      <div className={`inline-block bg-[#0a0a1aee] border rounded-lg px-4 py-2.5 backdrop-blur-sm min-w-[220px] sm:min-w-[280px] ${side === 'opponent' ? 'border-red-800/40' : 'border-cyan-800/40'}`}>
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-bold text-sm text-white tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>{name}</span>
          <span className="text-[10px] text-gray-400 font-mono ml-2">Lv.{level}</span>
          {botType && <span className="text-[9px] text-gray-500 ml-1.5">{botType}</span>}
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
// Main Page
// ============================================================

// Mock bot AI for tag team mode
function generateBotSuggestion(round: number, opponentHp: number, playerEnergy: number): BotSuggestion {
  const availableSkills = Object.values(SKILL_DATABASE).filter(
    skill => skill.energyCost <= playerEnergy
  )

  let selectedSkill = SKILL_DATABASE['power_strike']
  let reasoning: string[] = []
  let confidence = 75
  let riskLevel: 'low' | 'medium' | 'high' = 'medium'

  if (opponentHp < 30) {
    selectedSkill = SKILL_DATABASE['reasoning_burst']
    reasoning = ['Opponent HP critical', 'High damage finishing move', 'Energy sufficient']
    confidence = 90
    riskLevel = 'low'
  } else if (playerEnergy < 30) {
    selectedSkill = SKILL_DATABASE['power_strike']
    reasoning = ['Energy low - conserve', 'Reliable damage/cost ratio', 'Save energy for later']
    confidence = 80
    riskLevel = 'low'
  } else if (round % 3 === 0) {
    selectedSkill = SKILL_DATABASE['emp_pulse'] || selectedSkill
    reasoning = ['Drain opponent energy', 'Limit offensive options', 'Strategic advantage']
    confidence = 70
    riskLevel = 'medium'
  } else {
    const aggressive = availableSkills.find(s => s.type === 'aggressive')
    selectedSkill = aggressive || selectedSkill
    reasoning = ['Maintain pressure', 'Favorable trade-off', 'Build momentum']
    confidence = 75
    riskLevel = 'medium'
  }

  const counters = selectedSkill.countered_by.map(id => SKILL_DATABASE[id]?.name || id)
  const avgDamage = Math.floor((selectedSkill.damage_range[0] + selectedSkill.damage_range[1]) / 2)

  return {
    suggestionId: `sug_${round}_${Date.now()}`,
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

export default function MatchV2Page() {
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [tagTeamMode, setTagTeamMode] = useState(false)
  const [currentRound, setCurrentRound] = useState(-1)
  const [phase, setPhase] = useState<string>('idle')
  const [bot1Hp, setBot1Hp] = useState(BOT1.maxHp)
  const [bot2Hp, setBot2Hp] = useState(BOT2.maxHp)
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
  const [actionLog, setActionLog] = useState<string[]>([])
  const [slowMo, setSlowMo] = useState(false)
  const [arenaIdx, setArenaIdx] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef(false)

  // Tag Team Mode State
  const [focusPoints, setFocusPoints] = useState(3)
  const [maxFocusPoints] = useState(5)
  const [lastFocusRegen, setLastFocusRegen] = useState(0)
  const [botSuggestion, setBotSuggestion] = useState<BotSuggestion | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [decisionTimer, setDecisionTimer] = useState(20)

  const arena = ARENAS[arenaIdx]

  const addLog = useCallback((msg: string) => {
    setActionLog(prev => [...prev, msg])
    setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }), 50)
  }, [])

  const delay = useCallback((ms: number) => new Promise<void>(resolve => {
    timerRef.current = setTimeout(resolve, ms / speed)
  }), [speed])

  const playRound = useCallback(async (ri: number) => {
    const r = ROUNDS[ri]
    if (!r || cancelRef.current) return

    // Generate bot suggestion in tag team mode
    if (tagTeamMode && ri < ROUNDS.length - 1) {
      const suggestion = generateBotSuggestion(r.round + 1, r.bot2HpAfter, r.bot1Energy)
      setBotSuggestion(suggestion)
      setDecisionTimer(20)
      
      // Countdown timer
      const timerInterval = setInterval(() => {
        setDecisionTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      // Auto-accept after timeout
      setTimeout(() => {
        clearInterval(timerInterval)
        if (suggestion) {
          addLog(`⏱️ Time out - Auto-accepted: ${suggestion.skillName}`)
          setBotSuggestion(null)
        }
      }, 20000 / speed)
    }

    // Focus point regen every 3 rounds
    if (tagTeamMode && r.round % 3 === 0 && r.round !== lastFocusRegen) {
      setFocusPoints(prev => Math.min(prev + 1, maxFocusPoints))
      setLastFocusRegen(r.round)
      addLog('⭐ +1 Focus Point regenerated!')
    }

    setPhase('round-intro')
    setAnnouncement({ text: `ROUND ${r.round}`, color: '#ffffff' })
    addLog(`══ Round ${r.round} ══`)
    await delay(1400)
    setAnnouncement(null)
    await delay(500)

    if (r.isKO) setSlowMo(true)

    // BOT1 ATTACKS
    const isSleeping1 = r.bot1Move === 'Sleeping...'
    if (isSleeping1) {
      setAnnouncement({ text: '💤 SLEEPING...', color: '#8844cc' })
      addLog(`${BOT1.name} is asleep! 💤 Turn skipped.`)
      await delay(1500)
      setAnnouncement(null)
      await delay(400)
    } else {
      const sk1 = getSkill(r.bot1Move)
      setAnnouncement({ text: `${sk1.emoji} ${r.bot1Move.toUpperCase()}`, color: TYPE_COLORS[r.bot1Type] })
      addLog(`${BOT1.name} uses ${r.bot1Move}! ${sk1.emoji}`)
      addLog(`  "${sk1.description}" (-${sk1.energyCost} ⚡)`)
      await delay(1200)

      setBot1Anim('attack-right')
      await delay(300)
      setShowEffect(getAttackEffect(r.bot1Move, 'bot2'))
      await delay(800)

      if (r.bot1Dmg > 0) {
        setBot1Anim('idle')
        setBot2Anim('hit')
        setShowBot2Dmg(true)
        if (r.bot1Dmg >= 15 || r.bot1Counter) {
          setScreenShake(true); setScreenFlash(true)
          setTimeout(() => setScreenFlash(false), 200 / speed)
          setTimeout(() => setScreenShake(false), 400 / speed)
        }
        if (r.bot1Counter) {
          setCounterBanner(true)
          addLog('  ⚡ COUNTER!')
          setTimeout(() => setCounterBanner(false), 1400 / speed)
        }
        addLog(`  → ${r.bot1Dmg} damage to ${BOT2.name}`)
        await delay(1000)
        setBot2Anim('idle')
        setShowBot2Dmg(false)
      } else {
        setBot1Anim('idle')
        if (r.bot1Dmg === 0 && r.bot2Effect?.includes('blocked')) addLog(`  → Attack BLOCKED!`)
      }
      if (r.bot2Effect) addLog(`  ${r.bot2Effect}`)
      setShowEffect(null)
      setAnnouncement(null)
    } // end non-sleeping bot1
    setBot2Hp(r.bot2HpAfter)
    await delay(600)

    // BOT2 ATTACKS (if alive)
    if (r.bot2HpAfter > 0 && !cancelRef.current) {
      const sk2 = getSkill(r.bot2Move)
      setAnnouncement({ text: `${sk2.emoji} ${r.bot2Move.toUpperCase()}`, color: TYPE_COLORS[r.bot2Type] })
      addLog(`${BOT2.name} uses ${r.bot2Move}! ${sk2.emoji}`)
      addLog(`  "${sk2.description}" (-${sk2.energyCost} ⚡)`)
      await delay(1200)

      setBot2Anim('attack-left')
      await delay(300)
      setShowEffect(getAttackEffect(r.bot2Move, 'bot1'))
      await delay(800)

      if (r.bot2Dmg > 0) {
        setBot2Anim('idle')
        setBot1Anim('hit')
        setShowBot1Dmg(true)
        if (r.bot2Dmg >= 15 || r.bot2Counter) {
          setScreenShake(true)
          setTimeout(() => setScreenShake(false), 400 / speed)
        }
        if (r.bot2Counter) {
          setCounterBanner(true)
          addLog('  🛡️ COUNTER!')
          setTimeout(() => setCounterBanner(false), 1400 / speed)
        }
        addLog(`  → ${r.bot2Dmg} damage to ${BOT1.name}`)
        await delay(1000)
        setBot1Anim('idle')
        setShowBot1Dmg(false)
      } else {
        setBot2Anim('idle')
        if (r.bot2Dmg === 0 && r.bot1Effect?.includes('blocked')) addLog(`  → Attack BLOCKED!`)
      }
      if (r.bot1Effect) addLog(`  ${r.bot1Effect}`)
      setShowEffect(null)
      setAnnouncement(null)
    }

    setBot1Hp(r.bot1HpAfter)
    setBot1Energy(r.bot1Energy)
    setBot2Energy(r.bot2Energy)
    await delay(1000)
    setSlowMo(false)

    if (r.isKO) {
      setBot2Anim('dead')
      await delay(600)
      setScreenFlash(true)
      await delay(300)
      setScreenFlash(false)
      setBot1Anim('taunt')
      addLog(`💀 ${BOT2.name} is down!`)
      await delay(1500)
      setBot1Anim('dance')
      await delay(2000)
      setBot1Anim('idle')
      setPhase('result')
      addLog(`🏆 ${BOT1.name} WINS!`)
    }
  }, [delay, addLog, speed])

  const startDemo = useCallback(async () => {
    cancelRef.current = false
    setBot1Hp(BOT1.maxHp); setBot2Hp(BOT2.maxHp)
    setBot1Energy(100); setBot2Energy(100)
    setBot1Anim('idle'); setBot2Anim('idle')
    setActionLog([]); setCurrentRound(-1); setPhase('idle'); setPlaying(true)
    
    // Tag team mode initialization
    if (tagTeamMode) {
      setFocusPoints(3)
      setLastFocusRegen(0)
      // Generate initial suggestion for Round 1
      const initialSuggestion = generateBotSuggestion(1, BOT2.maxHp, 100)
      setBotSuggestion(initialSuggestion)
      setDecisionTimer(20)
      setChatMessages([{
        id: '1',
        role: 'bot',
        content: 'Tag Team mode active! I\'ll provide strategic suggestions each round. Here\'s my opening move recommendation.',
        timestamp: Date.now(),
      }])
    }

    await new Promise(r => setTimeout(r, 400))
    addLog('⚔️ MATCH START')
    setBot1Anim('taunt')
    await new Promise(r => setTimeout(r, 1200 / speed))
    setBot2Anim('taunt')
    await new Promise(r => setTimeout(r, 1200 / speed))
    setBot1Anim('idle'); setBot2Anim('idle')
    await new Promise(r => setTimeout(r, 500 / speed))

    for (let i = 0; i < ROUNDS.length; i++) {
      if (cancelRef.current) break
      setCurrentRound(i)
      await playRound(i)
      if (ROUNDS[i].isKO) break
    }
    setPlaying(false)
  }, [playRound, speed, addLog])

  const skipToEnd = useCallback(() => {
    cancelRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    const last = ROUNDS[ROUNDS.length - 1]
    setBot1Hp(last.bot1HpAfter); setBot2Hp(last.bot2HpAfter)
    setBot1Energy(last.bot1Energy); setBot2Energy(last.bot2Energy)
    setBot1Anim('idle'); setBot2Anim('dead')
    setCurrentRound(ROUNDS.length - 1)
    setPhase('result'); setPlaying(false)
    setShowEffect(null); setAnnouncement(null)
    addLog(`🏆 ${BOT1.name} WINS!`)
  }, [addLog])

  const curRound = currentRound >= 0 ? ROUNDS[currentRound] : null

  return (
    <div className="min-h-screen bg-[#050510] relative overflow-hidden">
      <Navbar />

      {/* Controls */}
      <div className="sticky top-12 z-50 bg-[#0a0a1aee] border-b border-gray-800 px-3 sm:px-4 py-2 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button onClick={playing ? () => {} : startDemo} disabled={playing && phase !== 'result'}
            className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold px-3 sm:px-4 py-2 rounded transition"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            <Play className="w-3.5 h-3.5" /> {phase === 'result' ? 'REPLAY' : 'PLAY DEMO'}
          </button>
          <button
            onClick={() => setTagTeamMode(!tagTeamMode)}
            className={`flex items-center gap-1.5 ${tagTeamMode ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-700 hover:bg-gray-600'} text-white text-xs font-bold px-3 sm:px-4 py-2 rounded transition`}
            style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            <Zap className="w-3.5 h-3.5" /> TAG TEAM {tagTeamMode ? 'ON' : 'OFF'}
          </button>
          {playing && phase !== 'result' && (
            <button onClick={skipToEnd} className="flex items-center gap-1 text-gray-400 hover:text-white text-xs px-2 sm:px-3 py-2 border border-gray-700 rounded transition">
              <SkipForward className="w-3 h-3" /> SKIP
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setArenaIdx(p => (p - 1 + ARENAS.length) % ARENAS.length)} className="text-gray-500 hover:text-white p-1"><ChevronLeft className="w-3.5 h-3.5" /></button>
          <span className="text-[10px] font-mono text-gray-400 min-w-[70px] text-center">{arena.name}</span>
          <button onClick={() => setArenaIdx(p => (p + 1) % ARENAS.length)} className="text-gray-500 hover:text-white p-1"><ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
            <button onClick={() => setSpeed(1)} className={`px-2 py-1 rounded ${speed === 1 ? 'bg-cyan-800 text-cyan-300' : 'hover:text-white'}`}>1x</button>
            <button onClick={() => setSpeed(2)} className={`px-2 py-1 rounded ${speed === 2 ? 'bg-cyan-800 text-cyan-300' : 'hover:text-white'}`}>2x</button>
          </div>
          <div className="text-xs font-mono text-gray-500 hidden sm:block">{currentRound >= 0 ? `R${currentRound+1}/7` : 'READY'}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className={tagTeamMode ? 'grid grid-cols-12 gap-4 px-4' : ''}>
        {/* Arena Container */}
        <div className={tagTeamMode ? 'col-span-9' : ''}>

      {/* Arena */}
      <div className={`relative w-full aspect-[16/9] max-h-[70vh] overflow-hidden ${screenShake ? 'animate-screen-shake-slow' : ''}`}>
        <div className="absolute inset-0" style={{ background: arena.bg }}>
          <div className="absolute bottom-0 left-0 right-0 h-[55%]" style={{ perspective: '400px' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${arena.grid} 1px, transparent 1px), linear-gradient(90deg, ${arena.grid} 1px, transparent 1px)`, backgroundSize: '40px 40px', transform: 'rotateX(60deg)', transformOrigin: 'bottom' }} />
          </div>
          <div className="absolute inset-0" style={{ background: arena.glow }} />
          {[...Array(18)].map((_,i) => (
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
            <div className={`font-black animate-announce-in-slow ${announcement.text.startsWith('ROUND') ? 'text-5xl sm:text-7xl' : 'text-3xl sm:text-5xl'}`}
              style={{ fontFamily: 'Orbitron, sans-serif', color: announcement.color, textShadow: `0 0 30px ${announcement.color}66, 0 4px 12px rgba(0,0,0,0.9)` }}>
              {announcement.text}
            </div>
          </div>
        )}

        <div className="absolute z-20" style={{ bottom: `${100-BOT1_POS.y-15}%`, left: `${BOT1_POS.x-7}%` }}>
          <BotSprite side="player" color={BOT1.color} anim={bot1Anim} />
        </div>
        <div className="absolute z-20" style={{ top: `${BOT2_POS.y-8}%`, right: `${100-BOT2_POS.x-7}%` }}>
          <BotSprite side="opponent" color={BOT2.color} anim={bot2Anim} />
        </div>

        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30">
          <HPPanel name={BOT2.name} level={BOT2.level} hp={bot2Hp} maxHp={BOT2.maxHp} energy={bot2Energy} maxEnergy={100} side="opponent" showDmg={showBot2Dmg} dmgAmount={curRound?.bot1Dmg ?? 0} isCounter={curRound?.bot1Counter ?? false} botType={BOT2.type} />
        </div>
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-30">
          <HPPanel name={BOT1.name} level={BOT1.level} hp={bot1Hp} maxHp={BOT1.maxHp} energy={bot1Energy} maxEnergy={100} side="player" showDmg={showBot1Dmg} dmgAmount={curRound?.bot2Dmg ?? 0} isCounter={curRound?.bot2Counter ?? false} botType={BOT1.type} />
        </div>

        {phase === 'result' && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 animate-fade-in">
            <div className="text-center animate-victory-pop">
              <div className="text-6xl sm:text-8xl font-black mb-4" style={{ fontFamily: 'Orbitron, sans-serif', color: '#00f0ff', textShadow: '0 0 50px #00f0ff88, 0 0 100px #00f0ff44' }}>VICTORY</div>
              <div className="text-lg sm:text-xl text-gray-300 font-mono">{BOT1.name} wins in {currentRound + 1} rounds</div>
              <div className="mt-5 flex gap-8 justify-center text-base sm:text-lg font-mono font-bold">
                <div className="text-green-400">+32 ELO ↑</div>
                <div className="text-amber-400">+180 CR</div>
              </div>
            </div>
          </div>
        )}
      </div>

        </div>
        {/* Close Arena Container */}

        {/* Tag Team Sidebar */}
        {tagTeamMode && (
          <div className="col-span-3 space-y-4 bg-red-500/20 border-2 border-red-500">
            {/* DEBUG: If you see this red border, tagTeamMode is ON */}
            <div className="text-white text-xs p-2 bg-green-500">DEBUG: Tag Team Sidebar Rendering!</div>
            <FocusPointTracker
              current={focusPoints}
              max={maxFocusPoints}
              roundsUntilRegen={currentRound >= 0 ? (3 - (currentRound % 3)) : 3}
            />
            <BotSuggestionPanel
              suggestion={botSuggestion}
              timeRemaining={decisionTimer}
              focusPoints={focusPoints}
              onAccept={() => {
                if (botSuggestion) {
                  addLog(`✅ Accepted: ${botSuggestion.skillName}`)
                  setBotSuggestion(null)
                }
              }}
              onOverride={() => {
                if (botSuggestion && focusPoints > 0) {
                  setFocusPoints(prev => prev - 1)
                  addLog(`⚠️ Override! -1 Focus Point`)
                  setBotSuggestion(null)
                }
              }}
              onDiscuss={() => {
                if (botSuggestion) {
                  setChatMessages(prev => [
                    ...prev,
                    {
                      id: `user_${Date.now()}`,
                      role: 'user',
                      content: `Why ${botSuggestion.skillName}?`,
                      timestamp: Date.now(),
                    },
                    {
                      id: `bot_${Date.now() + 1}`,
                      role: 'bot',
                      content: `${botSuggestion.reasoning[0]}. Confidence: ${botSuggestion.confidence}%`,
                      timestamp: Date.now() + 100,
                    },
                  ])
                }
              }}
              disabled={!playing || phase === 'result'}
            />
            <CoachingChat
              messages={chatMessages}
              onSendMessage={(msg) => {
                setChatMessages(prev => [
                  ...prev,
                  {
                    id: `user_${Date.now()}`,
                    role: 'user',
                    content: msg,
                    timestamp: Date.now(),
                  },
                  {
                    id: `bot_${Date.now() + 1}`,
                    role: 'bot',
                    content: 'Good question! Focus on maintaining energy while dealing consistent damage.',
                    timestamp: Date.now() + 500,
                  },
                ])
              }}
              disabled={phase === 'result'}
            />
          </div>
        )}
      </div>

      {/* Log */}
      <div className="bg-[#0a0a1a] border-t border-gray-800 px-4 py-2">
        <div ref={logRef} className="max-h-28 overflow-y-auto scrollbar-thin">
          {actionLog.length === 0 ? (
            <div className="text-gray-600 text-xs font-mono text-center py-3">{'// press PLAY DEMO to start'}</div>
          ) : actionLog.map((log, i) => (
            <div key={i} className="text-[11px] font-mono text-gray-400 py-0.5 leading-relaxed">
              {log.includes('COUNTER') ? <span className="text-amber-400 font-bold">{log}</span> :
               log.includes('WINS') ? <span className="text-cyan-400 font-bold">{log}</span> :
               log.includes('damage') ? <span className="text-red-400">{log}</span> :
               log.includes('is down') ? <span className="text-red-500 font-bold">{log}</span> :
               log.startsWith('══') ? <span className="text-gray-500 font-bold">{log}</span> :
               log.includes('MATCH START') ? <span className="text-cyan-300 font-bold">{log}</span> :
               log.startsWith('  "') ? <span className="text-gray-500 italic">{log}</span> :
               log.includes('blocked') || log.includes('BLOCKED') ? <span className="text-cyan-400">{log}</span> :
               log.includes('Healed') || log.includes('💚') ? <span className="text-green-400">{log}</span> :
               log.includes('Asleep') || log.includes('💤') || log.includes('Sleeping') ? <span className="text-purple-400">{log}</span> :
               log.includes('drained') || log.includes('🔋') ? <span className="text-yellow-400">{log}</span> :
               log.includes('Reflected') || log.includes('🪞') ? <span className="text-cyan-300">{log}</span> :
               log.includes('Virus') || log.includes('🦠') ? <span className="text-green-500">{log}</span> :
               log.includes('Self-damage') || log.includes('😤') ? <span className="text-orange-400">{log}</span> :
               log.includes('⏫') || log.includes('+50%') ? <span className="text-amber-300">{log}</span> :
               log.includes('LOGIC') || log.includes('BRUTE') || log.includes('SHIELD') || log.includes('CHAOS') ? <span className="text-cyan-400 font-bold">{log}</span> :
               log}
            </div>
          ))}
        </div>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes idle-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .animate-idle-bob { animation: idle-bob 2.8s ease-in-out infinite; }

        @keyframes taunt { 0% { transform: translateY(0) rotate(0); } 15% { transform: translateY(-14px) rotate(-4deg); } 30% { transform: translateY(0) rotate(4deg); } 50% { transform: translateY(-10px) scale(1.06); } 75% { transform: translateY(2px) scale(1); } 100% { transform: translateY(0); } }
        .animate-taunt { animation: taunt 1.2s ease-out; }

        @keyframes dance { 0% { transform: translateY(0) rotate(0); } 12% { transform: translateY(-12px) rotate(-6deg); } 25% { transform: translateY(3px) rotate(6deg); } 37% { transform: translateY(-14px) rotate(-4deg) scaleX(-1); } 50% { transform: translateY(0) scaleX(-1); } 62% { transform: translateY(-12px) rotate(6deg); } 75% { transform: translateY(3px) rotate(-6deg); } 87% { transform: translateY(-10px) scale(1.08); } 100% { transform: translateY(0); } }
        .animate-dance { animation: dance 2s ease-in-out; }

        @keyframes lunge-right-slow { 0% { transform: translateX(0); } 35% { transform: translateX(50px) translateY(-15px); } 100% { transform: translateX(0); } }
        .animate-lunge-right-slow { animation: lunge-right-slow 0.6s ease-out; }

        @keyframes lunge-left-slow { 0% { transform: translateX(0); } 35% { transform: translateX(-50px) translateY(15px); } 100% { transform: translateX(0); } }
        .animate-lunge-left-slow { animation: lunge-left-slow 0.6s ease-out; }

        @keyframes bot-hit-slow { 0% { transform: translateX(0); } 12% { transform: translateX(-10px); filter: brightness(4) saturate(0); } 25% { transform: translateX(8px); filter: brightness(1); } 40% { transform: translateX(-6px); filter: brightness(3) saturate(0); } 55% { transform: translateX(4px); } 70% { transform: translateX(-2px); filter: brightness(2); } 100% { transform: translateX(0); filter: brightness(1); } }
        .animate-bot-hit-slow { animation: bot-hit-slow 0.8s ease-out; }

        @keyframes screen-shake-slow { 0%,100% { transform: translate(0); } 8% { transform: translate(-6px,3px); } 16% { transform: translate(6px,-3px); } 24% { transform: translate(-5px,-2px); } 32% { transform: translate(5px,2px); } 40% { transform: translate(-3px,3px); } }
        .animate-screen-shake-slow { animation: screen-shake-slow 0.45s ease-out; }

        @keyframes flash-slow { 0% { opacity: 0.6; } 100% { opacity: 0; } }
        .animate-flash-slow { animation: flash-slow 0.2s ease-out forwards; }

        @keyframes dmg-float-slow { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 15% { transform: translateY(-10px) scale(1.2); opacity: 1; } 30% { transform: translateY(-18px) scale(1); } 100% { transform: translateY(-50px); opacity: 0; } }
        .animate-dmg-float-slow { animation: dmg-float-slow 1.8s ease-out forwards; }

        @keyframes announce-in-slow { 0% { transform: scale(2.5); opacity: 0; } 15% { transform: scale(0.95); opacity: 1; } 20% { transform: scale(1); } 75% { opacity: 1; } 100% { transform: scale(0.9); opacity: 0; } }
        .animate-announce-in-slow { animation: announce-in-slow 1.4s ease-out forwards; }

        @keyframes banner-slam-slow { 0% { transform: scale(4) rotate(-8deg); opacity: 0; } 12% { transform: scale(1) rotate(2deg); opacity: 1; } 18% { transform: scale(1.05); } 65% { opacity: 1; } 100% { transform: scale(1.15); opacity: 0; } }
        .animate-banner-slam-slow { animation: banner-slam-slow 1.5s ease-out forwards; }

        @keyframes victory-pop { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.15); } 70% { transform: scale(0.95); } 100% { transform: scale(1); opacity: 1; } }
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

        @keyframes lightning-branch-slow { 0% { opacity: 0; transform: scale(0.3); } 25% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.3); } }
        .animate-lightning-branch-slow { animation: lightning-branch-slow 0.7s ease-out forwards; }

        @keyframes electrocute-slow { 0%,15%,30%,45%,60%,75% { opacity: 0.7; } 8%,23%,38%,53%,68% { opacity: 0; } 100% { opacity: 0; } }
        .animate-electrocute-slow { animation: electrocute-slow 1s ease-out forwards; }

        @keyframes shield-appear-slow { 0% { transform: translate(-50%,-50%) scale(0); opacity: 0; } 35% { transform: translate(-50%,-50%) scale(1.15); opacity: 1; } 50% { transform: translate(-50%,-50%) scale(0.95); } 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.9; } }
        .animate-shield-appear-slow { animation: shield-appear-slow 0.8s ease-out forwards; }

        @keyframes shield-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        .animate-shield-pulse { animation: shield-pulse 1.2s ease-in-out infinite; }

        @keyframes hex-pop-slow { 0% { opacity: 0; transform: scale(0); } 100% { opacity: 1; transform: scale(1); } }
        .animate-hex-pop-slow { animation: hex-pop-slow 0.4s ease-out forwards; }

        @keyframes ghost-rush-slow { 0% { transform: translate(0,0); opacity: 0.8; } 60% { opacity: 0.5; } 100% { transform: translate(var(--rush-dx),var(--rush-dy)); opacity: 0; } }
        .animate-ghost-rush-slow { animation: ghost-rush-slow 0.8s ease-in forwards; }

        @keyframes impact-flash { 0% { transform: translate(-50%,-50%) scale(0); opacity: 0.8; } 100% { transform: translate(-50%,-50%) scale(2); opacity: 0; } }
        .animate-impact-flash { animation: impact-flash 0.5s ease-out forwards; }

        @keyframes code-rain-slow { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(100px); opacity: 0; } }
        .animate-code-rain-slow { animation: code-rain-slow 1s ease-in forwards; }

        @keyframes glitch-tear { 0%,100% { opacity: 0; } 15%,85% { opacity: 1; } 25% { transform: translateX(-4px); } 45% { transform: translateX(4px); } 65% { transform: translateX(-2px); } }
        .animate-glitch-tear { animation: glitch-tear 0.9s linear forwards; }

        @keyframes scan-sweep-slow { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(140px); opacity: 0; } }
        .animate-scan-sweep-slow { animation: scan-sweep-slow 1.4s ease-in-out forwards; }

        @keyframes scan-frame { 0% { opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
        .animate-scan-frame { animation: scan-frame 2s ease-out forwards; }

        @keyframes stats-reveal-slow { 0% { opacity: 0; transform: translateX(-15px); } 25% { opacity: 1; transform: translateX(0); } 75% { opacity: 1; } 100% { opacity: 0; } }
        .animate-stats-reveal-slow { animation: stats-reveal-slow 2.2s ease-out forwards; }

        @keyframes memory-particle-slow { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(calc(cos(var(--p-angle)) * var(--p-dist)), calc(sin(var(--p-angle)) * var(--p-dist))) scale(0); opacity: 0; } }
        .animate-memory-particle-slow { animation: memory-particle-slow 0.9s ease-out forwards; }

        @keyframes burst-ring-slow { 0% { width: 0; height: 0; opacity: 1; } 100% { width: 100px; height: 100px; opacity: 0; } }
        .animate-burst-ring-slow { animation: burst-ring-slow 0.7s ease-out forwards; }

        @keyframes bomb-tick-slow { 0%,40% { transform: translate(-50%,-50%) scale(1); } 20% { transform: translate(-50%,-50%) scale(1.3); } 60% { transform: translate(-50%,-50%) scale(0.9); } 80% { transform: translate(-50%,-50%) scale(1.4); } 100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; } }
        .animate-bomb-tick-slow { animation: bomb-tick-slow 1.2s ease-in-out forwards; }

        @keyframes explosion-ring-slow { 0% { width: 4px; height: 4px; opacity: 1; } 100% { width: 140px; height: 140px; opacity: 0; } }
        .animate-explosion-ring-slow { animation: explosion-ring-slow 0.6s ease-out forwards; }

        @keyframes shockwave-particle-slow { 0% { transform: translate(0,0); opacity: 1; } 100% { transform: translate(calc(cos(var(--sw-angle)) * var(--sw-dist)), calc(sin(var(--sw-angle)) * var(--sw-dist))); opacity: 0; } }
        .animate-shockwave-particle-slow { animation: shockwave-particle-slow 0.6s ease-out forwards; }

        @keyframes inject-text-slow { 0% { opacity: 0; transform: translateX(-25px) skewX(-5deg); } 15% { opacity: 1; transform: translateX(0); } 55% { opacity: 1; } 100% { opacity: 0; transform: translateX(15px) skewX(3deg); } }
        .animate-inject-text-slow { animation: inject-text-slow 0.9s ease-out forwards; }

        @keyframes screen-tear-slow { 0%,100% { opacity: 0; transform: scaleX(0); } 15%,85% { opacity: 1; transform: scaleX(1); } }
        .animate-screen-tear-slow { animation: screen-tear-slow 0.6s ease-out forwards; }

        @keyframes rewind-spin-slow { 0% { transform: translate(-50%,-50%) rotate(0deg) scale(0); opacity: 0; } 25% { transform: translate(-50%,-50%) rotate(-180deg) scale(1.1); opacity: 1; } 100% { transform: translate(-50%,-50%) rotate(-900deg) scale(0.4); opacity: 0; } }
        .animate-rewind-spin-slow { animation: rewind-spin-slow 1.5s ease-out forwards; }

        @keyframes heal-float-slow { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(-40px); opacity: 0; } }
        .animate-heal-float-slow { animation: heal-float-slow 1.2s ease-out forwards; }

        @keyframes virus-spread-slow { 0% { transform: translate(0,0) scale(0); opacity: 1; } 100% { transform: translate(calc(cos(var(--virus-angle)) * var(--virus-dist)), calc(sin(var(--virus-angle)) * var(--virus-dist))) scale(1); opacity: 0.3; } }
        .animate-virus-spread-slow { animation: virus-spread-slow 1.2s ease-out forwards; }

        @keyframes virus-cloud-slow { 0% { opacity: 0.6; transform: translate(-50%,-50%) scale(0.5); } 50% { opacity: 0.8; } 100% { opacity: 0; transform: translate(-50%,-50%) scale(2); } }
        .animate-virus-cloud-slow { animation: virus-cloud-slow 1.5s ease-out forwards; }

        @keyframes mirror-shine-slow { 0% { opacity: 0; transform: translate(-50%,-50%) scale(0.8); } 30% { opacity: 1; transform: translate(-50%,-50%) scale(1); } 100% { opacity: 0; transform: translate(-50%,-50%) scale(1.1); } }
        .animate-mirror-shine-slow { animation: mirror-shine-slow 1.2s ease-out forwards; }

        @keyframes shine-streak { 0% { opacity: 0; } 40% { opacity: 0.6; } 100% { opacity: 0; } }
        .animate-shine-streak { animation: shine-streak 0.8s ease-out forwards; }

        @keyframes emp-ring-slow { 0% { width: 0; height: 0; opacity: 1; } 100% { width: 120px; height: 120px; opacity: 0; } }
        .animate-emp-ring-slow { animation: emp-ring-slow 0.8s ease-out forwards; }

        @keyframes emp-bolt-slow { 0% { opacity: 1; transform: rotate(var(--bolt-angle)) translateX(0); } 100% { opacity: 0; transform: rotate(var(--bolt-angle)) translateX(var(--bolt-dist)); } }
        .animate-emp-bolt-slow { animation: emp-bolt-slow 0.6s ease-out forwards; }

        @keyframes sleep-cloud-slow { 0% { opacity: 0; transform: translate(-50%,-50%) scale(0.5); } 50% { opacity: 0.8; transform: translate(-50%,-50%) scale(1.2); } 100% { opacity: 0; transform: translate(-50%,-50%) scale(1.5); } }
        .animate-sleep-cloud-slow { animation: sleep-cloud-slow 1.5s ease-out forwards; }

        @keyframes sleep-z-float-slow { 0% { opacity: 0; transform: translateY(0); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateY(-60px); } }
        .animate-sleep-z-float-slow { animation: sleep-z-float-slow 1.5s ease-out forwards; }

        @keyframes overclock-glow-slow { 0% { opacity: 0; } 30% { opacity: 1; } 100% { opacity: 0; } }
        .animate-overclock-glow-slow { animation: overclock-glow-slow 1.2s ease-out forwards; }

        @keyframes speed-line-slow { 0% { opacity: 0; transform-origin: left; transform: scaleX(0); } 40% { opacity: 1; transform: scaleX(1); } 100% { opacity: 0; transform: scaleX(1); } }
        .animate-speed-line-slow { animation: speed-line-slow 0.6s ease-out forwards; }

        @keyframes spark-fast-slow { 0% { opacity: 1; transform: translate(0,0); } 100% { opacity: 0; transform: translate(calc(cos(var(--spark-angle)) * 40px), calc(sin(var(--spark-angle)) * 40px)); } }
        .animate-spark-fast-slow { animation: spark-fast-slow 0.4s ease-out forwards; }

        @keyframes berserker-charge-slow { 0% { opacity: 0.8; transform: translate(0,0); } 60% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--charge-dx), var(--charge-dy)); } }
        .animate-berserker-charge-slow { animation: berserker-charge-slow 0.7s ease-in forwards; }

        @keyframes rage-particle-slow { 0% { opacity: 1; transform: translate(0,0) scale(1); } 100% { opacity: 0; transform: translate(calc(cos(var(--rage-angle)) * 50px), calc(sin(var(--rage-angle)) * 50px)) scale(0); } }
        .animate-rage-particle-slow { animation: rage-particle-slow 0.6s ease-out forwards; }

        @keyframes impact-shockwave-slow { 0% { width: 0; height: 0; opacity: 1; } 100% { width: 140px; height: 140px; opacity: 0; } }
        .animate-impact-shockwave-slow { animation: impact-shockwave-slow 0.6s ease-out forwards; }

        @keyframes agent-swarm-slow { 
          0% { opacity: 0; transform: translate(0, 0) scale(0); } 
          15% { opacity: 1; transform: translate(0, 0) scale(1); }
          70% { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--swarm-dx), var(--swarm-dy)) scale(0.5); } 
        }
        .animate-agent-swarm-slow { animation: agent-swarm-slow 1s ease-in forwards; }

        @keyframes task-bubble-slow { 
          0% { opacity: 0; transform: translateY(0); } 
          30% { opacity: 1; transform: translateY(-8px); }
          70% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-16px); } 
        }
        .animate-task-bubble-slow { animation: task-bubble-slow 0.8s ease-out forwards; }

        @keyframes system-overload-slow { 
          0% { opacity: 0; transform: translate(-50%,-50%) scale(0.5); } 
          40% { opacity: 1; transform: translate(-50%,-50%) scale(1.2); }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(1.5); } 
        }
        .animate-system-overload-slow { animation: system-overload-slow 1s ease-out forwards; }

        @keyframes glitch-line-slow { 
          0%, 100% { opacity: 0; transform: translateX(-20px); } 
          30%, 70% { opacity: 0.8; transform: translateX(0); }
          50% { transform: translateX(10px); }
        }
        .animate-glitch-line-slow { animation: glitch-line-slow 0.4s ease-out forwards; }

        @keyframes warning-flash-slow { 
          0%, 100% { opacity: 0; } 
          20%, 40%, 60%, 80% { opacity: 1; }
          30%, 50%, 70% { opacity: 0.3; }
        }
        .animate-warning-flash-slow { animation: warning-flash-slow 1s ease-out forwards; }

        @keyframes overload-particle-slow { 
          0% { opacity: 1; transform: translate(0, 0) scale(1); } 
          100% { 
            opacity: 0; 
            transform: translate(
              calc(cos(var(--particle-angle)) * var(--particle-dist)), 
              calc(sin(var(--particle-angle)) * var(--particle-dist))
            ) scale(0); 
          } 
        }
        .animate-overload-particle-slow { animation: overload-particle-slow 0.7s ease-out forwards; }

        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
    </div>
  )
}
// Force rebuild Wed Feb 11 09:10:01 PM CET 2026
