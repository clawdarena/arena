'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  PokemonHitEffect,
  PowerStrikeEffect,
  SpawnAttackEffect,
  MemoryBombEffect,
  TimeBombEffect,
  ReasoningBurstEffect,
  StackOverflowEffect,
  ToolOverloadEffect,
  RecursiveLoopEffect,
  MirrorMatchEffect,
  PromptInjectionEffect,
  IdentityCrisisEffect,
  FirewallEffect,
  RollbackEffect,
  ScanEffect,
  BurningEffect,
  StunnedEffect,
  ShieldedEffect,
  OverclockedEffect,
  PoisonedEffect,
} from './AttackEffects'

// ============================================================
// Types
// ============================================================

export type AttackAnimationKey =
  | 'power_strike'
  | 'spawn_attack'
  | 'memory_bomb'
  | 'time_bomb'
  | 'reasoning_burst'
  | 'stack_overflow'
  | 'tool_overload'
  | 'recursive_loop'
  | 'mirror_match'
  | 'prompt_injection'
  | 'identity_crisis'
  | 'firewall'
  | 'rollback'
  | 'scan'
  | 'basic_attack'
  | 'basic_defend'

export interface AttackAnimationRequest {
  /** Which attack to animate */
  attackKey: AttackAnimationKey
  /** 'bot1' attacks or 'bot2' attacks */
  attacker: 'bot1' | 'bot2'
  /** Damage dealt (for hit effect intensity) */
  damage: number
  /** Was it a super effective counter? */
  superEffective?: boolean
  /** Was it a critical/momentum hit? */
  critical?: boolean
}

export interface StatusEffectVisual {
  bot: 'bot1' | 'bot2'
  effect: 'burning' | 'stunned' | 'shielded' | 'overclocked' | 'poisoned'
}

interface AttackAnimatorProps {
  /** Position of bot1 (left) */
  bot1Position: [number, number, number]
  /** Position of bot2 (right) */
  bot2Position: [number, number, number]
  /** Current attack animation to play (null = none) */
  currentAnimation: AttackAnimationRequest | null
  /** Called when the full animation sequence is done */
  onAnimationComplete?: () => void
  /** Active status effects to render persistently */
  statusEffects?: StatusEffectVisual[]
}

type AnimPhase = 'idle' | 'attack_effect' | 'hit_effect' | 'done'

/**
 * Orchestrates attack animation sequences:
 * 1. Attack effect plays (projectile, beam, etc.)
 * 2. Hit effect on defender (Pokemon-style flash/shake)
 * 3. After-effect / status lingers
 */
export function AttackAnimator({
  bot1Position,
  bot2Position,
  currentAnimation,
  onAnimationComplete,
  statusEffects = [],
}: AttackAnimatorProps) {
  const [phase, setPhase] = useState<AnimPhase>('idle')
  const [activeAnim, setActiveAnim] = useState<AttackAnimationRequest | null>(null)
  const lastAnimRef = useRef<AttackAnimationRequest | null>(null)

  // When a new animation request comes in, start the sequence
  useEffect(() => {
    if (currentAnimation && currentAnimation !== lastAnimRef.current) {
      lastAnimRef.current = currentAnimation
      setActiveAnim(currentAnimation)
      setPhase('attack_effect')
    }
  }, [currentAnimation])

  const onAttackEffectComplete = useCallback(() => {
    setPhase('hit_effect')
  }, [])

  const onHitEffectComplete = useCallback(() => {
    setPhase('done')
    setActiveAnim(null)
    setPhase('idle')
    onAnimationComplete?.()
  }, [onAnimationComplete])

  // Determine positions based on attacker
  const attackerPos = activeAnim?.attacker === 'bot2' ? bot2Position : bot1Position
  const defenderPos = activeAnim?.attacker === 'bot2' ? bot1Position : bot2Position

  return (
    <group>
      {/* === Attack Effect Phase === */}
      {phase === 'attack_effect' && activeAnim && (
        <AttackEffectRenderer
          attackKey={activeAnim.attackKey}
          from={attackerPos}
          to={defenderPos}
          attacker={activeAnim.attacker}
          onComplete={onAttackEffectComplete}
        />
      )}

      {/* === Hit Effect Phase === */}
      {phase === 'hit_effect' && activeAnim && (
        <PokemonHitEffect
          position={defenderPos}
          intensity={Math.min(2, (activeAnim.damage || 10) / 20)}
          superEffective={activeAnim.superEffective}
          critical={activeAnim.critical}
          onComplete={onHitEffectComplete}
        />
      )}

      {/* === Persistent Status Effects === */}
      {statusEffects.map((se, i) => {
        const pos = se.bot === 'bot1' ? bot1Position : bot2Position
        return (
          <StatusEffectRenderer
            key={`${se.bot}-${se.effect}-${i}`}
            effect={se.effect}
            position={pos}
          />
        )
      })}
    </group>
  )
}

// ============================================================
// Attack Effect Renderer — picks the right effect component
// ============================================================

function AttackEffectRenderer({
  attackKey,
  from,
  to,
  attacker,
  onComplete,
}: {
  attackKey: AttackAnimationKey
  from: [number, number, number]
  to: [number, number, number]
  attacker: 'bot1' | 'bot2'
  onComplete: () => void
}) {
  const midpoint: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2,
  ]

  switch (attackKey) {
    case 'power_strike':
      return <PowerStrikeEffect from={from} to={to} onComplete={onComplete} />

    case 'spawn_attack':
      return (
        <SpawnAttackEffect
          from={from}
          to={to}
          color={attacker === 'bot1' ? '#00f0ff' : '#ff4040'}
          onComplete={onComplete}
        />
      )

    case 'memory_bomb':
      return <MemoryBombEffect target={to} onComplete={onComplete} />

    case 'time_bomb':
      return <TimeBombEffect target={to} onComplete={onComplete} />

    case 'reasoning_burst':
      return <ReasoningBurstEffect from={from} to={to} onComplete={onComplete} />

    case 'stack_overflow':
      return <StackOverflowEffect target={to} onComplete={onComplete} />

    case 'tool_overload':
      return <ToolOverloadEffect target={to} onComplete={onComplete} />

    case 'recursive_loop':
      return <RecursiveLoopEffect target={to} onComplete={onComplete} />

    case 'mirror_match':
      return <MirrorMatchEffect position={midpoint} onComplete={onComplete} />

    case 'prompt_injection':
      return <PromptInjectionEffect target={to} onComplete={onComplete} />

    case 'identity_crisis':
      return <IdentityCrisisEffect target={to} onComplete={onComplete} />

    case 'firewall':
      return <FirewallEffect position={from} onComplete={onComplete} />

    case 'rollback':
      return <RollbackEffect position={from} onComplete={onComplete} />

    case 'scan':
      return <ScanEffect target={to} onComplete={onComplete} />

    case 'basic_attack':
      return <PowerStrikeEffect from={from} to={to} onComplete={onComplete} />

    case 'basic_defend':
      return <FirewallEffect position={from} onComplete={onComplete} />

    default:
      // Fallback — generic projectile
      return <PowerStrikeEffect from={from} to={to} onComplete={onComplete} />
  }
}

// ============================================================
// Status Effect Renderer
// ============================================================

function StatusEffectRenderer({
  effect,
  position,
}: {
  effect: string
  position: [number, number, number]
}) {
  switch (effect) {
    case 'burning':
      return <BurningEffect position={position} />
    case 'stunned':
      return <StunnedEffect position={position} />
    case 'shielded':
    case 'iron_fortress':
      return <ShieldedEffect position={position} />
    case 'overclocked':
    case 'overclock':
      return <OverclockedEffect position={position} />
    case 'poisoned':
    case 'armor_broken':
      return <PoisonedEffect position={position} />
    default:
      return null
  }
}
