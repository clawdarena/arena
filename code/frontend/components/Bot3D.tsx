'use client'

// ============================================================
// Bot3D — Reusable 3D Mech-Crab Renderer
// ============================================================

interface Bot3DProps {
  skin?: string
  topper?: string
  clawSkin?: string
  visor?: string
  aura?: string
  rotate?: boolean
  size?: number
  className?: string
}

// Cosmetic Effects (extracted from cosmetics-preview.tsx)
function ShellTopper({ type, color }: { type: string; color: string }) {
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

function ClawSkin({ side, type }: { side: 'left' | 'right'; type: string }) {
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

function VisorEffect({ type }: { type: string }) {
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

function AuraEffect({ type, color }: { type: string; color: string }) {
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

function getSkinColors(skinName: string) {
  switch (skinName) {
    case 'Neon Blue': return { dark: '#0a1530', mid: '#153060', bright: '#2050a0', plate: '#3070c0', accent: '#4488ff' }
    case 'Crimson Fury': return { dark: '#200505', mid: '#501010', bright: '#802020', plate: '#a03030', accent: '#ff3030' }
    case 'Shadow Ops': return { dark: '#0a0a0a', mid: '#1a1a1a', bright: '#2a2a2a', plate: '#3a3a3a', accent: '#666666' }
    case 'Gold Plated': return { dark: '#2a1f00', mid: '#554000', bright: '#806000', plate: '#aa8020', accent: '#ffcc00' }
    case 'Prismatic': return { dark: '#1a0a2a', mid: '#2a1545', bright: '#3a2060', plate: '#5030a0', accent: '#cc44ff' }
    default: return null
  }
}

export function Bot3D({
  skin = 'Default',
  topper = 'none',
  clawSkin = 'none',
  visor = 'none',
  aura = 'none',
  rotate = false,
  size = 300,
  className = ''
}: Bot3DProps) {
  const skinColors = getSkinColors(skin)
  const bodyDark = skinColors?.dark ?? '#1a0808'
  const bodyMid = skinColors?.mid ?? '#3a1010'
  const bodyBright = skinColors?.bright ?? '#6a1a1a'
  const plateColor = skinColors?.plate ?? '#8a2525'
  const accent = skinColors?.accent ?? '#ff4040'

  const isPrismatic = skin === 'Prismatic'

  return (
    <div className={`relative ${rotate ? 'animate-slow-rotate' : ''} ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="-10 -5 160 145" className="w-full h-full drop-shadow-2xl">
        <defs>
          <filter id="glow-bot"><feGaussianBlur stdDeviation="3" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id="shell-grad-bot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bodyBright} /><stop offset="50%" stopColor={bodyMid} /><stop offset="100%" stopColor={bodyDark} />
          </linearGradient>
          {isPrismatic && (
            <linearGradient id="prismatic-shift-bot" x1="0" y1="0" x2="1" y2="1">
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
        <ellipse cx="70" cy="60" rx="48" ry="38" fill={isPrismatic ? 'url(#prismatic-shift-bot)' : 'url(#shell-grad-bot)'} stroke={bodyBright} strokeWidth="2" />
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
        <ellipse cx="70" cy="60" rx="48" ry="38" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.2" filter="url(#glow-bot)" />
      </svg>

      <style jsx global>{`
        @keyframes slow-rotate { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(360deg); } }
        .animate-slow-rotate { animation: slow-rotate 8s linear infinite; }
        @keyframes float-gentle { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .animate-float-gentle { animation: float-gentle 2s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
