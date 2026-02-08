/**
 * Move data for the combat system.
 * Each move has a unique animation key, category, energy cost, and description.
 */

export type MoveCategory = 'aggressive' | 'defensive' | 'tactical' | 'exploit'

export interface Move {
  id: string
  name: string
  category: MoveCategory
  energyCost: number
  description: string
  animationKey: string
  /** Base action type sent to server */
  actionType: 'attack' | 'defend' | 'skill'
  /** Skill ID if this maps to a backend skill */
  skillId?: string
}

export const MOVES: Move[] = [
  // === Aggressive ===
  {
    id: 'power_strike',
    name: 'Power Strike',
    category: 'aggressive',
    energyCost: 15,
    description: 'Enhanced punch — claw glows bright, slashes forward with energy trail.',
    animationKey: 'power_strike',
    actionType: 'skill',
    skillId: 'power_strike',
  },
  {
    id: 'spawn_attack',
    name: 'Spawn Attack',
    category: 'aggressive',
    energyCost: 40,
    description: 'Bot splits into 3 ghost copies that all attack simultaneously.',
    animationKey: 'spawn_attack',
    actionType: 'attack',
  },
  {
    id: 'reasoning_burst',
    name: 'Reasoning Burst',
    category: 'aggressive',
    energyCost: 35,
    description: 'Neural network lightning erupts — massive beam of energy hits opponent.',
    animationKey: 'reasoning_burst',
    actionType: 'attack',
  },
  {
    id: 'stack_overflow',
    name: 'Stack Overflow',
    category: 'aggressive',
    energyCost: 45,
    description: 'Text/code characters cascade and overflow, burying the opponent.',
    animationKey: 'stack_overflow',
    actionType: 'attack',
  },

  // === Defensive ===
  {
    id: 'firewall',
    name: 'Firewall',
    category: 'defensive',
    energyCost: 20,
    description: 'Hexagonal shield wall materializes. Glows when hit.',
    animationKey: 'firewall',
    actionType: 'defend',
  },
  {
    id: 'rollback',
    name: 'Rollback',
    category: 'defensive',
    energyCost: 30,
    description: 'Rewind effect — visual time reversal, HP ticks back up.',
    animationKey: 'rollback',
    actionType: 'defend',
  },

  // === Tactical ===
  {
    id: 'time_bomb',
    name: 'Time Bomb',
    category: 'tactical',
    energyCost: 25,
    description: 'Places a glowing ticking orb that explodes with a shockwave after 2 rounds.',
    animationKey: 'time_bomb',
    actionType: 'attack',
  },
  {
    id: 'tool_overload',
    name: 'Tool Overload',
    category: 'tactical',
    energyCost: 30,
    description: 'Gears and tools materialize, spin around opponent, then crash in sparks.',
    animationKey: 'tool_overload',
    actionType: 'attack',
  },
  {
    id: 'mirror_match',
    name: 'Mirror Match',
    category: 'tactical',
    energyCost: 15,
    description: "Reflective mirror wall copies opponent's last move back at them.",
    animationKey: 'mirror_match',
    actionType: 'defend',
  },

  // === Exploit ===
  {
    id: 'memory_bomb',
    name: 'Memory Bomb',
    category: 'exploit',
    energyCost: 10,
    description: 'Digital data fragments rain down like a data explosion. Purple/pink particles.',
    animationKey: 'memory_bomb',
    actionType: 'skill',
  },
  {
    id: 'recursive_loop',
    name: 'Recursive Loop',
    category: 'exploit',
    energyCost: 25,
    description: 'Spiral vortex traps opponent in a loop. Dizziness stars after.',
    animationKey: 'recursive_loop',
    actionType: 'skill',
  },
  {
    id: 'prompt_injection',
    name: 'Prompt Injection',
    category: 'exploit',
    energyCost: 15,
    description: 'Glitchy matrix-style text injection. Screen glitches, opponent flickers.',
    animationKey: 'prompt_injection',
    actionType: 'skill',
  },
  {
    id: 'identity_crisis',
    name: 'Identity Crisis',
    category: 'exploit',
    energyCost: 20,
    description: "Opponent's colors scramble/invert. Confusion stars and question marks.",
    animationKey: 'identity_crisis',
    actionType: 'skill',
  },
  {
    id: 'scan',
    name: 'Scan',
    category: 'exploit',
    energyCost: 10,
    description: 'Scanning beam sweeps over opponent, revealing holographic stats.',
    animationKey: 'scan',
    actionType: 'skill',
    skillId: 'scan',
  },
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
