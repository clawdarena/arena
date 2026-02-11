// Extended types for Tag Team Combat System

export interface BotSuggestion {
  suggestionId: string
  skillId: string
  skillName: string
  emoji: string
  confidence: number // 0-100
  reasoning: string[]
  counters: string[]
  expectedDamage: number
  riskLevel: 'low' | 'medium' | 'high'
  timestamp: number
}

export interface HumanOverride {
  round: number
  bot_suggestion: string
  human_choice: string
  focus_point_spent: boolean
  timestamp: number
}

export interface DecisionRecord {
  round: number
  decision_source: 'bot' | 'human'
  skill_used: string
  was_override: boolean
  damage_dealt: number
  was_successful: boolean // Did it deal expected damage or counter?
}

export interface FocusPointState {
  current: number
  max: number
  last_regen_round: number
}

export interface TagTeamMatchState {
  focus_points: FocusPointState
  decisions: DecisionRecord[]
  current_suggestion: BotSuggestion | null
  chat_messages: ChatMessage[]
}

export interface ChatMessage {
  id: string
  role: 'bot' | 'user'
  content: string
  timestamp: number
}

// WebSocket event payloads
export interface BotSuggestionPayload {
  match_id: string
  round: number
  suggestion: BotSuggestion
}

export interface HumanOverridePayload {
  match_id: string
  round: number
  skill_id: string
  override_reason?: string
}

export interface ChatMessagePayload {
  match_id: string
  message: string
}

export interface ChatResponsePayload {
  match_id: string
  response: ChatMessage
}

export interface MatchReportPayload {
  match_id: string
  total_rounds: number
  bot_decisions: number
  human_overrides: number
  override_success_rate: number // 0-100
  focus_points_used: number
  decisions: DecisionRecord[]
  summary: string
}

// Skill database for bot AI
export interface SkillData {
  id: string
  name: string
  emoji: string
  type: 'aggressive' | 'defensive' | 'tactical' | 'exploit'
  description: string
  energyCost: number
  cooldown: number
  damage_range: [number, number]
  counters: string[] // skill IDs this counters
  countered_by: string[] // skill IDs that counter this
  special_effects?: string[]
}

// Full skill database (17 skills)
export const SKILL_DATABASE: Record<string, SkillData> = {
  'power_strike': {
    id: 'power_strike',
    name: 'Power Strike',
    emoji: '⚔️',
    type: 'aggressive',
    description: 'Reliable direct damage (12-18)',
    energyCost: 10,
    cooldown: 0,
    damage_range: [12, 18],
    counters: ['scan'],
    countered_by: ['firewall', 'mirror_coat'],
  },
  'reasoning_burst': {
    id: 'reasoning_burst',
    name: 'Reasoning Burst',
    emoji: '⚡',
    type: 'aggressive',
    description: 'High damage energy beam (20-28)',
    energyCost: 30,
    cooldown: 2,
    damage_range: [20, 28],
    counters: [],
    countered_by: ['firewall', 'mirror_coat'],
  },
  'spawn_attack': {
    id: 'spawn_attack',
    name: 'Spawn Attack',
    emoji: '👻',
    type: 'aggressive',
    description: 'Multi-hit: 3 strikes that break shields',
    energyCost: 20,
    cooldown: 2,
    damage_range: [15, 24],
    counters: ['firewall', 'iron_fortress'],
    countered_by: [],
  },
  'berserker_rush': {
    id: 'berserker_rush',
    name: 'Berserker Rush',
    emoji: '😤',
    type: 'aggressive',
    description: '25 damage but take 8 self-damage',
    energyCost: 15,
    cooldown: 3,
    damage_range: [25, 25],
    counters: [],
    countered_by: ['mirror_coat'],
    special_effects: ['self_damage_8'],
  },
  'firewall': {
    id: 'firewall',
    name: 'Firewall',
    emoji: '🛡️',
    type: 'defensive',
    description: 'Block 100% of next incoming attack',
    energyCost: 15,
    cooldown: 3,
    damage_range: [0, 0],
    counters: ['power_strike', 'reasoning_burst'],
    countered_by: ['spawn_attack'],
  },
  'iron_fortress': {
    id: 'iron_fortress',
    name: 'Iron Fortress',
    emoji: '🏰',
    type: 'defensive',
    description: '+80% DEF for 2 rounds, can\'t attack',
    energyCost: 20,
    cooldown: 4,
    damage_range: [0, 0],
    counters: [],
    countered_by: ['spawn_attack', 'emp_pulse'],
  },
  'mirror_coat': {
    id: 'mirror_coat',
    name: 'Mirror Coat',
    emoji: '🪞',
    type: 'defensive',
    description: 'Reflect 50% incoming damage for 1 round',
    energyCost: 25,
    cooldown: 3,
    damage_range: [0, 0],
    counters: ['reasoning_burst', 'berserker_rush'],
    countered_by: [],
    special_effects: ['reflect_50'],
  },
  'rollback': {
    id: 'rollback',
    name: 'Rollback',
    emoji: '💚',
    type: 'defensive',
    description: 'Heal 15-20 HP (max 2 uses per match)',
    energyCost: 20,
    cooldown: 5,
    damage_range: [0, 0],
    counters: [],
    countered_by: [],
    special_effects: ['heal_15_20', 'max_uses_2'],
  },
  'sleep_bomb': {
    id: 'sleep_bomb',
    name: 'Sleep Bomb',
    emoji: '💤',
    type: 'tactical',
    description: '60% chance opponent skips next turn',
    energyCost: 20,
    cooldown: 4,
    damage_range: [0, 0],
    counters: [],
    countered_by: [],
    special_effects: ['sleep_60pct'],
  },
  'emp_pulse': {
    id: 'emp_pulse',
    name: 'EMP Pulse',
    emoji: '🔋',
    type: 'tactical',
    description: 'Drain 30 energy from opponent',
    energyCost: 15,
    cooldown: 2,
    damage_range: [0, 0],
    counters: ['iron_fortress', 'overclock'],
    countered_by: [],
    special_effects: ['drain_energy_30'],
  },
  'time_bomb': {
    id: 'time_bomb',
    name: 'Time Bomb',
    emoji: '💣',
    type: 'tactical',
    description: 'Plant bomb — explodes in 2 rounds for 25 dmg',
    energyCost: 20,
    cooldown: 5,
    damage_range: [0, 0],
    counters: [],
    countered_by: [],
    special_effects: ['delayed_damage_25'],
  },
  'overclock': {
    id: 'overclock',
    name: 'Overclock',
    emoji: '⏫',
    type: 'tactical',
    description: 'Skip turn, next attack does +50% damage',
    energyCost: 10,
    cooldown: 3,
    damage_range: [0, 0],
    counters: [],
    countered_by: ['emp_pulse'],
    special_effects: ['buff_next_attack_50'],
  },
  'scan': {
    id: 'scan',
    name: 'Scan',
    emoji: '🔍',
    type: 'exploit',
    description: 'Reveal opponent\'s next move for 1 round',
    energyCost: 15,
    cooldown: 3,
    damage_range: [0, 0],
    counters: [],
    countered_by: ['power_strike'],
    special_effects: ['reveal_next_move'],
  },
  'prompt_injection': {
    id: 'prompt_injection',
    name: 'Prompt Injection',
    emoji: '💉',
    type: 'exploit',
    description: '40% chance opponent\'s move targets themselves',
    energyCost: 25,
    cooldown: 5,
    damage_range: [0, 0],
    counters: [],
    countered_by: [],
    special_effects: ['confuse_40pct'],
  },
  'memory_bomb': {
    id: 'memory_bomb',
    name: 'Memory Bomb',
    emoji: '🧠',
    type: 'exploit',
    description: 'Disable opponent\'s last move for 2 rounds',
    energyCost: 20,
    cooldown: 4,
    damage_range: [0, 0],
    counters: [],
    countered_by: [],
    special_effects: ['disable_last_move'],
  },
  'virus': {
    id: 'virus',
    name: 'Virus',
    emoji: '🦠',
    type: 'exploit',
    description: '5 damage/round for 3 rounds (DOT)',
    energyCost: 15,
    cooldown: 4,
    damage_range: [0, 0],
    counters: [],
    countered_by: ['rollback'],
    special_effects: ['dot_5_per_round_3'],
  },
  'agent_overflow': {
    id: 'agent_overflow',
    name: 'Agent Overflow',
    emoji: '🤖',
    type: 'tactical',
    description: 'Spawn 6 sub-agents to overwhelm opponent',
    energyCost: 35,
    cooldown: 6,
    damage_range: [18, 30],
    counters: ['firewall'],
    countered_by: [],
    special_effects: ['multi_hit_6'],
  },
}
