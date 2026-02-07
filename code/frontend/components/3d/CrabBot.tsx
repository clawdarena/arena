'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface CrabBotProps {
  color?: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  animation?: 'idle' | 'attack' | 'defend' | 'skill' | 'hit' | 'death'
  hpPercent?: number
  side?: 'left' | 'right'
}

useGLTF.preload('/models/crabbot.glb')

// Simple seeded hash for deterministic noise
function hash3(x: number, y: number, z: number): number {
  let h = x * 374761393 + y * 668265263 + z * 1274126177
  h = Math.abs(h)
  h = ((h >> 13) ^ h) * 1274126177
  return (Math.abs(h) % 10000) / 10000
}

/**
 * Paints vertex colors onto geometry based on position + normals.
 * Creates distinct zones: bright armor plates, dark joints, accent seams.
 */
function paintVertexColors(geo: THREE.BufferGeometry, isCyan: boolean, accentColor: THREE.Color) {
  const positions = geo.attributes.position
  const normals = geo.attributes.normal
  const count = positions.count
  const colors = new Float32Array(count * 3)

  // Palette
  const armorBright = isCyan
    ? new THREE.Color('#5090c0')  // bright steel blue
    : new THREE.Color('#c83030')  // bright crimson red
  const armorMid = isCyan
    ? new THREE.Color('#2e5a80')  // mid blue
    : new THREE.Color('#8a2020')  // mid red
  const armorDark = isCyan
    ? new THREE.Color('#162a40')  // dark navy
    : new THREE.Color('#3a0e0e')  // dark maroon
  const jointDark = new THREE.Color('#0e0e0e')  // near-black joints
  const jointMetal = new THREE.Color('#252525') // dark gunmetal
  const accentDim = accentColor.clone().multiplyScalar(0.4)

  const tmpColor = new THREE.Color()
  const bbox = geo.boundingBox!
  const size = new THREE.Vector3()
  bbox.getSize(size)
  const halfH = size.y / 2

  for (let i = 0; i < count; i++) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const z = positions.getZ(i)
    const nx = normals.getX(i)
    const ny = normals.getY(i)
    const nz = normals.getZ(i)

    // Normalized height [0..1]
    const h = (y - bbox.min.y) / size.y

    // How much does normal face up/outward?
    const upFacing = ny * 0.5 + 0.5 // 0 = down-facing, 1 = up-facing
    const outward = Math.sqrt(nx * nx + nz * nz) // how much normal faces sideways

    // Steepness: normals that are mostly horizontal = joint/recess areas
    const steepness = 1.0 - Math.abs(ny)

    // Distance from center axis (for radial variation)
    const radial = Math.sqrt(x * x + z * z)

    // Noise for variation
    const n1 = hash3(Math.floor(x * 20), Math.floor(y * 20), Math.floor(z * 20))
    const n2 = hash3(Math.floor(x * 8), Math.floor(y * 8), Math.floor(z * 8))

    // === Zone classification ===

    // Joint zone: steep normals (horizontal-facing) + lower areas
    const jointFactor = Math.pow(steepness, 1.5) * (0.5 + (1.0 - h) * 0.5)

    // Top armor plate: upper regions with upward normals
    const topPlateFactor = Math.pow(Math.max(0, upFacing - 0.3) / 0.7, 1.2) * h

    // Side armor: outward normals at mid-height
    const sidePlateFactor = outward * (1.0 - jointFactor) * (0.3 + h * 0.7)

    // Start with mid armor color
    tmpColor.copy(armorMid)

    // Top plates get bright color
    tmpColor.lerp(armorBright, topPlateFactor * 0.8)

    // Side plates get mid-bright
    tmpColor.lerp(armorBright, sidePlateFactor * 0.4)

    // Joints/recesses get very dark
    tmpColor.lerp(jointDark, jointFactor * 0.75)

    // Lower body gets progressively darker
    const lowerDark = Math.pow(Math.max(0, 0.35 - h) / 0.35, 1.5)
    tmpColor.lerp(armorDark, lowerDark * 0.6)

    // Weathering / grime: darken randomly
    const grime = n2 * 0.15 * (0.5 + steepness * 0.5)
    tmpColor.multiplyScalar(1.0 - grime)

    // Bright scratches on outward-facing armor
    if (n1 > 0.88 && upFacing > 0.5 && jointFactor < 0.3) {
      tmpColor.lerp(armorBright, 0.5)
    }

    // Subtle accent glow in deepest joints
    if (jointFactor > 0.6 && n2 > 0.5) {
      tmpColor.lerp(accentDim, 0.2)
    }

    // Panel edge darkening (procedural seams)
    const seamY = Math.abs(Math.sin(y * 12.0)) < 0.05 ? 1.0 : 0.0
    const seamXZ = Math.abs(Math.sin((x + z) * 8.0)) < 0.04 ? 1.0 : 0.0
    const seam = Math.max(seamY, seamXZ) * (1.0 - jointFactor)
    tmpColor.lerp(jointMetal, seam * 0.5)

    colors[i * 3] = tmpColor.r
    colors[i * 3 + 1] = tmpColor.g
    colors[i * 3 + 2] = tmpColor.b
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}

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

  const { scene } = useGLTF('/models/crabbot.glb')
  const isCyan = color.toLowerCase().includes('00f0ff') || color.toLowerCase().includes('0ff')
  const accentThree = useMemo(() => new THREE.Color(color), [color])

  // Clone geometry, compute normals, paint vertex colors
  const geometry = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && !geo) {
        geo = (child as THREE.Mesh).geometry.clone()
      }
    })
    if (!geo) return null
    const g = geo as THREE.BufferGeometry
    g.computeVertexNormals()
    g.computeBoundingBox()
    const center = new THREE.Vector3()
    g.boundingBox!.getCenter(center)
    g.translate(-center.x, -center.y, -center.z)
    // Paint vertex colors
    paintVertexColors(g, isCyan, accentThree)
    return g
  }, [scene, isCyan, accentThree])

  // PBR material with vertex colors — real metallic armor look
  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      metalness: 0.82,
      roughness: 0.25,
      clearcoat: 0.4,
      clearcoatRoughness: 0.15,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.08,
      envMapIntensity: 1.2,
    })
  }, [color])

  // Rim glow mesh — slightly larger, emissive wireframe for edge neon
  const rimMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: 0.035,
    })
  }, [color])

  // Animation loop
  useFrame((state, delta) => {
    timeRef.current += delta
    const t = timeRef.current
    if (!groupRef.current) return
    const g = groupRef.current

    // Reset position each frame for clean state
    g.position.set(position[0], position[1], position[2])
    g.rotation.set(rotation[0], rotation[1], rotation[2])

    if (animation === 'idle') {
      g.position.y += Math.sin(t * 2) * 0.04
      g.rotation.z += Math.sin(t * 1.5) * 0.015
      g.rotation.x += Math.sin(t * 1.2) * 0.008
    } else if (animation === 'attack') {
      const phase = (t * 5) % (Math.PI * 2)
      const lunge = Math.sin(phase) * 0.3
      g.position.z += side === 'left' ? lunge : -lunge
      g.position.y += Math.abs(Math.sin(phase)) * 0.05
      g.rotation.z += Math.sin(phase) * 0.08
    } else if (animation === 'defend') {
      g.position.y -= 0.06
      g.rotation.x += 0.12
    } else if (animation === 'skill') {
      g.rotation.y += t * 3
      g.position.y += Math.sin(t * 4) * 0.08
    } else if (animation === 'hit') {
      g.position.x += (Math.random() - 0.5) * 0.1
      g.position.y += (Math.random() - 0.5) * 0.05
    } else if (animation === 'death') {
      g.rotation.z += Math.min(t * 0.5, Math.PI / 3)
      g.position.y -= Math.min(t * 0.2, 0.3)
    }

    // Dynamic emissive based on state
    if (material) {
      if (animation === 'hit') {
        material.emissiveIntensity = Math.sin(t * 20) > 0 ? 0.5 : 0.02
      } else if (animation === 'skill') {
        material.emissiveIntensity = 0.15 + Math.sin(t * 6) * 0.1
      } else {
        material.emissiveIntensity = 0.05 + hpPercent * 0.06 + Math.sin(t * 2) * 0.02
      }
    }

    // Rim glow pulse
    if (rimMat) {
      if (animation === 'skill') {
        rimMat.opacity = 0.12 + Math.sin(t * 8) * 0.08
      } else if (animation === 'hit') {
        rimMat.opacity = Math.sin(t * 20) > 0 ? 0.2 : 0
      } else {
        rimMat.opacity = 0.025 + Math.sin(t * 2) * 0.015
      }
    }
  })

  if (!geometry) return null

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Main armored mesh */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
      />

      {/* Neon rim wireframe */}
      <mesh geometry={geometry} material={rimMat} />

      {/* Bot accent glow */}
      <pointLight
        color={accentThree}
        intensity={0.4 + hpPercent * 0.5}
        distance={2.5}
        decay={2}
        position={[0, 0.2, 0]}
      />

      {/* Eye glows */}
      <mesh position={[-0.15, 0.28, 0.35]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <mesh position={[0.15, 0.28, 0.35]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} toneMapped={false} />
      </mesh>

      {/* Under-glow */}
      <mesh position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
