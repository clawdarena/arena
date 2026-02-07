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

/**
 * GLB CrabBot with custom shader for multi-tone armor coloring.
 * Uses vertex position + normals to create:
 *   - Bright armor plates on outward-facing surfaces
 *   - Dark metallic joints in recesses / underside
 *   - Neon Fresnel rim glow on edges
 *   - Glowing eye accents
 * Inspired by weathered mech / power-armor aesthetic.
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

  const { scene } = useGLTF('/models/crabbot.glb')

  const geometry = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && !geo) {
        geo = (child as THREE.Mesh).geometry.clone()
      }
    })
    if (geo) {
      const g = geo as THREE.BufferGeometry
      g.computeVertexNormals()
      g.computeBoundingBox()
      const box = g.boundingBox!
      const center = new THREE.Vector3()
      box.getCenter(center)
      g.translate(-center.x, -center.y, -center.z)
    }
    return geo as unknown as THREE.BufferGeometry
  }, [scene])

  const isCyan = color.toLowerCase().includes('00f0ff') || color.toLowerCase().includes('0ff')

  // Custom shader material for elaborate mech coloring
  const shaderMat = useMemo(() => {
    // Color palette
    const armorPrimary = isCyan ? new THREE.Color('#2a5578') : new THREE.Color('#8b2020')
    const armorHighlight = isCyan ? new THREE.Color('#4a88b0') : new THREE.Color('#c04030')
    const armorDark = isCyan ? new THREE.Color('#0d1e2e') : new THREE.Color('#1a0808')
    const jointColor = new THREE.Color('#1a1a1a')
    const accentGlow = new THREE.Color(color)

    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHpPercent: { value: hpPercent },
        uArmorPrimary: { value: armorPrimary },
        uArmorHighlight: { value: armorHighlight },
        uArmorDark: { value: armorDark },
        uJointColor: { value: jointColor },
        uAccentGlow: { value: accentGlow },
        uHitFlash: { value: 0 },
        uSkillGlow: { value: 0 },
        // Lighting
        uLightDir: { value: new THREE.Vector3(0.5, 1, 0.3).normalize() },
        uLightDir2: { value: new THREE.Vector3(-0.3, 0.5, -0.5).normalize() },
        uViewPos: { value: new THREE.Vector3(0, 1.2, 4) },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPos;
        varying vec3 vViewDir;
        
        uniform vec3 uViewPos;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          vViewDir = normalize(uViewPos - worldPos.xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPos;
        varying vec3 vViewDir;
        
        uniform float uTime;
        uniform float uHpPercent;
        uniform float uHitFlash;
        uniform float uSkillGlow;
        uniform vec3 uArmorPrimary;
        uniform vec3 uArmorHighlight;
        uniform vec3 uArmorDark;
        uniform vec3 uJointColor;
        uniform vec3 uAccentGlow;
        uniform vec3 uLightDir;
        uniform vec3 uLightDir2;
        
        // Simple hash noise
        float hash(vec3 p) {
          p = fract(p * vec3(443.897, 441.423, 437.195));
          p += dot(p, p.yzx + 19.19);
          return fract((p.x + p.y) * p.z);
        }
        
        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(vViewDir);
          
          // === ZONE CLASSIFICATION via position + normal ===
          
          // Height factor: 0 = bottom, 1 = top
          float heightFactor = smoothstep(-1.0, 1.0, vPosition.y);
          
          // Outward-facing factor: how much the normal points outward/upward
          float outward = dot(N, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
          
          // Curvature approximation: steep normals = joints/recesses
          float steepness = 1.0 - abs(N.y);
          
          // Ridge detection: sharp angle changes suggest armor plate edges
          float ridge = pow(abs(fract(vPosition.y * 8.0) - 0.5) * 2.0, 4.0);
          float ridgeX = pow(abs(fract(vPosition.x * 6.0) - 0.5) * 2.0, 4.0);
          
          // === BASE COLOR MIXING ===
          
          // Start with primary armor
          vec3 baseColor = uArmorPrimary;
          
          // Top surfaces get highlight color (armor plates facing up/out)
          baseColor = mix(baseColor, uArmorHighlight, outward * 0.6 * heightFactor);
          
          // Underside and steep recesses get dark joint color
          float jointMask = smoothstep(0.3, 0.7, steepness) * (1.0 - heightFactor * 0.5);
          baseColor = mix(baseColor, uJointColor, jointMask * 0.7);
          
          // Lower body darker
          baseColor = mix(baseColor, uArmorDark, smoothstep(0.4, 0.0, heightFactor) * 0.6);
          
          // Add variation / weathering noise
          float noise = hash(vPosition * 15.0);
          float weathering = noise * 0.12;
          baseColor *= (1.0 - weathering);
          
          // Subtle scratches / wear on outward faces
          float scratch = hash(vPosition * 80.0);
          if (scratch > 0.92 && outward > 0.4) {
            baseColor = mix(baseColor, uArmorHighlight * 1.3, 0.3);
          }
          
          // Dark panel lines at ridges
          float panelLine = max(ridge, ridgeX) * steepness;
          baseColor = mix(baseColor, uJointColor, panelLine * 0.4);
          
          // === LIGHTING (PBR-ish) ===
          
          // Diffuse
          float NdotL = max(dot(N, uLightDir), 0.0);
          float NdotL2 = max(dot(N, uLightDir2), 0.0);
          float diffuse = NdotL * 0.7 + NdotL2 * 0.25 + 0.15; // ambient
          
          // Specular (Blinn-Phong, metallic)
          vec3 H = normalize(uLightDir + V);
          float NdotH = max(dot(N, H), 0.0);
          float spec = pow(NdotH, 40.0) * 0.5;
          
          vec3 H2 = normalize(uLightDir2 + V);
          float NdotH2 = max(dot(N, H2), 0.0);
          float spec2 = pow(NdotH2, 30.0) * 0.2;
          
          // Metallic reflection tints specular with base color
          vec3 specColor = mix(vec3(1.0), baseColor * 1.5, 0.7);
          
          // === FRESNEL RIM GLOW (neon accent on edges) ===
          float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
          float rimGlow = fresnel * (0.4 + uHpPercent * 0.6);
          // Pulse the rim glow subtly
          rimGlow *= 0.8 + sin(uTime * 2.0) * 0.2;
          
          // === ACCENT GLOW LINES (seam-like neon in recesses) ===
          float seamGlow = 0.0;
          // Horizontal seams
          float seam1 = smoothstep(0.02, 0.0, abs(fract(vPosition.y * 5.0) - 0.5) - 0.47);
          // Vertical seams
          float seam2 = smoothstep(0.02, 0.0, abs(fract(vPosition.x * 4.0 + vPosition.z * 4.0) - 0.5) - 0.47);
          seamGlow = max(seam1, seam2) * jointMask * 0.6;
          seamGlow *= 0.7 + sin(uTime * 3.0 + vPosition.y * 10.0) * 0.3;
          
          // === COMPOSITE ===
          vec3 finalColor = baseColor * diffuse;
          finalColor += specColor * (spec + spec2);
          finalColor += uAccentGlow * rimGlow * 0.5;
          finalColor += uAccentGlow * seamGlow;
          
          // Hit flash: white flash overlay
          finalColor = mix(finalColor, vec3(1.0, 0.9, 0.8), uHitFlash * 0.7);
          
          // Skill glow: boost accent color
          finalColor += uAccentGlow * uSkillGlow * 0.4;
          
          // Tone mapping (simple Reinhard)
          finalColor = finalColor / (finalColor + vec3(1.0));
          
          // Slight desaturation in dark areas for gritty look
          float lum = dot(finalColor, vec3(0.299, 0.587, 0.114));
          finalColor = mix(vec3(lum), finalColor, 0.85 + heightFactor * 0.15);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    })
  }, [color, isCyan, hpPercent])

  // Animation loop
  useFrame((state, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    if (!groupRef.current) return
    const g = groupRef.current

    // Update shader uniforms
    if (shaderMat) {
      shaderMat.uniforms.uTime.value = t
      shaderMat.uniforms.uHpPercent.value = hpPercent
      shaderMat.uniforms.uViewPos.value.copy(state.camera.position)
    }

    if (animation === 'idle') {
      g.position.y = position[1] + Math.sin(t * 2) * 0.04
      g.rotation.z = Math.sin(t * 1.5) * 0.015
      g.rotation.x = rotation[0] + Math.sin(t * 1.2) * 0.008
      g.position.x = position[0]
      g.position.z = position[2]
      g.rotation.y = rotation[1]
      if (shaderMat) {
        shaderMat.uniforms.uHitFlash.value = 0
        shaderMat.uniforms.uSkillGlow.value = 0
      }
    } else if (animation === 'attack') {
      const phase = (t * 5) % (Math.PI * 2)
      const lunge = Math.sin(phase) * 0.3
      g.position.z = position[2] + (side === 'left' ? lunge : -lunge)
      g.position.y = position[1] + Math.abs(Math.sin(phase)) * 0.05
      g.rotation.z = Math.sin(phase) * 0.08
      if (shaderMat) {
        shaderMat.uniforms.uHitFlash.value = 0
        shaderMat.uniforms.uSkillGlow.value = 0
      }
    } else if (animation === 'defend') {
      g.position.y = position[1] - 0.06
      g.rotation.x = rotation[0] + 0.12
      g.position.x = position[0]
      g.position.z = position[2]
      if (shaderMat) {
        shaderMat.uniforms.uHitFlash.value = 0
        shaderMat.uniforms.uSkillGlow.value = 0
      }
    } else if (animation === 'skill') {
      g.rotation.y = rotation[1] + t * 3
      g.position.y = position[1] + Math.sin(t * 4) * 0.08
      if (shaderMat) {
        shaderMat.uniforms.uHitFlash.value = 0
        shaderMat.uniforms.uSkillGlow.value = 0.5 + Math.sin(t * 6) * 0.5
      }
    } else if (animation === 'hit') {
      g.position.x = position[0] + (Math.random() - 0.5) * 0.1
      g.position.y = position[1] + (Math.random() - 0.5) * 0.05
      if (shaderMat) {
        shaderMat.uniforms.uHitFlash.value = Math.sin(t * 20) > 0 ? 1 : 0
        shaderMat.uniforms.uSkillGlow.value = 0
      }
    } else if (animation === 'death') {
      g.rotation.z = Math.min(t * 0.5, Math.PI / 3)
      g.position.y = position[1] - Math.min(t * 0.2, 0.3)
      if (shaderMat) {
        shaderMat.uniforms.uHitFlash.value = 0
        shaderMat.uniforms.uSkillGlow.value = 0
      }
    }
  })

  const glowColor = useMemo(() => new THREE.Color(color), [color])

  if (!geometry) return null

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Main model with custom shader */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={shaderMat}
        castShadow
        receiveShadow
      />

      {/* Accent point light */}
      <pointLight
        color={glowColor}
        intensity={0.5 + hpPercent * 0.5}
        distance={2.5}
        decay={2}
        position={[0, 0.3, 0]}
      />

      {/* Eye glow spots */}
      <mesh position={[-0.15, 0.3, 0.35]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.0}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.15, 0.3, 0.35]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.0}
          toneMapped={false}
        />
      </mesh>

      {/* Under-glow disc */}
      <mesh position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
