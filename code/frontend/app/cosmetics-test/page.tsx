'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { ShellTopper, ClawSkin, VisorEffect, AuraEffect, getSkinColors } from '../match-v2/cosmetics-preview'

// ============================================================
// Cosmetics Test Page — Preview items on Mech-Crab
// ============================================================

const SKINS = ['Default', 'Neon Blue', 'Crimson Fury', 'Shadow Ops', 'Gold Plated', 'Prismatic']
const TOPPERS = ['none', 'crown', 'spike-mohawk', 'satellite']
const CLAWS = ['none', 'flame', 'crystal', 'gold']
const VISORS = ['none', 'rainbow', 'laser']
const AURAS = ['none', 'flames', 'electric', 'particles']

const RARITY_COLORS: Record<string, string> = {
  'Default': '#888',
  'Neon Blue': '#4488ff',
  'Crimson Fury': '#ff3030',
  'Shadow Ops': '#666',
  'Gold Plated': '#ffcc00',
  'Prismatic': '#cc44ff',
}

function MechCrabPreview({ skin, topper, clawSkin, visor, aura, rotate }: {
  skin: string; topper: string; clawSkin: string; visor: string; aura: string; rotate: boolean
}) {
  const skinColors = getSkinColors(skin)
  const bodyDark = skinColors?.dark ?? '#1a0808'
  const bodyMid = skinColors?.mid ?? '#3a1010'
  const bodyBright = skinColors?.bright ?? '#6a1a1a'
  const plateColor = skinColors?.plate ?? '#8a2525'
  const accent = skinColors?.accent ?? '#ff4040'

  const isPrismatic = skin === 'Prismatic'

  return (
    <div className={`relative ${rotate ? 'animate-slow-rotate' : ''}`}>
      <svg viewBox="-10 -5 160 145" className="w-full h-full max-w-[400px] mx-auto drop-shadow-2xl">
        <defs>
          <filter id="glow-preview"><feGaussianBlur stdDeviation="3" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id="shell-grad-preview" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bodyBright} /><stop offset="50%" stopColor={bodyMid} /><stop offset="100%" stopColor={bodyDark} />
          </linearGradient>
          {isPrismatic && (
            <linearGradient id="prismatic-shift" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff00ff"><animate attributeName="stop-color" values="#ff00ff;#00ffff;#ffff00;#ff00ff" dur="3s" repeatCount="indefinite" /></stop>
              <stop offset="50%" stopColor="#00ffff"><animate attributeName="stop-color" values="#00ffff;#ffff00;#ff00ff;#00ffff" dur="3s" repeatCount="indefinite" /></stop>
              <stop offset="100%" stopColor="#ffff00"><animate attributeName="stop-color" values="#ffff00;#ff00ff;#00ffff;#ffff00" dur="3s" repeatCount="indefinite" /></stop>
            </linearGradient>
          )}
        </defs>

        {/* Aura (behind bot) */}
        {aura !== 'none' && <AuraEffect type={aura} color={accent} />}

        {/* Shadow */}
        <ellipse cx="70" cy="130" rx="50" ry="6" fill={accent} opacity="0.1" />

        {/* Legs */}
        {[
          [30,80,8,105,5,120], [28,75,3,95,2,112], [32,85,12,115,10,126],
          [110,80,132,105,135,120], [112,75,137,95,138,112], [108,85,128,115,130,126]
        ].map(([x1,y1,x2,y2,x3,y3], i) => (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={bodyMid} strokeWidth="4.5" strokeLinecap="round" />
            <line x1={x2} y1={y2} x2={x3} y2={y3} stroke={bodyMid} strokeWidth="3.5" strokeLinecap="round" />
            <circle cx={x3} cy={y3} r="2.5" fill={accent} opacity="0.6" />
            <circle cx={x2 as number} cy={y2 as number} r="3.5" fill={accent} opacity="0.4" />
          </g>
        ))}

        {/* Shell */}
        <ellipse cx="70" cy="60" rx="48" ry="38" fill={isPrismatic ? 'url(#prismatic-shift)' : 'url(#shell-grad-preview)'} stroke={bodyBright} strokeWidth="2" />
        <ellipse cx="70" cy="52" rx="40" ry="11" fill="none" stroke={plateColor} strokeWidth="1.5" opacity="0.5" />
        <ellipse cx="70" cy="63" rx="42" ry="9" fill="none" stroke={plateColor} strokeWidth="1" opacity="0.35" />
        <line x1="70" y1="25" x2="70" y2="88" stroke={plateColor} strokeWidth="2" opacity="0.4" />
        <path d="M38,40 Q70,28 102,40" fill="none" stroke={bodyBright} strokeWidth="1.5" opacity="0.6" />

        {/* Shell topper */}
        {topper !== 'none' && <ShellTopper type={topper} color={accent} />}

        {/* Visor */}
        <rect x="43" y="42" width="54" height="12" rx="6" fill={bodyDark} stroke={accent} strokeWidth="1.2" />
        {visor !== 'none' ? (
          <VisorEffect type={visor} />
        ) : (
          <>
            <rect x="50" y="44" width="16" height="7" rx="2.5" fill={accent} opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2.5s" repeatCount="indefinite" />
            </rect>
            <rect x="74" y="44" width="16" height="7" rx="2.5" fill={accent} opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2.5s" repeatCount="indefinite" begin="0.3s" />
            </rect>
          </>
        )}

        {/* Mandibles + core */}
        <circle cx="55" cy="70" r="4.5" fill={bodyMid} stroke={bodyBright} strokeWidth="1.2" />
        <circle cx="85" cy="70" r="4.5" fill={bodyMid} stroke={bodyBright} strokeWidth="1.2" />
        <circle cx="70" cy="74" r="6" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.5">
          <animate attributeName="r" values="6;7;6" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="70" cy="74" r="3" fill={accent} opacity="0.5" />

        {/* Claws */}
        <path d="M26,58 L8,44 L0,28" stroke={bodyMid} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M0,28 L-10,16" stroke={plateColor} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M0,28 L8,14" stroke={plateColor} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <circle cx="0" cy="28" r="4" fill={bodyDark} stroke={accent} strokeWidth="1.2" />
        {clawSkin !== 'none' && <ClawSkin side="left" type={clawSkin} />}

        <path d="M114,58 L132,44 L140,28" stroke={bodyMid} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M140,28 L150,16" stroke={plateColor} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M140,28 L132,14" stroke={plateColor} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <circle cx="140" cy="28" r="4" fill={bodyDark} stroke={accent} strokeWidth="1.2" />
        {clawSkin !== 'none' && <ClawSkin side="right" type={clawSkin} />}

        {/* Sensors */}
        <line x1="55" y1="26" x2="50" y2="14" stroke={bodyMid} strokeWidth="2.5" />
        <circle cx="50" cy="13" r="3" fill={accent} opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <line x1="85" y1="26" x2="90" y2="14" stroke={bodyMid} strokeWidth="2.5" />
        <circle cx="90" cy="13" r="3" fill={accent} opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.2s" repeatCount="indefinite" begin="0.4s" />
        </circle>

        {/* Shell glow */}
        <ellipse cx="70" cy="60" rx="48" ry="38" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.2" filter="url(#glow-preview)" />
      </svg>
    </div>
  )
}

export default function CosmeticsTestPage() {
  const [skin, setSkin] = useState('Default')
  const [topper, setTopper] = useState('none')
  const [clawSkin, setClawSkin] = useState('none')
  const [visor, setVisor] = useState('none')
  const [aura, setAura] = useState('none')
  const [rotate, setRotate] = useState(false)

  return (
    <div className="min-h-screen bg-[#050510]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          COSMETICS PREVIEW
        </h1>
        <p className="text-gray-500 text-sm font-mono mb-6">Test shop items on the mech-crab model</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview */}
          <div className="bg-gradient-to-b from-[#0a0a2a] via-[#050515] to-[#0a0a1a] rounded-xl border border-gray-800 p-6 min-h-[400px] flex items-center justify-center relative overflow-hidden">
            {/* Grid floor */}
            <div className="absolute bottom-0 left-0 right-0 h-[40%]" style={{ perspective: '300px' }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(rgba(0,240,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.05) 1px, transparent 1px)',
                backgroundSize: '30px 30px', transform: 'rotateX(60deg)', transformOrigin: 'bottom',
              }} />
            </div>
            <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 100px rgba(0,0,0,0.6)' }} />
            <div className="relative z-10 w-full">
              <MechCrabPreview skin={skin} topper={topper} clawSkin={clawSkin} visor={visor} aura={aura} rotate={rotate} />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-5">
            {/* Skin */}
            <div>
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2 block">🎨 Skin</label>
              <div className="grid grid-cols-3 gap-2">
                {SKINS.map(s => (
                  <button key={s} onClick={() => setSkin(s)}
                    className={`text-xs font-mono px-3 py-2 rounded border transition ${skin === s ? 'border-cyan-500 bg-cyan-900/30 text-cyan-300' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: RARITY_COLORS[s] }} />
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Shell Topper */}
            <div>
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2 block">🎩 Shell Topper</label>
              <div className="flex gap-2 flex-wrap">
                {TOPPERS.map(t => (
                  <button key={t} onClick={() => setTopper(t)}
                    className={`text-xs font-mono px-3 py-2 rounded border transition capitalize ${topper === t ? 'border-amber-500 bg-amber-900/30 text-amber-300' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                    {t === 'none' ? 'None' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Claw Skin */}
            <div>
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2 block">🦀 Claw Skin</label>
              <div className="flex gap-2 flex-wrap">
                {CLAWS.map(c => (
                  <button key={c} onClick={() => setClawSkin(c)}
                    className={`text-xs font-mono px-3 py-2 rounded border transition capitalize ${clawSkin === c ? 'border-red-500 bg-red-900/30 text-red-300' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                    {c === 'none' ? 'None' : c}
                  </button>
                ))}
              </div>
            </div>

            {/* Visor */}
            <div>
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2 block">👁️ Visor Effect</label>
              <div className="flex gap-2 flex-wrap">
                {VISORS.map(v => (
                  <button key={v} onClick={() => setVisor(v)}
                    className={`text-xs font-mono px-3 py-2 rounded border transition capitalize ${visor === v ? 'border-purple-500 bg-purple-900/30 text-purple-300' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                    {v === 'none' ? 'None' : v}
                  </button>
                ))}
              </div>
            </div>

            {/* Aura */}
            <div>
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2 block">✨ Aura Effect</label>
              <div className="flex gap-2 flex-wrap">
                {AURAS.map(a => (
                  <button key={a} onClick={() => setAura(a)}
                    className={`text-xs font-mono px-3 py-2 rounded border transition capitalize ${aura === a ? 'border-green-500 bg-green-900/30 text-green-300' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                    {a === 'none' ? 'None' : a}
                  </button>
                ))}
              </div>
            </div>

            {/* Turntable */}
            <div className="pt-2">
              <button onClick={() => setRotate(!rotate)}
                className={`text-xs font-mono px-4 py-2 rounded border transition ${rotate ? 'border-cyan-500 bg-cyan-900/30 text-cyan-300' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                🔄 {rotate ? 'Stop Rotation' : 'Turntable'}
              </button>
            </div>

            {/* Equipped summary */}
            <div className="bg-[#0a0a1a] border border-gray-800 rounded-lg p-4 mt-4">
              <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-2">Equipped</div>
              <div className="space-y-1 text-xs font-mono">
                <div className="text-gray-400">Skin: <span className="text-white">{skin}</span></div>
                <div className="text-gray-400">Topper: <span className="text-white capitalize">{topper}</span></div>
                <div className="text-gray-400">Claws: <span className="text-white capitalize">{clawSkin}</span></div>
                <div className="text-gray-400">Visor: <span className="text-white capitalize">{visor}</span></div>
                <div className="text-gray-400">Aura: <span className="text-white capitalize">{aura}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slow-rotate { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(360deg); } }
        .animate-slow-rotate { animation: slow-rotate 8s linear infinite; }
        @keyframes float-gentle { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .animate-float-gentle { animation: float-gentle 2s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
