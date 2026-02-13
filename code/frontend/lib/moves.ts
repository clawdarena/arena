/**
 * Combat move metadata for UI rendering.
 */

export type MoveCategory = 'aggressive' | 'defensive' | 'tactical' | 'exploit'

export interface Move {
  id: string
  name: string
  category: MoveCategory
  energyCost: number
  description: string
  animationKey: string
  actionType: 'attack' | 'defend' | 'skill'
  skillId?: string
}

// AUDIT FIX: Align move catalog and energy costs with backend skill definitions
export const MOVES: Move[] = [
  { id: 'power_strike', name: 'Power Strike', category: 'aggressive', energyCost: 10, description: 'Reliable burst damage.', animationKey: 'power_strike', actionType: 'skill', skillId: 'power_strike' },
  { id: 'reasoning_burst', name: 'Reasoning Burst', category: 'aggressive', energyCost: 30, description: 'High speed-scaling burst.', animationKey: 'reasoning_burst', actionType: 'skill', skillId: 'reasoning_burst' },
  { id: 'spawn_attack', name: 'Spawn Attack', category: 'aggressive', energyCost: 20, description: 'Multi-hit attack.', animationKey: 'spawn_attack', actionType: 'skill', skillId: 'spawn_attack' },
  { id: 'berserker_rush', name: 'Berserker Rush', category: 'aggressive', energyCost: 15, description: 'Heavy strike with recoil.', animationKey: 'berserker_rush', actionType: 'skill', skillId: 'berserker_rush' },

  { id: 'firewall', name: 'Firewall', category: 'defensive', energyCost: 15, description: 'Blocks next incoming hit.', animationKey: 'firewall', actionType: 'skill', skillId: 'firewall' },
  { id: 'iron_fortress', name: 'Iron Fortress', category: 'defensive', energyCost: 20, description: 'Boost defense, can’t attack.', animationKey: 'iron_fortress', actionType: 'skill', skillId: 'iron_fortress' },
  { id: 'mirror_coat', name: 'Mirror Coat', category: 'defensive', energyCost: 25, description: 'Reflect incoming damage.', animationKey: 'mirror_coat', actionType: 'skill', skillId: 'mirror_coat' },
  { id: 'rollback', name: 'Rollback', category: 'defensive', energyCost: 20, description: 'Restore health.', animationKey: 'rollback', actionType: 'skill', skillId: 'rollback' },

  { id: 'sleep_bomb', name: 'Sleep Bomb', category: 'tactical', energyCost: 20, description: 'Chance to force defend.', animationKey: 'sleep_bomb', actionType: 'skill', skillId: 'sleep_bomb' },
  { id: 'emp_pulse', name: 'EMP Pulse', category: 'tactical', energyCost: 15, description: 'Drain opponent energy.', animationKey: 'emp_pulse', actionType: 'skill', skillId: 'emp_pulse' },
  { id: 'time_bomb', name: 'Time Bomb', category: 'tactical', energyCost: 20, description: 'Delayed explosive damage.', animationKey: 'time_bomb', actionType: 'skill', skillId: 'time_bomb' },
  { id: 'overclock', name: 'Overclock', category: 'tactical', energyCost: 10, description: 'Buff next attack.', animationKey: 'overclock', actionType: 'skill', skillId: 'overclock' },

  { id: 'scan', name: 'Scan', category: 'exploit', energyCost: 15, description: 'Apply scan debuff.', animationKey: 'scan', actionType: 'skill', skillId: 'scan' },
  { id: 'prompt_injection', name: 'Prompt Injection', category: 'exploit', energyCost: 25, description: 'Chance to confuse opponent.', animationKey: 'prompt_injection', actionType: 'skill', skillId: 'prompt_injection' },
  { id: 'memory_bomb', name: 'Memory Bomb', category: 'exploit', energyCost: 20, description: 'Disable opponent last skill.', animationKey: 'memory_bomb', actionType: 'skill', skillId: 'memory_bomb' },
  { id: 'virus', name: 'Virus', category: 'exploit', energyCost: 15, description: 'Apply damage over time.', animationKey: 'virus', actionType: 'skill', skillId: 'virus' },
]

export const MOVES_BY_ID: Record<string, Move> = Object.fromEntries(
  MOVES.map((m) => [m.id, m])
)

export function getCategoryIcon(category: MoveCategory): string {
  switch (category) {
    case 'aggressive': return '⚔️'
    case 'defensive': return '🛡️'
    case 'tactical': return '⚙️'
    case 'exploit': return '💉'
  }
}

export function getCategoryColor(category: MoveCategory): string {
  switch (category) {
    case 'aggressive': return 'text-red-400'
    case 'defensive': return 'text-cyan-400'
    case 'tactical': return 'text-amber-400'
    case 'exploit': return 'text-purple-400'
  }
}

export function getCategoryBorderColor(category: MoveCategory): string {
  switch (category) {
    case 'aggressive': return 'border-red-600/50 hover:border-red-500'
    case 'defensive': return 'border-cyan-600/50 hover:border-cyan-500'
    case 'tactical': return 'border-amber-600/50 hover:border-amber-500'
    case 'exploit': return 'border-purple-600/50 hover:border-purple-500'
  }
}

export function getCategoryBgColor(category: MoveCategory): string {
  switch (category) {
    case 'aggressive': return 'bg-red-900/20 hover:bg-red-900/40'
    case 'defensive': return 'bg-cyan-900/20 hover:bg-cyan-900/40'
    case 'tactical': return 'bg-amber-900/20 hover:bg-amber-900/40'
    case 'exploit': return 'bg-purple-900/20 hover:bg-purple-900/40'
  }
}
