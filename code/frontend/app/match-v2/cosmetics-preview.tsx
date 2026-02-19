'use client'

import { useState } from 'react'

// ============================================================
// Cosmetic Overlay Components for Mech-Crab
// ============================================================

// Shell Toppers
export function ShellTopper({ type, color }: { type: string; color: string }) {
  switch (type) {
    case 'crown':
      return (
        <g className="animate-float-gentle">
          <polygon points="60,8 65,20 70,10 75,20 80,8" fill="#ffcc00" stroke="#cc9900" strokeWidth="1.5" />
          <circle cx="65" cy="11" r="2" fill="#ff4444" />
          <circle cx="70" cy="8" r="2.5" fill="#4488ff" />
          <circle cx="75" cy="11" r="2" fill="#44ff44" />
        </g>
      )
    case 'spike-mohawk':
      return (
        <g>
          {[55,62,70,78,85].map((x,i) => (
            <polygon key={i} points={`${x-3},25 ${x},${10-i%2*5} ${x+3},25`} fill={color} opacity={0.7+i*0.05} stroke={color} strokeWidth="0.5" />
          ))}
        </g>
      )
    case 'satellite':
      return (
        <g>
          <line x1="70" y1="18" x2="70" y2="2" stroke="#888" strokeWidth="2" />
          <ellipse cx="70" cy="2" rx="12" ry="4" fill="none" stroke={color} strokeWidth="1.5" />
          <circle cx="70" cy="2" r="2" fill={color}>
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
          </circle>
        </g>
      )
    default: return null
  }
}

// Claw Skins
export function ClawSkin({ side, type }: { side: 'left' | 'right'; type: string }) {
  const mirror = side === 'right'
  const tx = mirror ? 136 : 4

  switch (type) {
    case 'flame':
      return (
        <g>
          {[...Array(5)].map((_,i) => (
            <circle key={i} cx={tx + (mirror?-1:1)*(i*3)} cy={28-i*2} r={3-i*0.4}
              fill={i<2?'#ff4400':i<4?'#ff8800':'#ffcc00'} opacity={0.6-i*0.08}>
              <animate attributeName="cy" values={`${28-i*2};${25-i*2};${28-i*2}`} dur={`${0.4+i*0.1}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      )
    case 'crystal':
      return (
        <g>
          <polygon points={`${tx-6},18 ${tx},8 ${tx+6},18`} fill="#88ddff" opacity="0.6" stroke="#44aaff" strokeWidth="1" />
          <polygon points={`${tx-4},22 ${tx},14 ${tx+4},22`} fill="#aaeeff" opacity="0.4" />
          <line x1={tx} y1={8} x2={tx} y2={22} stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
        </g>
      )
    case 'gold':
      return (
        <g>
          <circle cx={tx} cy={28} r="5" fill="#ffcc00" stroke="#cc9900" strokeWidth="1.5" />
          <circle cx={tx} cy={28} r="2.5" fill="#ffe066" />
        </g>
      )
    default: return null
  }
}

// Eye/Visor Effects
export function VisorEffect({ type }: { type: string }) {
  switch (type) {
    case 'rainbow':
      return (
        <g>
          <rect x="50" y="44" width="16" height="6" rx="2" fill="url(#rainbow-grad)" opacity="0.9">
            <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2s" repeatCount="indefinite" />
          </rect>
          <rect x="74" y="44" width="16" height="6" rx="2" fill="url(#rainbow-grad)" opacity="0.9">
            <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2s" repeatCount="indefinite" begin="0.3s" />
          </rect>
          <defs>
            <linearGradient id="rainbow-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ff0000" />
              <stop offset="25%" stopColor="#ffaa00" />
              <stop offset="50%" stopColor="#00ff00" />
              <stop offset="75%" stopColor="#0088ff" />
              <stop offset="100%" stopColor="#cc00ff" />
            </linearGradient>
          </defs>
        </g>
      )
    case 'laser':
      return (
        <g>
          <rect x="50" y="44" width="16" height="6" rx="2" fill="#ff0000" opacity="0.9">
            <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.5s" repeatCount="indefinite" />
          </rect>
          <rect x="74" y="44" width="16" height="6" rx="2" fill="#ff0000" opacity="0.9">
            <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.5s" repeatCount="indefinite" />
          </rect>
          {/* Laser beams from eyes */}
          <line x1="58" y1="47" x2="58" y2="95" stroke="#ff0000" strokeWidth="1" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1.5s" repeatCount="indefinite" />
          </line>
          <line x1="82" y1="47" x2="82" y2="95" stroke="#ff0000" strokeWidth="1" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1.5s" repeatCount="indefinite" />
          </line>
        </g>
      )
    default: return null
  }
}

// Aura/Trail Effects
export function AuraEffect({ type, color }: { type: string; color: string }) {
  switch (type) {
    case 'flames':
      return (
        <g>
          {[...Array(8)].map((_,i) => {
            const angle = (i / 8) * Math.PI * 2
            const x = 70 + Math.cos(angle) * 50
            const y = 60 + Math.sin(angle) * 38
            return (
              <circle key={i} cx={x} cy={y} r="3" fill="#ff4400" opacity="0.4">
                <animate attributeName="r" values="3;5;3" dur={`${0.8+i*0.1}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.15;0.4" dur={`${0.8+i*0.1}s`} repeatCount="indefinite" />
              </circle>
            )
          })}
        </g>
      )
    case 'electric':
      return (
        <g>
          {[...Array(6)].map((_,i) => {
            const angle = (i / 6) * Math.PI * 2
            const x1 = 70 + Math.cos(angle) * 48
            const y1 = 60 + Math.sin(angle) * 36
            const x2 = 70 + Math.cos(angle) * 55
            const y2 = 60 + Math.sin(angle) * 42
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.5" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0;0.5" dur={`${0.3+i*0.08}s`} repeatCount="indefinite" />
              </line>
            )
          })}
        </g>
      )
    case 'particles':
      return (
        <g>
          {[...Array(10)].map((_,i) => {
            const x = 30 + Math.random() * 80
            const baseY = 30 + Math.random() * 60
            return (
              <circle key={i} cx={x} cy={baseY} r="1.5" fill={color} opacity="0.5">
                <animate attributeName="cy" values={`${baseY};${baseY-15};${baseY}`} dur={`${1.5+i*0.2}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.1;0.5" dur={`${1.5+i*0.2}s`} repeatCount="indefinite" />
              </circle>
            )
          })}
        </g>
      )
    default: return null
  }
}

// Skin color override
export function getSkinColors(skinName: string) {
  switch (skinName) {
    case 'Neon Blue': return { dark: '#0a1530', mid: '#153060', bright: '#2050a0', plate: '#3070c0', accent: '#4488ff' }
    case 'Crimson Fury': return { dark: '#200505', mid: '#501010', bright: '#802020', plate: '#a03030', accent: '#ff3030' }
    case 'Shadow Ops': return { dark: '#0a0a0a', mid: '#1a1a1a', bright: '#2a2a2a', plate: '#3a3a3a', accent: '#666666' }
    case 'Gold Plated': return { dark: '#2a1f00', mid: '#554000', bright: '#806000', plate: '#aa8020', accent: '#ffcc00' }
    case 'Prismatic': return { dark: '#1a0a2a', mid: '#2a1545', bright: '#3a2060', plate: '#5030a0', accent: '#cc44ff' } // base, shifts via animation
    default: return null
  }
}
