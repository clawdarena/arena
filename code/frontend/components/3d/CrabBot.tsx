'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useMatcapTexture } from '@react-three/drei'
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

/**
 * Generate a metallic matcap texture on a canvas.
 * Creates a sphere-like lighting bake with the given base color.
 */
function createMatcapCanvas(
  baseR: number, baseG: number, baseB: number,
  highlightR: number, highlightG: number, highlightB: number,
  size = 256
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const half = size / 2

  // Fill black
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, size, size)

  // Radial gradient: highlight center → base mid → dark edge
  const grad = ctx.createRadialGradient(
    half * 0.65, half * 0.45, 0,    // highlight offset (upper-left)
    half, half, half * 0.95
  )

  // Specular highlight
  grad.addColorStop(0, `rgb(${Math.min(255, highlightR + 80)},${Math.min(255, highlightG + 80)},${Math.min(255, highlightB + 80)})`)
  // Bright armor
  grad.addColorStop(0.2, `rgb(${highlightR},${highlightG},${highlightB})`)
  // Mid armor
  grad.addColorStop(0.45, `rgb(${baseR},${baseG},${baseB})`)
  // Dark edge
  grad.addColorStop(0.7, `rgb(${Math.floor(baseR * 0.35)},${Math.floor(baseG * 0.35)},${Math.floor(baseB * 0.35)})`)
  // Rim — very dark with slight ambient
  grad.addColorStop(0.88, `rgb(${Math.floor(baseR * 0.12)},${Math.floor(baseG * 0.12)},${Math.floor(baseB * 0.12)})`)
  grad.addColorStop(1, `rgb(5,5,8)`)

  // Draw sphere
  ctx.beginPath()
  ctx.arc(half, half, half * 0.95, 0, Math.PI * 2)
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.fill()

  // Add a subtle secondary rim highlight (Fresnel-like) on the edge
  const rimGrad = ctx.createRadialGradient(half, half, half * 0.7, half, half, half * 0.95)
  rimGrad.addColorStop(0, 'rgba(0,0,0,0)')
  rimGrad.addColorStop(0.6, 'rgba(0,0,0,0)')
  rimGrad.addColorStop(1, `rgba(${Math.floor(baseR * 0.5)},${Math.floor(baseG * 0.5)},${Math.floor(baseB * 0.5)},0.25)`)
  ctx.fillStyle = rimGrad
  ctx.fill()

  // Add some noise/grain for worn metal look
  const imageData = ctx.getImageData(0, 0, size, size)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12
    data[i] = Math.max(0, Math.min(255, data[i] + noise))
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise))
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise))
  }
  ctx.putImageData(imageData, 0, 0)

  return canvas
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
    return g
  }, [scene])

  // Create matcap texture from canvas
  const matcapTexture = useMemo(() => {
    let canvas: HTMLCanvasElement
    if (isCyan) {
      // Steel blue / navy metallic
      canvas = createMatcapCanvas(
        45, 90, 130,      // base: dark steel blue
        100, 170, 220,    // highlight: bright steel
      )
    } else {
      // Crimson / dark red metallic
      canvas = createMatcapCanvas(
        140, 30, 25,      // base: dark crimson
        210, 70, 55,      // highlight: bright red
      )
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [isCyan])

  // Matcap material — no lighting needed, all baked into the texture
  const material = useMemo(() => {
    return new THREE.MeshMatcapMaterial({
      matcap: matcapTexture,
    })
  }, [matcapTexture])

  // Hit flash material (white matcap)
  const flashMatcap = useMemo(() => {
    const canvas = createMatcapCanvas(200, 200, 200, 255, 255, 255)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return new THREE.MeshMatcapMaterial({ matcap: tex })
  }, [])

  const currentMat = useRef<THREE.Material>(material)

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

    // Hit flash: swap material
    if (meshRef.current) {
      if (animation === 'hit' && Math.sin(t * 20) > 0) {
        meshRef.current.material = flashMatcap
      } else {
        meshRef.current.material = material
      }
    }
  })

  if (!geometry) return null

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Main model with matcap material */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        castShadow
      />

      {/* Eye glows */}
      <mesh position={[-0.15, 0.28, 0.35]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0.15, 0.28, 0.35]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}
