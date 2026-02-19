'use client'

import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================
// Shared Helpers
// ============================================================

function useClock() {
  const ref = useRef(0)
  useFrame((_, dt) => { ref.current += dt })
  return ref
}

/** Simple particle system base */
function Particles({
  count,
  color,
  size = 0.04,
  spread = 1,
  speed = 1,
  lifetime = 2,
  origin = [0, 0, 0] as [number, number, number],
  direction = 'up' as 'up' | 'down' | 'radial' | 'spiral',
  opacity = 1,
}: {
  count: number
  color: string
  size?: number
  spread?: number
  speed?: number
  lifetime?: number
  origin?: [number, number, number]
  direction?: 'up' | 'down' | 'radial' | 'spiral'
  opacity?: number
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const particleData = useMemo(() => {
    const data = []
    for (let i = 0; i < count; i++) {
      data.push({
        offset: Math.random() * lifetime,
        vx: (Math.random() - 0.5) * spread,
        vy: direction === 'down' ? -Math.random() * speed : Math.random() * speed,
        vz: (Math.random() - 0.5) * spread,
        rotSpeed: (Math.random() - 0.5) * 2,
      })
    }
    return data
  }, [count, spread, speed, lifetime, direction])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    particleData.forEach((p, i) => {
      const age = ((t + p.offset) % lifetime) / lifetime
      let x = origin[0] + p.vx * age
      let y = origin[1] + p.vy * age
      let z = origin[2] + p.vz * age
      if (direction === 'spiral') {
        x += Math.sin(age * Math.PI * 4 + i) * spread * 0.5
        z += Math.cos(age * Math.PI * 4 + i) * spread * 0.5
      }
      if (direction === 'radial') {
        const angle = (i / count) * Math.PI * 2
        x += Math.cos(angle + t * 2) * age * spread
        z += Math.sin(angle + t * 2) * age * spread
      }
      const s = size * (1 - age * 0.5)
      dummy.position.set(x, y, z)
      dummy.scale.setScalar(Math.max(0.001, s))
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} />
    </instancedMesh>
  )
}

// ============================================================
// Pokemon-style Hit Effect
// ============================================================

export function PokemonHitEffect({
  position,
  intensity = 1,
  superEffective = false,
  critical = false,
  onComplete,
}: {
  position: [number, number, number]
  intensity?: number
  superEffective?: boolean
  critical?: boolean
  onComplete?: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const startTime = useRef(-1)
  const [active, setActive] = useState(true)
  const flashRef = useRef<THREE.Mesh>(null)
  const [showText, setShowText] = useState(false)
  const textOpacity = useRef(1)

  useFrame((state) => {
    if (!active) return
    const t = state.clock.elapsedTime
    if (startTime.current < 0) startTime.current = t

    const elapsed = t - startTime.current
    const duration = critical ? 1.2 : superEffective ? 0.9 : 0.6

    // Flash phase (Pokemon style rapid white/black)
    if (flashRef.current) {
      const flashPhase = Math.floor(elapsed * (critical ? 10 : 15))
      const flashOn = flashPhase % 2 === 0
      const flashDuration = critical ? 0.4 : 0.25
      if (elapsed < flashDuration) {
        flashRef.current.visible = true
        const mat = flashRef.current.material as THREE.MeshBasicMaterial
        mat.color.set(flashOn ? '#ffffff' : '#000000')
        mat.opacity = 0.8
      } else {
        flashRef.current.visible = false
      }
    }

    // Shake/knockback on parent
    if (groupRef.current) {
      const shakeTime = superEffective ? 0.5 : 0.3
      if (elapsed < shakeTime) {
        const shakeAmt = intensity * (superEffective ? 0.15 : 0.08) * (1 - elapsed / shakeTime)
        groupRef.current.position.x = position[0] + (Math.random() - 0.5) * shakeAmt
        groupRef.current.position.y = position[1] + (Math.random() - 0.5) * shakeAmt * 0.5
      } else {
        groupRef.current.position.set(position[0], position[1], position[2])
      }
    }

    // Super effective text
    if (superEffective && elapsed > 0.3 && !showText) {
      setShowText(true)
    }
    if (showText) {
      textOpacity.current = Math.max(0, 1 - (elapsed - 0.3) / 0.6)
    }

    if (elapsed > duration) {
      setActive(false)
      onComplete?.()
    }
  })

  if (!active) return null

  return (
    <group ref={groupRef} position={position}>
      {/* White/black flash overlay on the bot */}
      <mesh ref={flashRef} visible={false}>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Impact sparks */}
      <Particles
        count={superEffective ? 30 : 15}
        color={superEffective ? '#ffff00' : '#ffffff'}
        size={0.03}
        spread={superEffective ? 1.2 : 0.6}
        speed={2}
        lifetime={0.5}
        direction="radial"
      />

      {/* Super effective text */}
      {showText && superEffective && (
        <Text
          position={[0, 1.2, 0]}
          fontSize={0.2}
          color="#ffdd00"
          anchorX="center"
          anchorY="middle"
          fillOpacity={textOpacity.current}
          outlineWidth={0.02}
          outlineColor="#ff4400"
          font="/fonts/JetBrainsMono-Bold.woff"
        >
          SUPER EFFECTIVE!
        </Text>
      )}

      {/* Critical text */}
      {critical && (
        <Text
          position={[0, 1.4, 0]}
          fontSize={0.18}
          color="#ff4444"
          anchorX="center"
          anchorY="middle"
          fillOpacity={textOpacity.current}
          outlineWidth={0.02}
          outlineColor="#880000"
          font="/fonts/JetBrainsMono-Bold.woff"
        >
          CRITICAL!
        </Text>
      )}
    </group>
  )
}

// ============================================================
// Attack-Specific Effects
// ============================================================

/** Power Strike — glowing claw slash with energy trail */
export function PowerStrikeEffect({
  from,
  to,
  onComplete,
}: {
  from: [number, number, number]
  to: [number, number, number]
  onComplete?: () => void
}) {
  const ref = useRef<THREE.Group>(null)
  const startTime = useRef(-1)
  const trailRef = useRef<THREE.Mesh>(null)
  const [active, setActive] = useState(true)

  useFrame((state) => {
    if (!active) return
    const t = state.clock.elapsedTime
    if (startTime.current < 0) startTime.current = t
    const elapsed = t - startTime.current
    const progress = Math.min(1, elapsed / 0.4)

    if (ref.current) {
      ref.current.position.x = from[0] + (to[0] - from[0]) * progress
      ref.current.position.y = from[1] + (to[1] - from[1]) * progress + Math.sin(progress * Math.PI) * 0.3
      ref.current.position.z = from[2] + (to[2] - from[2]) * progress
      ref.current.scale.setScalar(1 + Math.sin(progress * Math.PI) * 0.5)
    }

    if (trailRef.current) {
      const mat = trailRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - progress) * 0.6
    }

    if (elapsed > 0.5) {
      setActive(false)
      onComplete?.()
    }
  })

  if (!active) return null

  return (
    <group ref={ref}>
      {/* Glowing orb projectile */}
      <mesh>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.9} toneMapped={false} />
      </mesh>
      {/* Energy trail */}
      <mesh ref={trailRef} scale={[0.5, 0.5, 1.5]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#00ccff" transparent opacity={0.4} toneMapped={false} />
      </mesh>
      <pointLight color="#00ffff" intensity={3} distance={2} decay={2} />
    </group>
  )
}

/** Spawn Attack — 3 ghost copies */
export function SpawnAttackEffect({
  from,
  to,
  color = '#00f0ff',
  onComplete,
}: {
  from: [number, number, number]
  to: [number, number, number]
  color?: string
  onComplete?: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const startTime = useRef(-1)
  const [active, setActive] = useState(true)

  const offsets = useMemo(() => [
    { x: 0, z: -0.4 },
    { x: 0, z: 0 },
    { x: 0, z: 0.4 },
  ], [])

  useFrame((state) => {
    if (!active) return
    const t = state.clock.elapsedTime
    if (startTime.current < 0) startTime.current = t
    const elapsed = t - startTime.current
    const progress = Math.min(1, elapsed / 0.8)

    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const off = offsets[i]
        const staggeredProgress = Math.min(1, Math.max(0, (progress - i * 0.1) / 0.7))
        child.position.x = from[0] + (to[0] - from[0]) * staggeredProgress + off.x
        child.position.y = from[1] + (to[1] - from[1]) * staggeredProgress + Math.sin(staggeredProgress * Math.PI) * 0.2
        child.position.z = from[2] + off.z
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined
        if (mat && 'opacity' in mat) {
          mat.opacity = 0.5 * (1 - staggeredProgress * 0.5)
        }
      })
    }

    if (elapsed > 1.0) {
      setActive(false)
      onComplete?.()
    }
  })

  if (!active) return null

  return (
    <group ref={groupRef}>
      {offsets.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.2, 10, 10]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

/** Memory Bomb — purple/pink data fragments raining down */
export function MemoryBombEffect({
  target,
  onComplete,
}: {
  target: [number, number, number]
  onComplete?: () => void
}) {
  const startTime = useRef(-1)
  const [active, setActive] = useState(true)

  useFrame((state) => {
    if (!active) return
    const t = state.clock.elapsedTime
    if (startTime.current < 0) startTime.current = t
    if (t - startTime.current > 1.5) {
      setActive(false)
      onComplete?.()
    }
  })

  if (!active) return null

  return (
    <group position={target}>
      <Particles
        count={40}
        color="#cc44ff"
        size={0.04}
        spread={0.8}
        speed={2}
        lifetime={1.2}
        origin={[0, 1.5, 0]}
        direction="down"
      />
      <Particles
        count={20}
        color="#ff66cc"
        size={0.03}
        spread={0.6}
        speed={1.5}
        lifetime={1.0}
        origin={[0, 1.2, 0]}
        direction="down"
      />
      <pointLight color="#cc44ff" intensity={2} distance={3} decay={2} position={[0, 0.5, 0]} />
    </group>
  )
}

/** Time Bomb — glowing ticking orb */
export function TimeBombEffect({
  target,
  onComplete,
}: {
  target: [number, number, number]
  onComplete?: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const startTime = useRef(-1)
  const [active, setActive] = useState(true)
  const [exploding, setExploding] = useState(false)
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!active) return
    const t = state.clock.elapsedTime
    if (startTime.current < 0) startTime.current = t
    const elapsed = t - startTime.current

    if (!exploding && elapsed < 1.2) {
      // Ticking phase
      if (meshRef.current) {
        const pulse = Math.sin(elapsed * 12) * 0.5 + 0.5
        meshRef.current.scale.setScalar(0.15 + pulse * 0.05)
        const mat = meshRef.current.material as THREE.MeshBasicMaterial
        mat.opacity = 0.5 + pulse * 0.5
      }
    } else if (!exploding) {
      setExploding(true)
    }

    if (exploding) {
      const explodeElapsed = elapsed - 1.2
      if (ringRef.current) {
        const scale = explodeElapsed * 5
        ringRef.current.scale.set(scale, scale, scale)
        const mat = ringRef.current.material as THREE.MeshBasicMaterial
        mat.opacity = Math.max(0, 1 - explodeElapsed * 2)
      }
      if (explodeElapsed > 0.8) {
        setActive(false)
        onComplete?.()
      }
    }
  })

  if (!active) return null

  return (
    <group position={target}>
      {!exploding && (
        <mesh ref={meshRef}>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshBasicMaterial color="#ffaa00" transparent opacity={0.8} toneMapped={false} />
        </mesh>
      )}
      {exploding && (
        <>
          <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.3, 0.02, 8, 32]} />
            <meshBasicMaterial color="#ff6600" transparent opacity={1} toneMapped={false} />
          </mesh>
          <Particles count={20} color="#ff8800" size={0.05} spread={1.5} speed={3} lifetime={0.6} direction="radial" />
        </>
      )}
      <pointLight color="#ffaa00" intensity={exploding ? 5 : 2} distance={3} decay={2} />
    </group>
  )
}

/** Reasoning Burst — beam of energy */
export function ReasoningBurstEffect({
  from,
  to,
  onComplete,
}: {
  from: [number, number, number]
  to: [number, number, number]
  onComplete?: () => void
}) {
  const beamRef = useRef<THREE.Mesh>(null)
  const startTime = useRef(-1)
  const [active, setActive] = useState(true)

  const midpoint = useMemo(() => [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2 + 0.1,
    (from[2] + to[2]) / 2,
  ] as [number, number, number], [from, to])

  const length = useMemo(() =>
    Math.sqrt((to[0]-from[0])**2 + (to[1]-from[1])**2 + (to[2]-from[2])**2),
    [from, to]
  )

  const angle = useMemo(() =>
    Math.atan2(to[2]-from[2], to[0]-from[0]),
    [from, to]
  )

  useFrame((state) => {
    if (!active) return
    const t = state.clock.elapsedTime
    if (startTime.current < 0) startTime.current = t
    const elapsed = t - startTime.current

    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshBasicMaterial
      const progress = Math.min(1, elapsed / 0.3)
      beamRef.current.scale.x = progress
      mat.opacity = elapsed < 0.3 ? 1 : Math.max(0, 1 - (elapsed - 0.3) / 0.4)
    }

    if (elapsed > 0.8) {
      setActive(false)
      onComplete?.()
    }
  })

  if (!active) return null

  return (
    <group>
      {/* Main beam */}
      <mesh
        ref={beamRef}
        position={midpoint}
        rotation={[0, -angle, 0]}
      >
        <boxGeometry args={[length, 0.08, 0.08]} />
        <meshBasicMaterial color="#ffdd00" transparent opacity={1} toneMapped={false} />
      </mesh>
      {/* Lightning particles around beam */}
      <Particles
        count={25}
        color="#ffff88"
        size={0.03}
        spread={0.4}
        speed={1.5}
        lifetime={0.5}
        origin={midpoint}
        direction="radial"
      />
      <pointLight color="#ffdd00" intensity={4} distance={4} decay={2} position={midpoint} />
    </group>
  )
}

/** Stack Overflow — cascading text characters */
export function StackOverflowEffect({
  target,
  onComplete,
}: {
  target: [number, number, number]
  onComplete?: () => void
}) {
  const startTime = useRef(-1)
  const [active, setActive] = useState(true)
  const chars = useMemo(() => {
    const c = '{}[]();=><!/\\0x1F#@&*%'.split('')
    return Array.from({ length: 30 }, () => ({
      char: c[Math.floor(Math.random() * c.length)],
      x: (Math.random() - 0.5) * 1.2,
      z: (Math.random() - 0.5) * 0.6,
      delay: Math.random() * 0.8,
      speed: 1 + Math.random() * 2,
    }))
  }, [])

  useFrame((state) => {
    if (!active) return
    const t = state.clock.elapsedTime
    if (startTime.current < 0) startTime.current = t
    if (t - startTime.current > 1.8) {
      setActive(false)
      onComplete?.()
    }
  })

  if (!active) return null

  return (
    <group position={target}>
      {chars.map((c, i) => (
        <FallingChar key={i} char={c.char} x={c.x} z={c.z} delay={c.delay} speed={c.speed} startTime={startTime} />
      ))}
      <pointLight color="#00ff00" intensity={2} distance={2} decay={2} />
    </group>
  )
}

function FallingChar({
  char, x, z, delay, speed, startTime,
}: {
  char: string; x: number; z: number; delay: number; speed: number; startTime: React.RefObject<number>
}) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current || startTime.current < 0) return
    const elapsed = state.clock.elapsedTime - startTime.current - delay
    if (elapsed < 0) {
      ref.current.visible = false
      return
    }
    ref.current.visible = true
    ref.current.position.y = 2 - elapsed * speed
    const mat = ref.current.children[0] as any
    if (mat && mat.fillOpacity !== undefined) {
      // Text doesn't easily do this per-frame, use group opacity
    }
  })

  return (
    <group ref={ref} position={[x, 2, z]} visible={false}>
      <Text
        fontSize={0.1}
        color="#00ff44"
        anchorX="center"
        anchorY="middle"
        font="/fonts/JetBrainsMono-Bold.woff"
      >
        {char}
      </Text>
    </group>
  )
}

/** Tool Overload — spinning gears */
export function ToolOverloadEffect({
  target,
  onComplete,
}: {
  target: [number, number, number]
  onComplete?: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const startTime = useRef(-1)
  const [active, setActive] = useState(true)

  useFrame((state) => {
    if (!active || !groupRef.current) return
    const t = state.clock.elapsedTime
    if (startTime.current < 0) startTime.current = t
    const elapsed = t - startTime.current

    // Spin phase (0-0.8s), crash phase (0.8-1.2s)
    groupRef.current.children.forEach((child, i) => {
      const angle = (i / 6) * Math.PI * 2 + elapsed * 4
      const radius = elapsed < 0.8 ? 0.6 : 0.6 * Math.max(0, 1 - (elapsed - 0.8) * 3)
      child.position.x = Math.cos(angle) * radius
      child.position.z = Math.sin(angle) * radius
      child.position.y = 0.3 + Math.sin(elapsed * 3 + i) * 0.1
      child.rotation.z = elapsed * 5
    })

    if (elapsed > 1.3) {
      setActive(false)
      onComplete?.()
    }
  })

  if (!active) return null

  return (
    <group position={target}>
      <group ref={groupRef}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i}>
            <torusGeometry args={[0.06, 0.02, 6, 8]} />
            <meshBasicMaterial color="#ffaa00" transparent opacity={0.7} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <Particles count={15} color="#ff8800" size={0.02} spread={0.5} speed={1} lifetime={0.8} direction="radial" />
      <pointLight color="#ffaa00" intensity={3} distance={2} decay={2} />
    </group>
  )
}

/** Recursive Loop — spiral vortex */
export function RecursiveLoopEffect({
  target,
  onComplete,
}: {
  target: [number, number, number]
  onComplete?: () => void
}) {
  const startTime = useRef(-1)
  const [active, setActive] = useState(true)

  useFrame((state) => {
    if (!active) return
    const t = state.clock.elapsedTime
    if (startTime.current < 0) startTime.current = t
    if (t - startTime.current > 1.5) {
      setActive(false)
      onComplete?.()
    }
  })

  if (!active) return null

  return (
    <group position={target}>
      <Particles
        count={40}
        color="#8844ff"
        size={0.04}
        spread={0.8}
        speed={1.5}
        lifetime={1.2}
        direction="spiral"
      />
      <Particles
        count={20}
        color="#cc88ff"
        size={0.03}
        spread={0.5}
        speed={1}
        lifetime={1.0}
        direction="spiral"
      />
      {/* Stars after */}
      <DizzinessStars position={[0, 0.8, 0]} />
      <pointLight color="#8844ff" intensity={3} distance={3} decay={2} />
    </group>
  )
}

/** Dizziness stars circling above */
function DizzinessStars({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = state.clock.elapsedTime * 3
  })

  return (
    <group ref={groupRef} position={position}>
      {Array.from({ length: 4 }, (_, i) => {
        const angle = (i / 4) * Math.PI * 2
        return (
          <Text
            key={i}
            position={[Math.cos(angle) * 0.25, 0, Math.sin(angle) * 0.25]}
            fontSize={0.1}
            color="#ffff00"
            anchorX="center"
            anchorY="middle"
          >
            ★
          </Text>
        )
      })}
    </group>
  )
}

/** Mirror Match — reflective wall */
export function MirrorMatchEffect({
  position,
  onComplete,
}: {
  position: [number, number, number]
  onComplete?: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const startTime = useRef(-1)
  const [active, setActive] = useState(true)

  useFrame((state) => {
    if (!active) return
    const t = state.clock.elapsedTime
    if (startTime.current < 0) startTime.current = t
    const elapsed = t - startTime.current

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshPhysicalMaterial
      if (elapsed < 0.3) {
        meshRef.current.scale.y = elapsed / 0.3
      } else if (elapsed > 0.8) {
        // Shatter: break apart
        mat.opacity = Math.max(0, 1 - (elapsed - 0.8) * 3)
        meshRef.current.position.y = position[1] + (elapsed - 0.8) * 0.2
      }
    }

    if (elapsed > 1.1) {
      setActive(false)
      onComplete?.()
    }
  })

  if (!active) return null

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[1, 1.2]} />
      <meshPhysicalMaterial
        color="#aaddff"
        metalness={1}
        roughness={0}
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
        envMapIntensity={2}
      />
    </mesh>
  )
}

/** Prompt Injection — glitchy matrix text */
export function PromptInjectionEffect({
  target,
  onComplete,
}: {
  target: [number, number, number]
  onComplete?: () => void
}) {
  const startTime = useRef(-1)
  const [active, setActive] = useState(true)

  const glitchTexts = useMemo(() =>
    Array.from({ length: 12 }, () => ({
      text: ['IGNORE', 'SYSTEM:', '>>>', 'sudo', 'rm -rf', 'INJECT', '0xDEAD', 'BYPASS'][Math.floor(Math.random() * 8)],
      x: (Math.random() - 0.5) * 1.5,
      y: (Math.random() - 0.5) * 1.0,
      z: (Math.random() - 0.5) * 0.4,
    })),
    []
  )

  useFrame((state) => {
    if (!active) return
    const t = state.clock.elapsedTime
    if (startTime.current < 0) startTime.current = t
    if (t - startTime.current > 1.2) {
      setActive(false)
      onComplete?.()
    }
  })

  if (!active) return null

  return (
    <group position={target}>
      {glitchTexts.map((g, i) => (
        <Text
          key={i}
          position={[g.x, g.y + 0.3, g.z]}
          fontSize={0.08}
          color="#00ff00"
          anchorX="center"
          anchorY="middle"
          font="/fonts/JetBrainsMono-Bold.woff"
          fillOpacity={0.7}
        >
          {g.text}
        </Text>
      ))}
      <Particles count={15} color="#00ff44" size={0.02} spread={0.8} speed={1} lifetime={0.8} direction="radial" />
    </group>
  )
}

/** Identity Crisis — color scramble and question marks */
export function IdentityCrisisEffect({
  target,
  onComplete,
}: {
  target: [number, number, number]
  onComplete?: () => void
}) {
  const startTime = useRef(-1)
  const [active, setActive] = useState(true)

  useFrame((state) => {
    if (!active) return
    const t = state.clock.elapsedTime
    if (startTime.current < 0) startTime.current = t
    if (t - startTime.current > 1.5) {
      setActive(false)
      onComplete?.()
    }
  })

  if (!active) return null

  return (
    <group position={target}>
      {/* Question marks floating above */}
      {Array.from({ length: 5 }, (_, i) => (
        <FloatingQuestionMark key={i} index={i} startTime={startTime} />
      ))}
      {/* Color scramble particles */}
      <Particles count={25} color="#ff00ff" size={0.04} spread={0.6} speed={0.8} lifetime={1.2} direction="radial" />
      <Particles count={15} color="#00ffff" size={0.03} spread={0.5} speed={0.6} lifetime={1.0} direction="radial" />
    </group>
  )
}

function FloatingQuestionMark({ index, startTime }: { index: number; startTime: React.RefObject<number> }) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current || startTime.current < 0) return
    const elapsed = state.clock.elapsedTime - startTime.current
    const angle = (index / 5) * Math.PI * 2 + elapsed * 2
    ref.current.position.x = Math.cos(angle) * 0.35
    ref.current.position.y = 0.8 + Math.sin(elapsed * 3 + index) * 0.1
    ref.current.position.z = Math.sin(angle) * 0.35
  })

  return (
    <group ref={ref}>
      <Text fontSize={0.12} color="#ff44ff" anchorX="center" anchorY="middle">
        ?
      </Text>
    </group>
  )
}

/** Firewall — hexagonal shield */
export function FirewallEffect({
  position,
  onComplete,
}: {
  position: [number, number, number]
  onComplete?: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const startTime = useRef(-1)
  const [active, setActive] = useState(true)

  useFrame((state) => {
    if (!active) return
    const t = state.clock.elapsedTime
    if (startTime.current < 0) startTime.current = t
    const elapsed = t - startTime.current

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial
      if (elapsed < 0.3) {
        meshRef.current.scale.setScalar(elapsed / 0.3)
        mat.opacity = 0.4
      } else if (elapsed > 1.2) {
        mat.opacity = Math.max(0, 0.4 * (1 - (elapsed - 1.2) / 0.3))
      }
    }

    if (elapsed > 1.5) {
      setActive(false)
      onComplete?.()
    }
  })

  if (!active) return null

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshBasicMaterial color="#00aaff" transparent opacity={0.4} wireframe toneMapped={false} />
      </mesh>
      <pointLight color="#00aaff" intensity={2} distance={2} decay={2} />
    </group>
  )
}

/** Rollback — rewind effect */
export function RollbackEffect({
  position,
  onComplete,
}: {
  position: [number, number, number]
  onComplete?: () => void
}) {
  const startTime = useRef(-1)
  const [active, setActive] = useState(true)
  const arrowsRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!active) return
    const t = state.clock.elapsedTime
    if (startTime.current < 0) startTime.current = t
    const elapsed = t - startTime.current

    if (arrowsRef.current) {
      arrowsRef.current.rotation.y = -elapsed * 6
    }

    if (elapsed > 1.2) {
      setActive(false)
      onComplete?.()
    }
  })

  if (!active) return null

  return (
    <group position={position}>
      <group ref={arrowsRef}>
        {Array.from({ length: 3 }, (_, i) => {
          const angle = (i / 3) * Math.PI * 2
          return (
            <Text
              key={i}
              position={[Math.cos(angle) * 0.4, 0.5, Math.sin(angle) * 0.4]}
              fontSize={0.15}
              color="#44aaff"
              anchorX="center"
              anchorY="middle"
            >
              ⟲
            </Text>
          )
        })}
      </group>
      <Particles count={20} color="#4488ff" size={0.03} spread={0.5} speed={-1} lifetime={1} direction="up" />
      <pointLight color="#4488ff" intensity={2} distance={2} decay={2} />
    </group>
  )
}

/** Scan — scanning beam */
export function ScanEffect({
  target,
  onComplete,
}: {
  target: [number, number, number]
  onComplete?: () => void
}) {
  const beamRef = useRef<THREE.Mesh>(null)
  const startTime = useRef(-1)
  const [active, setActive] = useState(true)

  useFrame((state) => {
    if (!active) return
    const t = state.clock.elapsedTime
    if (startTime.current < 0) startTime.current = t
    const elapsed = t - startTime.current

    if (beamRef.current) {
      // Sweep up and down
      const sweep = Math.sin(elapsed * 4) * 0.6
      beamRef.current.position.y = sweep + 0.3
      const mat = beamRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = elapsed < 1.0 ? 0.5 : Math.max(0, 0.5 - (elapsed - 1.0) * 2)
    }

    if (elapsed > 1.3) {
      setActive(false)
      onComplete?.()
    }
  })

  if (!active) return null

  return (
    <group position={target}>
      <mesh ref={beamRef} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 0.02]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.5} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {/* Holographic frame */}
      <mesh position={[0, 0.3, 0.3]}>
        <planeGeometry args={[0.6, 0.4]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.15} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <pointLight color="#00ff88" intensity={2} distance={2} decay={2} />
    </group>
  )
}

// ============================================================
// Status Effect Visuals (persistent on bots)
// ============================================================

/** Burning — small flames */
export function BurningEffect({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Particles count={12} color="#ff4400" size={0.04} spread={0.3} speed={1.2} lifetime={0.6} direction="up" />
      <Particles count={8} color="#ffaa00" size={0.03} spread={0.2} speed={1} lifetime={0.5} direction="up" />
      <pointLight color="#ff4400" intensity={1} distance={1.5} decay={2} />
    </group>
  )
}

/** Stunned — circling stars */
export function StunnedEffect({ position }: { position: [number, number, number] }) {
  return (
    <group position={[position[0], position[1] + 0.8, position[2]]}>
      <DizzinessStars position={[0, 0, 0]} />
    </group>
  )
}

/** Shielded — translucent bubble */
export function ShieldedEffect({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 2) * 0.05
  })

  return (
    <mesh ref={meshRef} position={position}>
      <icosahedronGeometry args={[0.65, 2]} />
      <meshBasicMaterial color="#00ccff" transparent opacity={0.15} wireframe toneMapped={false} />
    </mesh>
  )
}

/** Overclocked — electricity crackling */
export function OverclockedEffect({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Particles count={10} color="#00ffff" size={0.025} spread={0.4} speed={2} lifetime={0.3} direction="radial" />
      <pointLight color="#00ffff" intensity={1.5} distance={1.5} decay={2} />
    </group>
  )
}

/** Poisoned — green toxic drip */
export function PoisonedEffect({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Particles count={10} color="#44ff00" size={0.035} spread={0.3} speed={0.8} lifetime={1} origin={[0, 0.5, 0]} direction="down" />
      <pointLight color="#44ff00" intensity={0.8} distance={1.5} decay={2} />
    </group>
  )
}
