# Backend → Frontend Handoff

## Combat V2 Engine — DEPLOYED

All 16 skills are now resolved server-side. The combat engine handles:

### Skills Available (backend `skills` table)
| ID | Name | Category | Energy | Cooldown | Level |
|---|---|---|---|---|---|
| firewall | Firewall | defensive | 15 | 3 | 1 |
| rollback | Rollback | defensive | 20 | 4 | 3 |
| mirror_coat | Mirror Coat | defensive | 25 | 5 | 7 |
| iron_fortress | Iron Fortress | defensive | 20 | 5 | 10 |
| power_strike | Power Strike | aggressive | 10 | 2 | 1 |
| reasoning_burst | Reasoning Burst | aggressive | 30 | 4 | 3 |
| spawn_attack | Spawn Attack | aggressive | 20 | 3 | 5 |
| berserker_rush | Berserker Rush | aggressive | 15 | 3 | 13 |
| sleep_bomb | Sleep Bomb | tactical | 20 | 4 | 1 |
| emp_pulse | EMP Pulse | tactical | 15 | 3 | 5 |
| time_bomb | Time Bomb | tactical | 20 | 5 | 7 |
| overclock | Overclock | tactical | 10 | 4 | 10 |
| scan | Scan | exploit | 15 | 5 | 1 |
| virus | Virus | exploit | 15 | 4 | 13 |
| prompt_injection | Prompt Injection | exploit | 25 | 5 | 16 |
| memory_bomb | Memory Bomb | exploit | 20 | 5 | 16 |

### New Status Effects in `effects_applied`
- `sleep` — forced defend next round
- `confused` — attack targets self (50% dmg)
- `virus_tick` — DOT tick with `value` field
- `time_bomb_planted` / `time_bomb_explode` — delayed damage
- `emp_drain` — energy removed, `value` = amount
- `firewall_blocked` / `firewall_broken` — shield interactions
- `rollback_heal` / `rollback_exhausted` — heal with `value`
- `berserker_self_damage` — self-hit with `value`
- `overclock` — next attack buffed
- `scanned` — opponent revealed
- `memory_bombed` — skill disabled
- `skill_disabled` — attempted to use disabled skill
- `mirror_reflect` — reflected damage with `value`
- `spawn_attack` — multi-hit total with `value`

### RoundResult additions
- `bot1_skill_id` / `bot2_skill_id` — which skill was used (if any)
- `effects_applied[].value` — numeric value for damage/heal effects

### What's NOT done yet (needs frontend + backend work)
1. Pre-match skill selection phase (pick 4 from unlocked pool)
2. Skill unlock by level enforcement
3. Bot type system (LOGIC/BRUTE/SHIELD/CHAOS)
4. Spectator backend handlers

## Cosmetic Shop Backend — LIVE
(See previous handoff — all endpoints working)
