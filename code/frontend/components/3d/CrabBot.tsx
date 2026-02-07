'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CrabBotProps {
  color?: string        // primary neon color (hex)
  bodyColor?: string    // dark body color
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  animation?: 'idle' | 'attack' | 'defend' | 'skill' | 'hit' | 'death'
  hpPercent?: number    // 0-1, affects glow intensity
  side?: 'left' | 'right'
}

/**
 * Procedural mech-crab built from Three.js primitives.
 * Dome shell body, 6 articulated legs, 2 big claw arms, glowing visor.
 */
export function CrabBot({
  color = '#00f0ff',
  bodyColor = '#0a0a0f',
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
  const bodyRef = useRef<THREE.Mesh>(null)
  const visorRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(0)

  // Materials (memoized)
  const { shellMat, accentMat, visorMat, jointMat, clawMat } = useMemo(() => ({
    shellMat: new THREE.MeshStandardMaterial({
      color: bodyColor,
      metalness: 0.85,
      roughness: 0.2,
      envMapIntensity: 1,
    }),
    accentMat: new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.1,
    }),
    visorMat: new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 1.2,
      metalness: 0.5,
      roughness: 0,
      transparent: true,
      opacity: 0.9,
    }),
    jointMat: new THREE.MeshStandardMaterial({
      color: '#1a1a2e',
      metalness: 0.7,
      roughness: 0.3,
    }),
    clawMat: new THREE.MeshStandardMaterial({
      color: bodyColor,
      emissive: color,
      emissiveIntensity: 0.15,
      metalness: 0.9,
      roughness: 0.15,
    }),
  }), [color, bodyColor])

  // Animation loop
  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    if (!groupRef.current) return

    // Idle bob
    if (animation === 'idle') {
      groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.03
      groupRef.current.rotation.z = Math.sin(t * 1.5) * 0.02
    }

    // Claw idle pinch
    if (leftClawRef.current && rightClawRef.current) {
      const clawBase = animation === 'idle' ? Math.sin(t * 3) * 0.08 : 0
      
      if (animation === 'attack') {
        // Claws lunge forward and snap
        const attackPhase = (t * 4) % (Math.PI * 2)
        leftClawRef.current.rotation.z = -0.3 + Math.sin(attackPhase) * 0.5
        rightClawRef.current.rotation.z = 0.3 - Math.sin(attackPhase) * 0.5
        leftClawRef.current.position.x = -0.55 - Math.abs(Math.sin(attackPhase)) * 0.15
        rightClawRef.current.position.x = 0.55 + Math.abs(Math.sin(attackPhase)) * 0.15
      } else if (animation === 'defend') {
        // Claws pull in front as shield
        leftClawRef.current.rotation.z = -0.8
        rightClawRef.current.rotation.z = 0.8
        leftClawRef.current.position.x = -0.25
        rightClawRef.current.position.x = 0.25
      } else if (animation === 'skill') {
        // Claws spread wide, glow intensifies
        leftClawRef.current.rotation.z = -0.6 + Math.sin(t * 6) * 0.2
        rightClawRef.current.rotation.z = 0.6 - Math.sin(t * 6) * 0.2
      } else {
        leftClawRef.current.rotation.z = clawBase - 0.15
        rightClawRef.current.rotation.z = -clawBase + 0.15
        leftClawRef.current.position.x = -0.55
        rightClawRef.current.position.x = 0.55
      }
    }

    // Hit flash
    if (animation === 'hit' && visorRef.current) {
      const flash = Math.sin(t * 20) > 0
      visorMat.emissiveIntensity = flash ? 2 : 0.3
    } else if (visorRef.current) {
      visorMat.emissiveIntensity = 0.8 + Math.sin(t * 2) * 0.4
    }

    // HP-based glow
    accentMat.emissiveIntensity = 0.2 + hpPercent * 0.4
  })

  const mirror = side === 'right' ? -1 : 1

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* === BODY: Dome Shell === */}
      <mesh ref={bodyRef} material={shellMat} castShadow>
        <sphereGeometry args={[0.4, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <mesh position={[0, -0.08, 0]} material={shellMat}>
          <cylinderGeometry args={[0.4, 0.35, 0.15, 16]} />
        </mesh>
      </mesh>

      {/* Shell accent lines */}
      {[-0.12, 0, 0.12].map((z, i) => (
        <mesh key={i} position={[0, 0.15, z]} rotation={[0, 0, 0]} material={accentMat}>
          <boxGeometry args={[0.6, 0.015, 0.015]} />
        </mesh>
      ))}

      {/* === VISOR (eyes) === */}
      <mesh ref={visorRef} position={[0, 0.05, 0.32]} material={visorMat}>
        <boxGeometry args={[0.3, 0.06, 0.04]} />
      </mesh>
      {/* Eye dots */}
      <mesh position={[-0.08, 0.05, 0.35]} material={visorMat}>
        <sphereGeometry args={[0.025, 8, 8]} />
      </mesh>
      <mesh position={[0.08, 0.05, 0.35]} material={visorMat}>
        <sphereGeometry args={[0.025, 8, 8]} />
      </mesh>

      {/* === CLAWS === */}
      <group ref={leftClawRef} position={[-0.55, 0, 0.15]}>
        <Claw shellMat={clawMat} accentMat={accentMat} side="left" />
      </group>
      <group ref={rightClawRef} position={[0.55, 0, 0.15]}>
        <Claw shellMat={clawMat} accentMat={accentMat} side="right" />
      </group>

      {/* === LEGS (6 total, 3 per side) === */}
      {[-1, 0, 1].map((offset, i) => (
        <group key={`left-${i}`}>
          <Leg
            position={[-0.32, -0.1, offset * 0.2]}
            rotation={[0, 0, -0.4 - i * 0.1]}
            jointMat={jointMat}
            accentMat={accentMat}
            side="left"
            index={i}
          />
        </group>
      ))}
      {[-1, 0, 1].map((offset, i) => (
        <group key={`right-${i}`}>
          <Leg
            position={[0.32, -0.1, offset * 0.2]}
            rotation={[0, 0, 0.4 + i * 0.1]}
            jointMat={jointMat}
            accentMat={accentMat}
            side="right"
            index={i}
          />
        </group>
      ))}

      {/* === UNDERSIDE GLOW === */}
      <mesh position={[0, -0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

/** Single claw arm with upper/lower pincer */
function Claw({
  shellMat,
  accentMat,
  side,
}: {
  shellMat: THREE.Material
  accentMat: THREE.Material
  side: 'left' | 'right'
}) {
  const s = side === 'left' ? -1 : 1

  return (
    <group>
      {/* Arm segment */}
      <mesh material={shellMat} rotation={[0, 0, s * 0.3]}>
        <boxGeometry args={[0.2, 0.08, 0.08]} />
      </mesh>

      {/* Upper pincer */}
      <group position={[s * -0.15, 0.04, 0]}>
        <mesh material={shellMat}>
          <boxGeometry args={[0.18, 0.04, 0.06]} />
        </mesh>
        {/* Claw tip */}
        <mesh position={[s * -0.1, 0, 0]} material={accentMat}>
          <coneGeometry args={[0.025, 0.08, 4]} />
        </mesh>
      </group>

      {/* Lower pincer */}
      <group position={[s * -0.15, -0.04, 0]}>
        <mesh material={shellMat}>
          <boxGeometry args={[0.15, 0.035, 0.055]} />
        </mesh>
        <mesh position={[s * -0.08, 0, 0]} material={accentMat}>
          <coneGeometry args={[0.02, 0.06, 4]} />
        </mesh>
      </group>

      {/* Accent stripe on arm */}
      <mesh position={[0, 0, 0.045]} material={accentMat}>
        <boxGeometry args={[0.2, 0.01, 0.005]} />
      </mesh>
    </group>
  )
}

/** Single articulated leg */
function Leg({
  position,
  rotation,
  jointMat,
  accentMat,
  side,
  index,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  jointMat: THREE.Material
  accentMat: THREE.Material
  side: 'left' | 'right'
  index: number
}) {
  const legRef = useRef<THREE.Group>(null)
  const s = side === 'left' ? -1 : 1

  useFrame(({ clock }) => {
    if (!legRef.current) return
    const t = clock.getElapsedTime()
    // Subtle walking motion
    const phase = t * 3 + index * 1.2
    legRef.current.rotation.x = Math.sin(phase) * 0.1
  })

  return (
    <group ref={legRef} position={position} rotation={rotation}>
      {/* Upper leg */}
      <mesh material={jointMat}>
        <cylinderGeometry args={[0.02, 0.015, 0.18, 6]} />
      </mesh>

      {/* Joint */}
      <mesh position={[0, -0.09, 0]} material={accentMat}>
        <sphereGeometry args={[0.02, 6, 6]} />
      </mesh>

      {/* Lower leg */}
      <group position={[s * -0.05, -0.18, 0]} rotation={[0, 0, s * -0.5]}>
        <mesh material={jointMat}>
          <cylinderGeometry args={[0.015, 0.008, 0.15, 6]} />
        </mesh>
        {/* Foot tip */}
        <mesh position={[0, -0.08, 0]} material={accentMat}>
          <sphereGeometry args={[0.01, 4, 4]} />
        </mesh>
      </group>
    </group>
  )
}
