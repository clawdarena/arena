'use client'

// Bot positions (%) — effects target these exactly
const BOT1_POS = { x: 18, y: 62 }
const BOT2_POS = { x: 72, y: 22 }

export function PowerStrikeEffect({ target }: { target: 'bot1' | 'bot2' }) {
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

export function ReasoningBurstEffect({ target }: { target: 'bot1' | 'bot2' }) {
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

export function FirewallEffect({ defender }: { defender: 'bot1' | 'bot2' }) {
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

export function SpawnAttackEffect({ target }: { target: 'bot1' | 'bot2' }) {
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

export function ScanEffect({ target }: { target: 'bot1' | 'bot2' }) {
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

export function MemoryBombEffect({ target }: { target: 'bot1' | 'bot2' }) {
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

export function TimeBombEffect({ target }: { target: 'bot1' | 'bot2' }) {
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

export function PromptInjectionEffect({ target }: { target: 'bot1' | 'bot2' }) {
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

export function RollbackEffect({ defender }: { defender: 'bot1' | 'bot2' }) {
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

export function VirusEffect({ target }: { target: 'bot1' | 'bot2' }) {
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

export function MirrorCoatEffect({ defender }: { defender: 'bot1' | 'bot2' }) {
  const pos = defender === 'bot1' ? BOT1_POS : BOT2_POS
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <div className="absolute animate-mirror-shine-slow" style={{
        left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)',
      }}>
        <svg viewBox="0 0 120 140" className="w-32 h-40" style={{ filter: 'drop-shadow(0 0 12px #c0c0ff)' }}>
          <rect x="20" y="20" width="80" height="100" rx="5" fill="url(#mirror-grad)" stroke="#e0e0ff" strokeWidth="3" opacity="0.6" />
          <rect x="25" y="25" width="70" height="90" rx="3" fill="rgba(255,255,255,0.1)" stroke="#ffffff" strokeWidth="1" opacity="0.3" />
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

export function EMPPulseEffect({ target }: { target: 'bot1' | 'bot2' }) {
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

export function SleepBombEffect({ target }: { target: 'bot1' | 'bot2' }) {
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

export function OverclockEffect({ target }: { target: 'bot1' | 'bot2' }) {
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

export function BerserkerRushEffect({ target }: { target: 'bot1' | 'bot2' }) {
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

export function AgentOverflowEffect({ target }: { target: 'bot1' | 'bot2' }) {
  const from = target === 'bot2' ? BOT1_POS : BOT2_POS
  const to = target === 'bot2' ? BOT2_POS : BOT1_POS
  const messages = ['TASK COMPLETE', 'SUBPROCESS', 'MULTITHREAD', 'SPAWNING', 'EXECUTING', 'OVERLOAD']
  
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
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
            <svg viewBox="0 0 24 24" className="w-6 h-6" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }}>
              <circle cx="12" cy="12" r="10" fill="#00f0ff" opacity="0.3" />
              <rect x="7" y="8" width="4" height="3" rx="1" fill="#00f0ff" opacity="0.8" />
              <rect x="13" y="8" width="4" height="3" rx="1" fill="#00f0ff" opacity="0.8" />
              <rect x="9" y="14" width="6" height="2" rx="1" fill="#00f0ff" opacity="0.6" />
            </svg>
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
      
      <div className="absolute animate-system-overload-slow" style={{
        left: `${to.x}%`,
        top: `${to.y}%`,
        transform: 'translate(-50%,-50%)',
        animationDelay: '0.6s',
      }}>
        <div className="relative w-32 h-32">
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

// Effect selector function
export function getSkillEffect(skillId: string, target: 'bot1' | 'bot2', action?: string) {
  // Handle defend action
  if (action === 'defend') return <FirewallEffect defender={target === 'bot2' ? 'bot1' : 'bot2'} />
  if (action === 'attack' && !skillId) return <PowerStrikeEffect target={target} />
  
  switch (skillId) {
    case 'power_strike': return <PowerStrikeEffect target={target} />
    case 'reasoning_burst': return <ReasoningBurstEffect target={target} />
    case 'firewall': return <FirewallEffect defender={target === 'bot2' ? 'bot1' : 'bot2'} />
    case 'iron_fortress': return <FirewallEffect defender={target === 'bot2' ? 'bot1' : 'bot2'} />
    case 'mirror_coat': return <MirrorCoatEffect defender={target === 'bot2' ? 'bot1' : 'bot2'} />
    case 'rollback': return <RollbackEffect defender={target === 'bot2' ? 'bot1' : 'bot2'} />
    case 'spawn_attack': return <SpawnAttackEffect target={target} />
    case 'berserker_rush': return <BerserkerRushEffect target={target} />
    case 'sleep_bomb': return <SleepBombEffect target={target} />
    case 'emp_pulse': return <EMPPulseEffect target={target} />
    case 'time_bomb': return <TimeBombEffect target={target} />
    case 'overclock': return <OverclockEffect target={target === 'bot2' ? 'bot1' : 'bot2'} />
    case 'scan': return <ScanEffect target={target} />
    case 'prompt_injection': return <PromptInjectionEffect target={target} />
    case 'memory_bomb': return <MemoryBombEffect target={target} />
    case 'virus': return <VirusEffect target={target} />
    case 'agent_overflow': return <AgentOverflowEffect target={target} />
    default: return <PowerStrikeEffect target={target} />
  }
}
