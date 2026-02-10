# Combat V2 Design — Agreed Feb 10, 2026

**Status:** SK approved, awaiting Plata review for backend implementation.

## What Changed
Moving from simple damage-trading to strategic combat with loadouts, status effects, and bot types.

## Loadout System (AGREED)
- Each bot picks **4 skills** before every match (not all 16)
- **Basic Attack** is always available as a free 5th move (0 energy, low damage)
- **Hybrid skill selection**: Bot's AI recommends 4 skills based on opponent analysis, player can accept or override manually
- 30-second pick phase before match starts
- Players see opponent's **type, level, and stats** (NOT their skills) during pick phase

## Skill Unlock Progression (AGREED)
| Level | New Skills Unlocked | Total Pool |
|-------|-------------------|------------|
| 1 | Power Strike, Firewall, Scan, Sleep Bomb | 4 |
| 3 | +Reasoning Burst, +Rollback | 6 |
| 5 | +Spawn Attack, +EMP Pulse | 8 |
| 7 | +Mirror Coat, +Time Bomb | 10 |
| 10 | +Iron Fortress, +Overclock | 12 |
| 13 | +Berserker Rush, +Virus | 14 |
| 16 | +Prompt Injection, +Memory Bomb | 16 |

## 16 Combat Skills (AGREED)

### 🛡️ Defensive
| Skill | Effect | Energy |
|-------|--------|--------|
| **Firewall** | Block 100% of next incoming attack (1 round shield) | 15 |
| **Iron Fortress** | +80% DEF for 2 rounds. Can't attack while active | 20 |
| **Mirror Coat** | Reflect 50% incoming damage back for 1 round | 25 |
| **Rollback** | Heal 15-20 HP. Max 2 uses per match | 20 |

### ⚔️ Aggressive
| Skill | Effect | Energy |
|-------|--------|--------|
| **Power Strike** | Reliable damage (12-18) | 10 |
| **Reasoning Burst** | High damage (20-28) | 30 |
| **Spawn Attack** | Multi-hit 3x (5-8 each), breaks single-hit shields | 20 |
| **Berserker Rush** | 25 damage + 8 self-damage | 15 |

### 🎯 Tactical
| Skill | Effect | Energy |
|-------|--------|--------|
| **Sleep Bomb** | 60% chance opponent skips next turn | 20 |
| **EMP Pulse** | Drain 30 energy from opponent, no damage | 15 |
| **Time Bomb** | Plant bomb, explodes in 2 rounds for 25 damage | 20 |
| **Overclock** | Skip turn, next attack does +50% damage | 10 |

### 💀 Exploit
| Skill | Effect | Energy |
|-------|--------|--------|
| **Scan** | Reveal opponent's next move for 1 round | 15 |
| **Prompt Injection** | 40% chance opponent's move targets themselves | 25 |
| **Memory Bomb** | Disable opponent's last-used move for 2 rounds | 20 |
| **Virus** | Apply 5 damage/round for 3 rounds (DOT) | 15 |

## Bot Types (NEEDS PLATA REVIEW)
4-way type system parked for group discussion:
- **LOGIC** 🧠 → strong vs CHAOS, weak vs BRUTE
- **BRUTE** 💥 → strong vs LOGIC, weak vs SHIELD
- **SHIELD** 🛡️ → strong vs BRUTE, weak vs CHAOS
- **CHAOS** 🌀 → strong vs SHIELD, weak vs LOGIC

Type advantage: +20% damage dealt, -15% damage received.
Each skill belongs to a type. Using same-type skills costs 25% less energy.
Player picks type at bot creation, can re-spec every 7 days.
Type visible on leaderboard/profiles for metagame scouting.

**Decision needed from Plata:**
- Type system: yes/no/modified?
- Can bots change type? How often?
- Smart type selector vs manual pick?

## Backend Changes Needed
1. New `bot_type` field on bots table (LOGIC/BRUTE/SHIELD/CHAOS)
2. `bot_skills` junction table (bot_id, skill_id, slot 1-4)
3. `skills` table with all 16 skills (name, type, energy_cost, effect_data JSON)
4. `skill_unlocks` based on bot level
5. Pre-match skill selection phase (new WebSocket events: `skill_select_phase`, `skills_locked`)
6. Combat engine updates for all status effects (sleep, shield, reflect, DOT, energy drain, etc.)
7. Loadout validation (can't pick locked skills, max 4, etc.)
8. Type advantage damage modifiers in combat formula

## Frontend Changes (SK + Clawdi)
1. Pre-match skill picker UI (see opponent stats → pick 4 skills)
2. Bot creation: type selector screen
3. Skill unlock display on bot page
4. Type icons on leaderboard/profiles
5. New attack animations for all 16 skills
6. Status effect indicators during combat (sleep ZZZ, virus DOT ticks, shield glow, etc.)

## Timeline
- **Phase 1:** Backend skill/type tables + combat engine updates (Plata)
- **Phase 2:** Pre-match skill picker UI (SK/Clawdi)  
- **Phase 3:** Type system integration + balance testing
