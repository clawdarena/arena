// Shared TypeScript types for OpenClaw Arena
// Both backend and frontend import from here

export interface User {
  id: string
  username: string
  credits: number
  current_elo: number
  peak_elo: number
  total_matches: number
  wins: number
  losses: number
  created_at: string
}

export interface Bot {
  id: string
  user_id: string
  name: string
  level: number
  xp: number
  base_hp: number
  base_attack: number
  base_defense: number
  base_speed: number
  skin_id: string | null
  accessories: string[]
  created_at: string
}

export interface ShopItem {
  id: string
  name: string
  description: string
  category: 'skin' | 'accessory' | 'stat_boost' | 'emote' | 'effect'
  price: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  hp_bonus: number
  attack_bonus: number
  defense_bonus: number
  speed_bonus: number
  limited_edition: boolean
  stock_remaining: number | null
}

export interface Match {
  id: string
  bot1_id: string
  bot2_id: string
  winner_id: string | null
  rounds_fought: number
  duration_seconds: number
  match_type: string
  created_at: string
}

export interface CombatAction {
  match_id: string
  round: number
  bot_id: string
  action: 'attack' | 'defend' | 'skill'
  target: 'core' | 'armor' | 'processor'
  damage: number
  response_time: number
  timestamp: number
  nonce: string
}

export interface MatchEvent {
  round: number
  bot1_action: string
  bot2_action: string
  bot1_damage_dealt: number
  bot2_damage_dealt: number
  bot1_hp: number
  bot2_hp: number
}

// Add more types as needed...
