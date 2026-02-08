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

// Deterministic noise
function hash3(x: number, y: number, z: number): number {
  let h = x * 374761393 + y * 668265263 + z * 1274126177
  h = Math.abs(h)
  h = ((h >> 13) ^ h) * 1274126177
  return (Math.abs(h) % 10000) / 10000
}

/**
 * Paint vertex colors: bright armor plates on outward/top surfaces,
 * dark gunmetal in recesses/joints, subtle accent in seams.
 */
function paintVertexColors(geo: THREE.BufferGeometry, isCyan: boolean, accentColor: THREE.Color) {
  const positions = geo.attributes.position
  const normals = geo.attributes.normal
  const count = positions.count
  const colors = new Float32Array(count * 3)

  // More saturated, brighter armor colors
  const armorBright = isCyan
    ? new THREE.Color('#6ab0d8')   // bright steel blue
    : new THREE.Color('#d04535')   // bright warm red
  const armorMid = isCyan
    ? new THREE.Color('#3a7090')   // mid steel blue
    : new THREE.Color('#992828')   // mid crimson
  const armorDark = isCyan
    ? new THREE.Color('#1a3a50')   // dark navy
    : new THREE.Color('#4a1212')   // dark maroon
  const jointDark = new THREE.Color('#121215')   // near-black joints
  const jointMetal = new THREE.Color('#2a2a30')  // gunmetal
  const accentDim = accentColor.clone().multiplyScalar(0.25)

  const tmpColor = new THREE.Color()
  const bbox = geo.boundingBox!
  const size = new THREE.Vector3()
  bbox.getSize(size)

  for (let i = 0; i < count; i++) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const z = positions.getZ(i)
    const nx = normals.getX(i)
    const ny = normals.getY(i)
    const nz = normals.getZ(i)

    const h = (y - bbox.min.y) / size.y  // 0=bottom, 1=top
    const upFacing = ny * 0.5 + 0.5
    const outward = Math.sqrt(nx * nx + nz * nz)
    const steepness = 1.0 - Math.abs(ny)
    const n1 = hash3(Math.floor(x * 20), Math.floor(y * 20), Math.floor(z * 20))
    const n2 = hash3(Math.floor(x * 8), Math.floor(y * 8), Math.floor(z * 8))

    // Joint zone: steep horizontal normals + lower areas
    const jointFactor = Math.pow(steepness, 1.5) * (0.5 + (1.0 - h) * 0.5)
    // Top armor: upper regions with upward normals
    const topPlateFactor = Math.pow(Math.max(0, upFacing - 0.3) / 0.7, 1.2) * h
    // Side armor: outward normals
    const sidePlateFactor = outward * (1.0 - jointFactor) * (0.3 + h * 0.7)

    // Start mid
    tmpColor.copy(armorMid)

    // Top plates → bright
    tmpColor.lerp(armorBright, topPlateFactor * 0.85)
    // Side plates → mid-bright
    tmpColor.lerp(armorBright, sidePlateFactor * 0.45)
    // Joints → dark
    tmpColor.lerp(jointDark, jointFactor * 0.8)
    // Lower body → darker
    const lowerDark = Math.pow(Math.max(0, 0.35 - h) / 0.35, 1.5)
    tmpColor.lerp(armorDark, lowerDark * 0.6)

    // Weathering
    tmpColor.multiplyScalar(1.0 - n2 * 0.12 * (0.5 + steepness * 0.5))

    // Bright scratches on outward armor
    if (n1 > 0.88 && upFacing > 0.5 && jointFactor < 0.3) {
      tmpColor.lerp(armorBright, 0.5)
    }

    // Accent in deep joints
    if (jointFactor > 0.6 && n2 > 0.55) {
      tmpColor.lerp(accentDim, 0.15)
    }

    // Panel seams
    const seamY = Math.abs(Math.sin(y * 12.0)) < 0.05 ? 1.0 : 0.0
    const seamXZ = Math.abs(Math.sin((x + z) * 8.0)) < 0.04 ? 1.0 : 0.0
    tmpColor.lerp(jointMetal, Math.max(seamY, seamXZ) * (1.0 - jointFactor) * 0.5)

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
  const timeRef = useRef(0)

  const { scene } = useGLTF('/models/crabbot.glb')
  const isCyan = color.toLowerCase().includes('00f0ff') || color.toLowerCase().includes('0ff')
  const accentThree = useMemo(() => new THREE.Color(color), [color])

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
    paintVertexColors(g, isCyan, accentThree)
    return g
  }, [scene, isCyan, accentThree])

  // PBR material — NO emissive, let vertex colors + lighting do the work
  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      metalness: 0.75,
      roughness: 0.3,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.0,
      // NO emissive — this was causing the solid glow
    })
  }, [])

  // Animation loop
  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current
    if (!groupRef.current) return
    const g = groupRef.current

    g.position.set(position[0], position[1], position[2])
    g.rotation.set(rotation[0], rotation[1], rotation[2])

    if (animation === 'idle') {
      g.position.y += Math.sin(t * 2) * 0.04
      g.rotation.z += Math.sin(t * 1.5) * 0.015
      g.rotation.x += Math.sin(t * 1.2) * 0.008
    } else if (animation === 'attack') {
      const phase = (t * 5) % (Math.PI * 2)
      g.position.z += side === 'left' ? Math.sin(phase) * 0.3 : -Math.sin(phase) * 0.3
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

    // Hit flash — temporarily add emissive
    if (material) {
      if (animation === 'hit') {
        const flash = Math.sin(t * 20) > 0
        material.emissive.set(flash ? '#ffffff' : '#000000')
        material.emissiveIntensity = flash ? 0.3 : 0
      } else if (animation === 'skill') {
        material.emissive.set(color)
        material.emissiveIntensity = 0.1 + Math.sin(t * 6) * 0.05
      } else {
        material.emissive.set('#000000')
        material.emissiveIntensity = 0
      }
    }
  })

  if (!geometry) return null

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Main armored mesh — vertex colored, PBR */}
      <mesh
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
      />

      {/* Eye glows — small, focused, only accent on the model */}
      <mesh position={[-0.15, 0.28, 0.35]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <mesh position={[0.15, 0.28, 0.35]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} toneMapped={false} />
      </mesh>

      {/* Tiny under-glow — very subtle */}
      <mesh position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
