/**
 * Frontend skill metadata aligned with backend Combat V2 definitions.
 */

export type SkillCategory = 'defensive' | 'aggressive' | 'tactical' | 'exploit'

export interface SkillData {
  id: string
  name: string
  category: SkillCategory
  description: string
  energyCost: number
  cooldown: number
  unlockLevel: number
  price: number
  icon: string
}

// AUDIT FIX: Keep frontend skill stats synchronized with backend SKILL_DEFS
export const ALL_SKILLS: SkillData[] = [
  { id: 'firewall', name: 'Firewall', category: 'defensive', description: 'Block next incoming attack.', energyCost: 15, cooldown: 3, unlockLevel: 1, price: 0, icon: '🛡️' },
  { id: 'iron_fortress', name: 'Iron Fortress', category: 'defensive', description: '+80% defense for 2 rounds; cannot attack.', energyCost: 20, cooldown: 5, unlockLevel: 10, price: 500, icon: '🏰' },
  { id: 'mirror_coat', name: 'Mirror Coat', category: 'defensive', description: 'Reflect a portion of incoming damage.', energyCost: 25, cooldown: 5, unlockLevel: 7, price: 800, icon: '🪞' },
  { id: 'rollback', name: 'Rollback', category: 'defensive', description: 'Restore HP based on defense/max HP.', energyCost: 20, cooldown: 4, unlockLevel: 3, price: 600, icon: '⏪' },

  { id: 'power_strike', name: 'Power Strike', category: 'aggressive', description: 'Reliable direct damage.', energyCost: 10, cooldown: 2, unlockLevel: 1, price: 0, icon: '⚔️' },
  { id: 'reasoning_burst', name: 'Reasoning Burst', category: 'aggressive', description: 'High speed-scaling burst damage.', energyCost: 30, cooldown: 4, unlockLevel: 3, price: 700, icon: '🧠' },
  { id: 'spawn_attack', name: 'Spawn Attack', category: 'aggressive', description: 'Multi-hit attack that can break shields.', energyCost: 20, cooldown: 3, unlockLevel: 5, price: 900, icon: '👻' },
  { id: 'berserker_rush', name: 'Berserker Rush', category: 'aggressive', description: 'Heavy strike with self-damage drawback.', energyCost: 15, cooldown: 3, unlockLevel: 13, price: 1400, icon: '💢' },

  { id: 'sleep_bomb', name: 'Sleep Bomb', category: 'tactical', description: 'Chance to force opponent to skip turn.', energyCost: 20, cooldown: 4, unlockLevel: 1, price: 0, icon: '💤' },
  { id: 'emp_pulse', name: 'EMP Pulse', category: 'tactical', description: 'Drain opponent energy.', energyCost: 15, cooldown: 3, unlockLevel: 5, price: 600, icon: '⚡' },
  { id: 'time_bomb', name: 'Time Bomb', category: 'tactical', description: 'Plant delayed explosive damage.', energyCost: 20, cooldown: 5, unlockLevel: 7, price: 1000, icon: '💣' },
  { id: 'overclock', name: 'Overclock', category: 'tactical', description: 'Empower your next attack.', energyCost: 10, cooldown: 4, unlockLevel: 10, price: 1200, icon: '🔥' },

  { id: 'scan', name: 'Scan', category: 'exploit', description: 'Apply scan debuff and reveal info.', energyCost: 15, cooldown: 5, unlockLevel: 1, price: 0, icon: '🔍' },
  { id: 'prompt_injection', name: 'Prompt Injection', category: 'exploit', description: 'Chance to confuse opponent.', energyCost: 25, cooldown: 5, unlockLevel: 16, price: 1500, icon: '💉' },
  { id: 'memory_bomb', name: 'Memory Bomb', category: 'exploit', description: 'Disable opponent last used skill.', energyCost: 20, cooldown: 5, unlockLevel: 16, price: 1500, icon: '💾' },
  { id: 'virus', name: 'Virus', category: 'exploit', description: 'Apply damage-over-time infection.', energyCost: 15, cooldown: 4, unlockLevel: 13, price: 1300, icon: '🦠' },
]

export const SKILLS_BY_ID: Record<string, SkillData> = Object.fromEntries(ALL_SKILLS.map((s) => [s.id, s]))

export const SKILLS_BY_CATEGORY: Record<SkillCategory, SkillData[]> = {
  defensive: ALL_SKILLS.filter((s) => s.category === 'defensive'),
  aggressive: ALL_SKILLS.filter((s) => s.category === 'aggressive'),
  tactical: ALL_SKILLS.filter((s) => s.category === 'tactical'),
  exploit: ALL_SKILLS.filter((s) => s.category === 'exploit'),
}

export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  defensive: 'Defensive',
  aggressive: 'Aggressive',
  tactical: 'Tactical',
  exploit: 'Exploit',
}

export const CATEGORY_COLORS: Record<SkillCategory, string> = {
  defensive: 'text-cyan-400',
  aggressive: 'text-red-400',
  tactical: 'text-amber-400',
  exploit: 'text-purple-400',
}

export const CATEGORY_BORDER_COLORS: Record<SkillCategory, string> = {
  defensive: 'border-cyan-600/50 hover:border-cyan-500',
  aggressive: 'border-red-600/50 hover:border-red-500',
  tactical: 'border-amber-600/50 hover:border-amber-500',
  exploit: 'border-purple-600/50 hover:border-purple-500',
}

export const CATEGORY_BG_COLORS: Record<SkillCategory, string> = {
  defensive: 'bg-cyan-900/20',
  aggressive: 'bg-red-900/20',
  tactical: 'bg-amber-900/20',
  exploit: 'bg-purple-900/20',
}
