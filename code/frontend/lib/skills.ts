/**
 * V2 Skills - Complete catalog of all 16 skills in ClawdArena
 * Categories: Defensive, Aggressive, Tactical, Exploit
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

export const ALL_SKILLS: SkillData[] = [
  // === DEFENSIVE ===
  {
    id: 'firewall',
    name: 'Firewall',
    category: 'defensive',
    description: 'Summon a hexagonal shield that blocks the next attack completely.',
    energyCost: 20,
    cooldown: 3,
    unlockLevel: 1,
    price: 0, // Starter skill
    icon: '🛡️',
  },
  {
    id: 'iron_fortress',
    name: 'Iron Fortress',
    category: 'defensive',
    description: 'Become an immovable fortress: +80% DEF but cannot attack for 2 turns.',
    energyCost: 25,
    cooldown: 4,
    unlockLevel: 5,
    price: 500,
    icon: '🏰',
  },
  {
    id: 'mirror_coat',
    name: 'Mirror Coat',
    category: 'defensive',
    description: 'Reflect 50% of incoming damage back at the attacker.',
    energyCost: 30,
    cooldown: 4,
    unlockLevel: 8,
    price: 800,
    icon: '🪞',
  },
  {
    id: 'rollback',
    name: 'Rollback',
    category: 'defensive',
    description: 'Time reversal: restore 25 HP and reset one negative status effect.',
    energyCost: 35,
    cooldown: 5,
    unlockLevel: 12,
    price: 1200,
    icon: '⏪',
  },

  // === AGGRESSIVE ===
  {
    id: 'power_strike',
    name: 'Power Strike',
    category: 'aggressive',
    description: 'Enhanced claw attack with 1.5x damage and energy trail effect.',
    energyCost: 15,
    cooldown: 2,
    unlockLevel: 1,
    price: 0, // Starter skill
    icon: '⚔️',
  },
  {
    id: 'reasoning_burst',
    name: 'Reasoning Burst',
    category: 'aggressive',
    description: 'Unleash neural lightning: heavy damage + 20% chance to confuse opponent.',
    energyCost: 35,
    cooldown: 4,
    unlockLevel: 6,
    price: 600,
    icon: '🧠',
  },
  {
    id: 'spawn_attack',
    name: 'Spawn Attack',
    category: 'aggressive',
    description: 'Split into 3 ghost copies that attack simultaneously for 2.5x damage.',
    energyCost: 40,
    cooldown: 5,
    unlockLevel: 10,
    price: 1000,
    icon: '👻',
  },
  {
    id: 'berserker_rush',
    name: 'Berserker Rush',
    category: 'aggressive',
    description: 'Go berserk: +8 ATK but -3 DEF for 3 turns. High risk, high reward.',
    energyCost: 30,
    cooldown: 6,
    unlockLevel: 15,
    price: 1500,
    icon: '💢',
  },

  // === TACTICAL ===
  {
    id: 'sleep_bomb',
    name: 'Sleep Bomb',
    category: 'tactical',
    description: 'Toss a sleep grenade: opponent skips their next turn.',
    energyCost: 25,
    cooldown: 5,
    unlockLevel: 3,
    price: 300,
    icon: '💤',
  },
  {
    id: 'emp_pulse',
    name: 'EMP Pulse',
    category: 'tactical',
    description: 'Electromagnetic surge: disable one random opponent skill for 2 turns.',
    energyCost: 30,
    cooldown: 5,
    unlockLevel: 7,
    price: 700,
    icon: '⚡',
  },
  {
    id: 'time_bomb',
    name: 'Time Bomb',
    category: 'tactical',
    description: 'Plant a ticking bomb: explodes after 2 rounds for massive damage.',
    energyCost: 35,
    cooldown: 6,
    unlockLevel: 11,
    price: 1100,
    icon: '💣',
  },
  {
    id: 'overclock',
    name: 'Overclock',
    category: 'tactical',
    description: 'Push systems to the limit: +3 ATK, +3 SPD for 2 turns, then -10 HP.',
    energyCost: 25,
    cooldown: 4,
    unlockLevel: 14,
    price: 1400,
    icon: '🔥',
  },

  // === EXPLOIT ===
  {
    id: 'scan',
    name: 'Scan',
    category: 'exploit',
    description: 'Reveal opponent stats and their next planned move.',
    energyCost: 10,
    cooldown: 3,
    unlockLevel: 1,
    price: 0, // Starter skill
    icon: '🔍',
  },
  {
    id: 'prompt_injection',
    name: 'Prompt Injection',
    category: 'exploit',
    description: 'Glitch the opponent system: 30% chance to make them attack themselves.',
    energyCost: 20,
    cooldown: 4,
    unlockLevel: 4,
    price: 400,
    icon: '💉',
  },
  {
    id: 'memory_bomb',
    name: 'Memory Bomb',
    category: 'exploit',
    description: 'Data explosion: disable one random opponent skill for 3 turns.',
    energyCost: 25,
    cooldown: 5,
    unlockLevel: 9,
    price: 900,
    icon: '💾',
  },
  {
    id: 'virus',
    name: 'Virus',
    category: 'exploit',
    description: 'Infect with malware: deal 5 damage per turn for 4 turns (20 total).',
    energyCost: 30,
    cooldown: 6,
    unlockLevel: 13,
    price: 1300,
    icon: '🦠',
  },
]

export const SKILLS_BY_ID: Record<string, SkillData> = Object.fromEntries(
  ALL_SKILLS.map((s) => [s.id, s])
)

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
