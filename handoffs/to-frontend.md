# Handoff: Backend → Frontend (Combat V2 Live)

## What Changed (Feb 10)

### 4-Skill Loadout System — LIVE
- Bots now have **4 skill slots** (was 2)
- New bots auto-receive starter loadout: `firewall` (slot 1), `power_strike` (slot 2), `sleep_bomb` (slot 3), `scan` (slot 4)
- All existing bots seeded with starter loadout
- All existing users granted free skills ownership

### WebSocket Events — Updated Payloads

#### `match_found` — now includes skills
```ts
my_bot: {
  id, name, hp, attack, defense, speed,
  skills: [{ id, slot, name, category, energyCost, cooldown }]
}
opponent: {
  name, elo, is_ai?,
  skills: [{ id, slot, name, category, energyCost, cooldown }]  // PvE bots too
}
```

#### `match_start` — now includes skills per bot
```ts
bot1: { id, name, hp, attack, defense, speed, skills: MatchSkillInfo[] }
bot2: { id, name, hp, attack, defense, speed, skills: MatchSkillInfo[] }
```

#### `round_start` — now includes cooldowns + disabled skills
```ts
bot1: { id, hp, energy, status_effects, skill_cooldowns: Record<string, number>, disabled_skills: string[] }
bot2: { id, hp, energy, status_effects, skill_cooldowns: Record<string, number>, disabled_skills: string[] }
```

#### `round_complete` — now includes skill_id
```ts
bot1_skill_id?: string  // which skill was used (if action was 'skill')
bot2_skill_id?: string
```

### 16 V2 Skills (all implemented in combat engine)
| Category | Skills |
|----------|--------|
| Defensive | `firewall`, `iron_fortress`, `mirror_coat`, `rollback` |
| Aggressive | `power_strike`, `reasoning_burst`, `spawn_attack`, `berserker_rush` |
| Tactical | `sleep_bomb`, `emp_pulse`, `time_bomb`, `overclock` |
| Exploit | `scan`, `prompt_injection`, `memory_bomb`, `virus` |

### PvE Bots Use Skills Now
Each PvE bot has a skill loadout and uses skills strategically:
- Training Dummy: `power_strike`, `firewall`
- Bronze Bot: `power_strike`, `firewall`, `scan`
- Silver Bot: `power_strike`, `firewall`, `sleep_bomb`, `scan`
- Gold Bot: `reasoning_burst`, `mirror_coat`, `emp_pulse`, `overclock`
- Platinum Bot: `berserker_rush`, `iron_fortress`, `time_bomb`, `virus`

### REST API Updates
- `POST /api/bots/equip-skill` — slot now accepts 1-4 (was 1-2)
- `POST /api/bots/unequip-skill` — slot now accepts 1-4

### Shared Types Updated
`code/frontend/shared/types.ts` has been synced with new types:
- `MatchSkillInfo` — skill metadata in match events
- `SkillId` — 16 V2 skill IDs
- `StatusEffect` — expanded union with all V2 effects
- `RoundResult` — added `bot1_skill_id`, `bot2_skill_id`
- `RoundStartPayload` — added `skill_cooldowns`, `disabled_skills`

## What Frontend Needs To Do
1. **Match page**: Show 4 skill buttons (from `match_start` payload) + basic attack + defend
2. **Skill buttons**: Grey out if on cooldown or insufficient energy (from `round_start` payload)
3. **Send `combat_action`** with `skill_id` when a skill button is pressed:
   ```ts
   socket.emit('combat_action', { action: { action: 'skill', target: 'opponent', skill_id: 'power_strike' }, signature: 'web_client' })
   ```
4. **Bot management page**: Update to show 4 skill slots, allow equip/swap
5. **Skill shop**: Show all 16 skills with categories, unlock levels

## Cosmetics Backend (unchanged from previous handoff)
- 5 endpoints live: `/api/shop/cosmetics`, `/api/shop/owned`, `/api/shop/purchase`, `/api/bots/:id/cosmetics`, `/api/bots/equip-cosmetic`
- 36 items, 5 categories, free items auto-owned
