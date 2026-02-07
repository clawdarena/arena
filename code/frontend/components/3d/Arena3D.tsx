'use client'

import { Suspense, useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, ContactShadows, Text } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { CrabBot } from './CrabBot'
import type { RoundResult, CombatActionType } from '../../../shared/types'

interface Arena3DProps {
  bot1Name: string
  bot2Name: string
  bot1MaxHp: number
  bot2MaxHp: number
  currentRound: RoundResult | null
  previousRound: RoundResult | null
  isAnimating: boolean
  onAnimationComplete?: () => void
}

/** Animated grid floor */
function ArenaFloor() {
  const meshRef = useRef<THREE.Mesh>(null)

  return (
    <group>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial
          color="#050510"
          metalness={0.8}
          roughness={0.4}
        />
      </mesh>

      {/* Grid lines */}
      {Array.from({ length: 17 }, (_, i) => i - 8).map((x) => (
        <mesh key={`vl-${x}`} position={[x * 0.5, -0.49, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.005, 6]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.15} transparent opacity={0.3} />
        </mesh>
      ))}
      {Array.from({ length: 13 }, (_, i) => i - 6).map((z) => (
        <mesh key={`hl-${z}`} position={[0, -0.49, z * 0.5]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[0.005, 8]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.15} transparent opacity={0.3} />
        </mesh>
      ))}

      {/* Center line */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.02, 6]} />
        <meshStandardMaterial color="#ff4040" emissive="#ff4040" emissiveIntensity={0.4} transparent opacity={0.6} />
      </mesh>

      {/* Contact shadows for depth */}
      <ContactShadows position={[0, -0.49, 0]} opacity={0.4} scale={8} blur={2} far={3} />
    </group>
  )
}

/** Floating damage number */
function DamageNumber({ value, position, isHeal }: { value: number; position: [number, number, number]; isHeal: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const [opacity, setOpacity] = useState(1)

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.position.y += delta * 1.5
    setOpacity((o) => Math.max(0, o - delta * 1.2))
  })

  if (opacity <= 0) return null

  return (
    <group ref={ref} position={position}>
      <Text
        fontSize={0.25}
        color={isHeal ? '#40ff40' : '#ff4040'}
        anchorX="center"
        anchorY="middle"
        fillOpacity={opacity}
        outlineWidth={0.02}
        outlineColor="#000000"
        font="/fonts/JetBrainsMono-Bold.woff"
      >
        {isHeal ? '+' : '-'}{value}
      </Text>
    </group>
  )
}

/** Camera shake effect */
function CameraShake({ intensity = 0 }: { intensity: number }) {
  const { camera } = useThree()
  const originalPos = useRef(new THREE.Vector3(0, 1.2, 4))

  useFrame(() => {
    if (intensity > 0) {
      camera.position.x = originalPos.current.x + (Math.random() - 0.5) * intensity * 0.1
      camera.position.y = originalPos.current.y + (Math.random() - 0.5) * intensity * 0.05
    } else {
      camera.position.lerp(originalPos.current, 0.1)
    }
  })

  return null
}

/** Main 3D scene content */
function ArenaScene({
  bot1Name,
  bot2Name,
  bot1MaxHp,
  bot2MaxHp,
  currentRound,
  previousRound,
  isAnimating,
  onAnimationComplete,
}: Arena3DProps) {
  const [bot1Hp, setBot1Hp] = useState(bot1MaxHp)
  const [bot2Hp, setBot2Hp] = useState(bot2MaxHp)
  const [bot1Anim, setBot1Anim] = useState<'idle' | 'attack' | 'defend' | 'skill' | 'hit' | 'death'>('idle')
  const [bot2Anim, setBot2Anim] = useState<'idle' | 'attack' | 'defend' | 'skill' | 'hit' | 'death'>('idle')
  const [shakeIntensity, setShakeIntensity] = useState(0)
  const [damageNums, setDamageNums] = useState<{ id: number; value: number; pos: [number, number, number]; isHeal: boolean }[]>([])
  const numId = useRef(0)

  // Update HP from previous round
  useEffect(() => {
    if (previousRound) {
      setBot1Hp(previousRound.bot1_hp)
      setBot2Hp(previousRound.bot2_hp)
    }
  }, [previousRound])

  // Animate current round
  useEffect(() => {
    if (!currentRound || !isAnimating) return

    const timeline = async () => {
      // Phase 1: Show actions
      await delay(200)
      setBot1Anim(currentRound.bot1_action as any)
      setBot2Anim(currentRound.bot2_action as any)

      await delay(500)

      // Phase 2: Damage
      if (currentRound.bot1_damage_dealt > 0) {
        addDamage(currentRound.bot1_damage_dealt, [1.5, 0.5, 0], false)
        setBot2Anim('hit')
        setShakeIntensity(1)
        setTimeout(() => setShakeIntensity(0), 200)
      }
      if (currentRound.bot2_damage_dealt > 0) {
        addDamage(currentRound.bot2_damage_dealt, [-1.5, 0.5, 0], false)
        setBot1Anim('hit')
        if (!currentRound.bot1_damage_dealt) {
          setShakeIntensity(1)
          setTimeout(() => setShakeIntensity(0), 200)
        }
      }

      await delay(200)

      // Phase 3: HP update
      setBot1Hp(currentRound.bot1_hp)
      setBot2Hp(currentRound.bot2_hp)

      await delay(400)

      // Reset
      setBot1Anim('idle')
      setBot2Anim('idle')
      onAnimationComplete?.()
    }

    timeline()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRound, isAnimating])

  function addDamage(value: number, pos: [number, number, number], isHeal: boolean) {
    const id = ++numId.current
    setDamageNums((prev) => [...prev, { id, value, pos, isHeal }])
    setTimeout(() => setDamageNums((prev) => prev.filter((d) => d.id !== id)), 1500)
  }

  const bot1HpPct = Math.max(0, bot1Hp / bot1MaxHp)
  const bot2HpPct = Math.max(0, bot2Hp / bot2MaxHp)

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[3, 5, 3]} intensity={0.6} castShadow />
      <pointLight position={[-2, 2, 0]} color="#00f0ff" intensity={0.5} distance={6} />
      <pointLight position={[2, 2, 0]} color="#ff4040" intensity={0.5} distance={6} />

      {/* Environment for reflections */}
      <Environment preset="night" />

      {/* Arena floor */}
      <ArenaFloor />

      {/* Bot 1 (Player — cyan, left side) */}
      <CrabBot
        position={[-1.5, -0.2, 0]}
        rotation={[0, 0.3, 0]}
        color="#00f0ff"
        scale={1.2}
        animation={bot1Anim}
        hpPercent={bot1HpPct}
        side="left"
      />

      {/* Bot 2 (Opponent — red, right side) */}
      <CrabBot
        position={[1.5, -0.2, 0]}
        rotation={[0, -0.3 + Math.PI, 0]}
        color="#ff4040"
        scale={1.2}
        animation={bot2Anim}
        hpPercent={bot2HpPct}
        side="right"
      />

      {/* Damage numbers */}
      {damageNums.map((d) => (
        <DamageNumber key={d.id} value={d.value} position={d.pos} isHeal={d.isHeal} />
      ))}

      {/* Camera shake */}
      <CameraShake intensity={shakeIntensity} />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.3}
          luminanceSmoothing={0.6}
          intensity={0.8}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.3} darkness={0.7} />
      </EffectComposer>
    </>
  )
}

/**
 * 3D Combat Arena — drop-in replacement for the 2D ArenaView.
 * Renders two CrabBots on a neon grid floor with bloom + camera effects.
 */
export function Arena3D(props: Arena3DProps) {
  return (
    <div className="relative w-full aspect-[16/9] max-h-[400px] rounded-sm border border-[var(--border-dim)] overflow-hidden bg-[#050510]">
      <Canvas
        camera={{ position: [0, 1.2, 4], fov: 45 }}
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <ArenaScene {...props} />
        </Suspense>
      </Canvas>

      {/* HP bars overlay (HTML on top of 3D) */}
      <div className="absolute bottom-3 left-3 right-3 flex gap-4 z-10">
        <HPOverlay
          name={props.bot1Name}
          hp={props.currentRound ? props.currentRound.bot1_hp : props.bot1MaxHp}
          maxHp={props.bot1MaxHp}
          color="cyan"
        />
        <HPOverlay
          name={props.bot2Name}
          hp={props.currentRound ? props.currentRound.bot2_hp : props.bot2MaxHp}
          maxHp={props.bot2MaxHp}
          color="red"
        />
      </div>
    </div>
  )
}

function HPOverlay({ name, hp, maxHp, color }: { name: string; hp: number; maxHp: number; color: 'cyan' | 'red' }) {
  const pct = Math.max(0, (hp / maxHp) * 100)
  const barColor = pct <= 25 ? 'bg-red-500' : pct <= 50 ? 'bg-yellow-500' : color === 'cyan' ? 'bg-cyan-400' : 'bg-red-400'

  return (
    <div className="flex-1 bg-black/60 backdrop-blur-sm rounded-sm p-2 border border-white/10">
      <div className="flex justify-between mb-1">
        <span className={`text-[10px] font-medium ${color === 'cyan' ? 'text-cyan-300' : 'text-red-300'}`}>{name}</span>
        <span className="text-[10px] text-white/60 font-mono">{hp}/{maxHp}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
