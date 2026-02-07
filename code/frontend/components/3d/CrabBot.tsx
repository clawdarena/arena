'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CrabBotProps {
  color?: string        // primary neon accent color (hex)
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  animation?: 'idle' | 'attack' | 'defend' | 'skill' | 'hit' | 'death'
  hpPercent?: number    // 0-1, affects glow intensity
  side?: 'left' | 'right'
}

/**
 * Procedural mech-crab built from Three.js primitives.
 * Red/dark-red armored shell, metallic plates, glowing neon accents.
 * Looks like a chunky armored crab robot — not abstract shapes.
 */
export function CrabBot({
  color = '#00f0ff',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  animation = 'idle',
  hpPercent = 1,
  side = 'left',
}: CrabBotProps) {
  const groupRef = useRef<THREE.Group>(null)
  const leftClawRef = useRef<THREE.Group>(null)
  const rightClawRef = useRef<THREE.Group>(null)
  const visorRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(0)

  // Derive color palette from accent color
  const isCyan = color.includes('00f0ff') || color.includes('00F0FF') || color.includes('0ff')
  
  const mats = useMemo(() => {
    // Main shell — dark metallic with warm tint
    const shellMain = new THREE.MeshStandardMaterial({
      color: isCyan ? '#1a2838' : '#2a1418',
      metalness: 0.85,
      roughness: 0.25,
    })
    // Shell highlight plates — brighter armor panels
    const shellPlate = new THREE.MeshStandardMaterial({
      color: isCyan ? '#2a4060' : '#5a1a1a',
      metalness: 0.8,
      roughness: 0.2,
    })
    // Shell edge / ridge — lighter accent
    const shellRidge = new THREE.MeshStandardMaterial({
      color: isCyan ? '#3a5a80' : '#802020',
      metalness: 0.75,
      roughness: 0.3,
    })
    // Neon glow lines
    const neonGlow = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.8,
      metalness: 0.5,
      roughness: 0.1,
    })
    // Visor (eyes) — bright glow
    const visor = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 1.5,
      metalness: 0.4,
      roughness: 0,
      transparent: true,
      opacity: 0.95,
    })
    // Leg / arm joints — dark metallic
    const joint = new THREE.MeshStandardMaterial({
      color: isCyan ? '#0d1520' : '#1a0a0a',
      metalness: 0.9,
      roughness: 0.2,
    })
    // Leg armor segments
    const legArmor = new THREE.MeshStandardMaterial({
      color: isCyan ? '#1e3350' : '#401010',
      metalness: 0.8,
      roughness: 0.25,
    })
    // Claw main body — heavier, chunkier feel
    const clawBody = new THREE.MeshStandardMaterial({
      color: isCyan ? '#253d5a' : '#4a1515',
      metalness: 0.85,
      roughness: 0.2,
    })
    // Claw edge / pincer tips — lighter with neon tint
    const clawEdge = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
      metalness: 0.9,
      roughness: 0.1,
    })
    // Underbelly — softer, slightly organic
    const belly = new THREE.MeshStandardMaterial({
      color: isCyan ? '#0f1a28' : '#200808',
      metalness: 0.6,
      roughness: 0.4,
    })

    return { shellMain, shellPlate, shellRidge, neonGlow, visor, joint, legArmor, clawBody, clawEdge, belly }
  }, [color, isCyan])

  // Animation loop
  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    if (!groupRef.current) return

    // Idle bob
    if (animation === 'idle') {
      groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.03
      groupRef.current.rotation.z = Math.sin(t * 1.5) * 0.015
    }

    // Claw animations
    if (leftClawRef.current && rightClawRef.current) {
      const clawBase = animation === 'idle' ? Math.sin(t * 3) * 0.08 : 0

      if (animation === 'attack') {
        const attackPhase = (t * 4) % (Math.PI * 2)
        leftClawRef.current.rotation.z = -0.3 + Math.sin(attackPhase) * 0.5
        rightClawRef.current.rotation.z = 0.3 - Math.sin(attackPhase) * 0.5
        leftClawRef.current.position.x = -0.6 - Math.abs(Math.sin(attackPhase)) * 0.2
        rightClawRef.current.position.x = 0.6 + Math.abs(Math.sin(attackPhase)) * 0.2
      } else if (animation === 'defend') {
        leftClawRef.current.rotation.z = -0.8
        rightClawRef.current.rotation.z = 0.8
        leftClawRef.current.position.x = -0.25
        rightClawRef.current.position.x = 0.25
      } else if (animation === 'skill') {
        leftClawRef.current.rotation.z = -0.6 + Math.sin(t * 6) * 0.2
        rightClawRef.current.rotation.z = 0.6 - Math.sin(t * 6) * 0.2
      } else {
        leftClawRef.current.rotation.z = clawBase - 0.15
        rightClawRef.current.rotation.z = -clawBase + 0.15
        leftClawRef.current.position.x = -0.6
        rightClawRef.current.position.x = 0.6
      }
    }

    // Hit flash
    if (animation === 'hit' && visorRef.current) {
      const flash = Math.sin(t * 20) > 0
      mats.visor.emissiveIntensity = flash ? 3 : 0.3
      mats.neonGlow.emissiveIntensity = flash ? 2 : 0.2
    } else if (visorRef.current) {
      mats.visor.emissiveIntensity = 1.0 + Math.sin(t * 2) * 0.5
      mats.neonGlow.emissiveIntensity = 0.6 + Math.sin(t * 2) * 0.3
    }

    // HP-based glow
    mats.neonGlow.emissiveIntensity = (0.4 + hpPercent * 0.6) * (animation === 'hit' ? (Math.sin(t * 20) > 0 ? 2 : 0.2) : 1)
  })

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* === MAIN BODY: Armored Dome Shell === */}
      <group>
        {/* Top dome — main carapace */}
        <mesh material={mats.shellMain} castShadow>
          <sphereGeometry args={[0.42, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        </mesh>

        {/* Armor plates on top of dome */}
        <mesh position={[0, 0.22, 0]} material={mats.shellPlate} castShadow>
          <sphereGeometry args={[0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.35]} />
        </mesh>

        {/* Ridge plates (3 segmented armor lines) */}
        {[-0.14, 0, 0.14].map((z, i) => (
          <mesh key={`ridge-${i}`} position={[0, 0.18, z]} material={mats.shellRidge} castShadow>
            <boxGeometry args={[0.55, 0.025, 0.04]} />
          </mesh>
        ))}

        {/* Neon accent lines on shell */}
        {[-0.18, 0.18].map((x, i) => (
          <mesh key={`neon-line-${i}`} position={[x, 0.12, 0.25]} material={mats.neonGlow}>
            <boxGeometry args={[0.015, 0.04, 0.2]} />
          </mesh>
        ))}
        <mesh position={[0, 0.28, 0]} material={mats.neonGlow}>
          <boxGeometry args={[0.35, 0.012, 0.012]} />
        </mesh>

        {/* Lower body ring — flat bottom */}
        <mesh position={[0, -0.06, 0]} material={mats.belly} castShadow>
          <cylinderGeometry args={[0.42, 0.38, 0.12, 20]} />
        </mesh>

        {/* Belly plate */}
        <mesh position={[0, -0.12, 0]} material={mats.belly}>
          <cylinderGeometry args={[0.32, 0.3, 0.04, 16]} />
        </mesh>
      </group>

      {/* === VISOR / EYE STRIP === */}
      <group position={[0, 0.06, 0.34]}>
        {/* Visor housing */}
        <mesh material={mats.shellRidge}>
          <boxGeometry args={[0.36, 0.1, 0.06]} />
        </mesh>
        {/* Glowing visor */}
        <mesh ref={visorRef} position={[0, 0, 0.02]} material={mats.visor}>
          <boxGeometry args={[0.3, 0.05, 0.03]} />
        </mesh>
        {/* Eye dots */}
        <mesh position={[-0.09, 0, 0.04]} material={mats.visor}>
          <sphereGeometry args={[0.028, 8, 8]} />
        </mesh>
        <mesh position={[0.09, 0, 0.04]} material={mats.visor}>
          <sphereGeometry args={[0.028, 8, 8]} />
        </mesh>
      </group>

      {/* === FRONT MANDIBLE BUMPS === */}
      <mesh position={[-0.12, -0.03, 0.38]} material={mats.shellPlate}>
        <sphereGeometry args={[0.04, 8, 8]} />
      </mesh>
      <mesh position={[0.12, -0.03, 0.38]} material={mats.shellPlate}>
        <sphereGeometry args={[0.04, 8, 8]} />
      </mesh>

      {/* === CLAWS (chunky, armored) === */}
      <group ref={leftClawRef} position={[-0.6, 0, 0.15]}>
        <Claw mats={mats} side="left" />
      </group>
      <group ref={rightClawRef} position={[0.6, 0, 0.15]}>
        <Claw mats={mats} side="right" />
      </group>

      {/* === LEGS (6 total, 3 per side — armored) === */}
      {[-1, 0, 1].map((offset, i) => (
        <group key={`left-${i}`}>
          <Leg
            position={[-0.35, -0.08, offset * 0.22]}
            rotation={[0, 0, -0.4 - i * 0.1]}
            mats={mats}
            side="left"
            index={i}
          />
        </group>
      ))}
      {[-1, 0, 1].map((offset, i) => (
        <group key={`right-${i}`}>
          <Leg
            position={[0.35, -0.08, offset * 0.22]}
            rotation={[0, 0, 0.4 + i * 0.1]}
            mats={mats}
            side="right"
            index={i}
          />
        </group>
      ))}

      {/* === BACK EXHAUST VENTS === */}
      {[-0.12, 0, 0.12].map((x, i) => (
        <group key={`vent-${i}`} position={[x, 0.05, -0.38]}>
          <mesh material={mats.shellRidge}>
            <cylinderGeometry args={[0.03, 0.025, 0.06, 8]} />
          </mesh>
          <mesh position={[0, 0.02, 0]} material={mats.neonGlow}>
            <cylinderGeometry args={[0.018, 0.015, 0.02, 8]} />
          </mesh>
        </group>
      ))}

      {/* === UNDERSIDE GLOW === */}
      <mesh position={[0, -0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* === SMALL ANTENNA / SENSOR NODES on shell === */}
      <mesh position={[-0.2, 0.3, -0.05]} material={mats.joint}>
        <cylinderGeometry args={[0.008, 0.008, 0.1, 4]} />
      </mesh>
      <mesh position={[-0.2, 0.35, -0.05]} material={mats.neonGlow}>
        <sphereGeometry args={[0.015, 6, 6]} />
      </mesh>
      <mesh position={[0.2, 0.3, -0.05]} material={mats.joint}>
        <cylinderGeometry args={[0.008, 0.008, 0.1, 4]} />
      </mesh>
      <mesh position={[0.2, 0.35, -0.05]} material={mats.neonGlow}>
        <sphereGeometry args={[0.015, 6, 6]} />
      </mesh>
    </group>
  )
}

type CrabMats = {
  shellMain: THREE.MeshStandardMaterial
  shellPlate: THREE.MeshStandardMaterial
  shellRidge: THREE.MeshStandardMaterial
  neonGlow: THREE.MeshStandardMaterial
  visor: THREE.MeshStandardMaterial
  joint: THREE.MeshStandardMaterial
  legArmor: THREE.MeshStandardMaterial
  clawBody: THREE.MeshStandardMaterial
  clawEdge: THREE.MeshStandardMaterial
  belly: THREE.MeshStandardMaterial
}

/** Chunky armored claw arm with upper/lower pincer */
function Claw({ mats, side }: { mats: CrabMats; side: 'left' | 'right' }) {
  const s = side === 'left' ? -1 : 1

  return (
    <group>
      {/* Arm segment — armored cylinder + box */}
      <mesh material={mats.clawBody} rotation={[0, 0, s * 0.3]} castShadow>
        <boxGeometry args={[0.22, 0.1, 0.1]} />
      </mesh>
      {/* Arm armor plate */}
      <mesh position={[0, 0.04, 0]} rotation={[0, 0, s * 0.3]} material={mats.shellRidge}>
        <boxGeometry args={[0.2, 0.025, 0.11]} />
      </mesh>
      {/* Neon stripe on arm */}
      <mesh position={[0, 0, 0.056]} material={mats.neonGlow}>
        <boxGeometry args={[0.2, 0.012, 0.005]} />
      </mesh>

      {/* Joint ball */}
      <mesh position={[s * -0.12, 0, 0]} material={mats.joint}>
        <sphereGeometry args={[0.035, 8, 8]} />
      </mesh>

      {/* Upper pincer — chunky */}
      <group position={[s * -0.2, 0.045, 0]}>
        <mesh material={mats.clawBody} castShadow>
          <boxGeometry args={[0.2, 0.05, 0.07]} />
        </mesh>
        {/* Pincer armor ridge */}
        <mesh position={[0, 0.025, 0]} material={mats.shellRidge}>
          <boxGeometry args={[0.18, 0.015, 0.075]} />
        </mesh>
        {/* Claw tip — glowing */}
        <mesh position={[s * -0.12, 0, 0]} material={mats.clawEdge}>
          <coneGeometry args={[0.03, 0.1, 6]} />
        </mesh>
        {/* Inner grip teeth */}
        {[-0.04, 0, 0.04].map((off, i) => (
          <mesh key={i} position={[s * (-0.05 + off * s), -0.025, 0]} material={mats.neonGlow}>
            <boxGeometry args={[0.01, 0.015, 0.02]} />
          </mesh>
        ))}
      </group>

      {/* Lower pincer — slightly smaller */}
      <group position={[s * -0.2, -0.045, 0]}>
        <mesh material={mats.clawBody} castShadow>
          <boxGeometry args={[0.17, 0.04, 0.065]} />
        </mesh>
        <mesh position={[s * -0.1, 0, 0]} material={mats.clawEdge}>
          <coneGeometry args={[0.025, 0.08, 6]} />
        </mesh>
        {/* Inner grip teeth */}
        {[-0.03, 0.01, 0.05].map((off, i) => (
          <mesh key={i} position={[s * (-0.04 + off * s), 0.02, 0]} material={mats.neonGlow}>
            <boxGeometry args={[0.01, 0.012, 0.018]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Single articulated leg with armor plating */
function Leg({
  position,
  rotation,
  mats,
  side,
  index,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  mats: CrabMats
  side: 'left' | 'right'
  index: number
}) {
  const legRef = useRef<THREE.Group>(null)
  const s = side === 'left' ? -1 : 1

  useFrame(({ clock }) => {
    if (!legRef.current) return
    const t = clock.getElapsedTime()
    const phase = t * 3 + index * 1.2
    legRef.current.rotation.x = Math.sin(phase) * 0.1
  })

  return (
    <group ref={legRef} position={position} rotation={rotation}>
      {/* Upper leg — armored */}
      <mesh material={mats.legArmor} castShadow>
        <cylinderGeometry args={[0.025, 0.018, 0.2, 8]} />
      </mesh>
      {/* Upper leg armor plate */}
      <mesh position={[s * -0.01, 0, 0]} material={mats.shellRidge}>
        <boxGeometry args={[0.035, 0.15, 0.015]} />
      </mesh>

      {/* Joint sphere */}
      <mesh position={[0, -0.1, 0]} material={mats.neonGlow}>
        <sphereGeometry args={[0.022, 8, 8]} />
      </mesh>

      {/* Lower leg */}
      <group position={[s * -0.05, -0.2, 0]} rotation={[0, 0, s * -0.5]}>
        <mesh material={mats.joint}>
          <cylinderGeometry args={[0.018, 0.01, 0.17, 6]} />
        </mesh>
        {/* Lower armor strip */}
        <mesh position={[s * -0.005, 0, 0]} material={mats.legArmor}>
          <boxGeometry args={[0.025, 0.12, 0.012]} />
        </mesh>
        {/* Foot tip — neon glow */}
        <mesh position={[0, -0.09, 0]} material={mats.neonGlow}>
          <sphereGeometry args={[0.014, 6, 6]} />
        </mesh>
      </group>
    </group>
  )
}
