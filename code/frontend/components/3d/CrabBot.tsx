'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
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

// Preload the model
useGLTF.preload('/models/crabbot.glb')

/**
 * GLB-based CrabBot with computed normals and dynamic materials.
 * Loads the crabbot.glb model, applies neon-accented mech materials.
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
  const meshRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(0)

  // Load GLB
  const { scene } = useGLTF('/models/crabbot.glb')

  // Clone geometry so each instance is independent
  const geometry = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && !geo) {
        geo = (child as THREE.Mesh).geometry.clone()
      }
    })
    if (geo) {
      // Compute normals since the GLB has none
      ;(geo as THREE.BufferGeometry).computeVertexNormals()
      // Center and normalize scale
      ;(geo as THREE.BufferGeometry).computeBoundingBox()
      const box = (geo as THREE.BufferGeometry).boundingBox!
      const center = new THREE.Vector3()
      box.getCenter(center)
      ;(geo as THREE.BufferGeometry).translate(-center.x, -center.y, -center.z)
    }
    return geo as unknown as THREE.BufferGeometry
  }, [scene])

  // Determine color palette
  const isCyan = color.toLowerCase().includes('00f0ff') || color.toLowerCase().includes('0ff')

  // Material — metallic with emissive glow from accent color
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: isCyan ? '#1c3045' : '#3a1218',
      emissive: color,
      emissiveIntensity: 0.15,
      metalness: 0.85,
      roughness: 0.2,
      flatShading: false,
    })
  }, [color, isCyan])

  // Wireframe overlay for neon edge effect
  const wireMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: 0.06,
    })
  }, [color])

  // Glow point light to color the model
  const glowColor = useMemo(() => new THREE.Color(color), [color])

  // Animation loop
  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    if (!groupRef.current) return

    const g = groupRef.current

    if (animation === 'idle') {
      g.position.y = position[1] + Math.sin(t * 2) * 0.04
      g.rotation.z = Math.sin(t * 1.5) * 0.02
      g.rotation.x = rotation[0] + Math.sin(t * 1.2) * 0.01
    } else if (animation === 'attack') {
      // Lunge forward
      const phase = (t * 5) % (Math.PI * 2)
      const lunge = Math.sin(phase) * 0.3
      g.position.z = position[2] + (side === 'left' ? lunge : -lunge)
      g.rotation.z = Math.sin(phase) * 0.1
    } else if (animation === 'defend') {
      // Hunker down
      g.position.y = position[1] - 0.08
      g.rotation.x = rotation[0] + 0.15
    } else if (animation === 'skill') {
      // Spin + glow
      g.rotation.y = rotation[1] + t * 4
      g.position.y = position[1] + Math.sin(t * 4) * 0.06
    } else if (animation === 'hit') {
      // Shake + flash
      g.position.x = position[0] + (Math.random() - 0.5) * 0.08
      g.position.y = position[1] + (Math.random() - 0.5) * 0.04
    } else if (animation === 'death') {
      // Fall over
      g.rotation.z = Math.min(t * 0.5, Math.PI / 3)
      g.position.y = position[1] - Math.min(t * 0.2, 0.3)
    }

    // HP-based emissive intensity
    if (material) {
      const baseIntensity = 0.08 + hpPercent * 0.15
      if (animation === 'hit') {
        material.emissiveIntensity = Math.sin(t * 20) > 0 ? 0.6 : 0.02
      } else if (animation === 'skill') {
        material.emissiveIntensity = 0.3 + Math.sin(t * 6) * 0.15
      } else {
        material.emissiveIntensity = baseIntensity + Math.sin(t * 2) * 0.04
      }
    }

    // Wireframe pulse
    if (wireMaterial) {
      if (animation === 'skill') {
        wireMaterial.opacity = 0.15 + Math.sin(t * 8) * 0.1
      } else if (animation === 'hit') {
        wireMaterial.opacity = Math.sin(t * 20) > 0 ? 0.25 : 0
      } else {
        wireMaterial.opacity = 0.04 + Math.sin(t * 2) * 0.02
      }
    }
  })

  if (!geometry) return null

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Main model mesh */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
      />

      {/* Wireframe overlay for neon edge effect */}
      <mesh
        geometry={geometry}
        material={wireMaterial}
      />

      {/* Accent glow light attached to the bot */}
      <pointLight
        color={glowColor}
        intensity={0.6 + hpPercent * 0.4}
        distance={2.5}
        decay={2}
        position={[0, 0.3, 0]}
      />

      {/* Eye glow spots (front of model) */}
      <mesh position={[-0.15, 0.25, 0.35]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh position={[0.15, 0.25, 0.35]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Under-glow */}
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
