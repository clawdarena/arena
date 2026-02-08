'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { CrabBot } from './CrabBot'
import * as THREE from 'three'

// ============================================================
// Slow auto-rotating wrapper
// ============================================================

function AutoRotate({ children, speed = 0.3 }: { children: React.ReactNode; speed?: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * speed
    }
  })
  return <group ref={ref}>{children}</group>
}

// ============================================================
// Mini 3D Preview — used in shop cards
// ============================================================

export function SkinPreviewMini({ color, size = 120 }: { color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="mx-auto">
      <Canvas
        camera={{ position: [0, 0.3, 2.2], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[3, 3, 3]} intensity={1} />
          <AutoRotate speed={0.4}>
            <CrabBot color={color} scale={1} animation="idle" />
          </AutoRotate>
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  )
}

// ============================================================
// Full Preview — used in modal
// ============================================================

export function SkinPreviewFull({ color }: { color: string }) {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 3], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} />
        <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#88aaff" />
        <AutoRotate speed={0.25}>
          <CrabBot color={color} scale={1.2} animation="idle" />
        </AutoRotate>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  )
}
