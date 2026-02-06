# Combat System Specification

**Version:** 1.0.0  
**Architecture:** Trusted Referee — all combat resolves server-side. See `docs/ARCHITECTURE.md` ADR-002.

---

## Overview

Combat is turn-based, 1v1. Each round, both bots choose an action simultaneously. The server resolves the round, calculates damage, applies effects, and broadcasts results. Match ends when a bot's HP reaches 0 or max rounds are exhausted.

---

## Match Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| Max rounds | 10 | Draw if both bots alive at end |
| Time per round | 30 seconds | Auto-defend on timeout |
| Consecutive timeouts for forfeit | 3 | Bot auto-loses the match |
| Min HP | 0 | Match ends when a bot hits 0 |
| Min damage | 1 | Chip damage — attacks always deal at least 1 |

---

## Base Bot Stats

New bots start with these defaults. Stats are modified by level, equipped items, and shop purchases.

| Stat | Default | Range | Description |
|------|---------|-------|-------------|
| HP | 100 | 50–200 | Health points. Bot dies at 0. |
| Attack | 15 | 5–50 | Base damage output |
| Defense | 10 | 5–40 | Damage reduction |
| Speed | 10 | 5–30 | Determines action priority |

**Stat scaling from items:**
- Items add flat bonuses (e.g. +5 attack, +10 HP)
- No percentage-based scaling for MVP
- Max 3 accessories equipped at once

---

## Actions

Each round, a bot chooses one action:

### Attack

Deal damage to the opponent at a chosen target.

```
Required fields: action='attack', target='core'|'armor'|'processor'
```

### Defend

Reduce incoming damage by 50%. No damage dealt.

```
Required fields: action='defend'
Target: ignored (set to null)
```

### Skill

Use an equipped skill. Each bot can equip up to 2 skills.

```
Required fields: action='skill', skill_id='fireball'|'shield_wall'|etc.
Target: depends on skill (some target self, some target opponent)
```

---

## Target System

When attacking, the bot chooses a target zone. Each zone has different risk/reward:

| Target | Defense Modifier | Special Effect |
|--------|-----------------|----------------|
| `core` | 1.0x | None — standard reliable hit |
| `armor` | 1.5x (harder) | If damage > 0: opponent's defense -2 for next round |
| `processor` | 0.5x (easier) | 30% chance to stun opponent (auto-defend next round) |

**Design intent:**
- `core` = safe, consistent damage
- `armor` = risky but rewards with a debuff if it lands
- `processor` = easy hit with a chance for a powerful CC effect

---

## Counter System (Rock-Paper-Scissors)

Actions have natural counters that reward smart reads:

| Your Action | Beats | Bonus |
|-------------|-------|-------|
| **Attack** | Skill | +50% damage (caught them casting) |
| **Defend** | Attack | Counter-attack: deal 25% of blocked damage back |
| **Skill** | Defend | Skills bypass 50% of defend bonus |

**Why this matters:** A bot that reads opponent patterns and counters correctly gains massive advantage regardless of raw stats. This is the primary skill differentiator.

---

## Momentum System

Consecutive successful counters build a streak multiplier:

| Streak | Multiplier | Effect |
|--------|-----------|--------|
| 0–1 | 1.0x | No bonus |
| 2 | 1.1x | Building momentum |
| 3 | 1.25x | Strong momentum |
| 4+ | 1.5x (cap) | Maximum momentum |

Missing a counter resets the streak to 0. Momentum applies to all damage dealt that round.

**Combined with counters:** A bot with a 4-streak counter deals `1.5 (counter) × 1.5 (momentum) = 2.25x` damage. This means smart play can more than double your damage output.

---

## Damage Formula

```
BASE_DAMAGE = 8  (everyone deals meaningful damage)

effective_defense = defender.defense * target_mod

if defender_action == 'defend':
    if counter_type == 'skill_vs_defend':
        effective_defense *= 1.25  (skill bypasses half of defend bonus)
    else:
        effective_defense *= 1.5

if defender has 'armor_broken' status:
    effective_defense -= 2

choice_multiplier = 1.0  (default)
if counter_type == 'attack_vs_skill':
    choice_multiplier = 1.5

momentum_multiplier = getMomentumMultiplier(streak)

damage = max(1, round(BASE_DAMAGE + (attack - effective_defense) * 0.5) * choice_multiplier * momentum_multiplier)
```

**Example — Equal stats, no counter:**
- Attacker: 15 attack, targets `core`
- Defender: 10 defense, action = `attack`
- Damage = max(1, round(8 + (15 - 10) * 0.5)) = **11 damage**

**Example — Counter (attack vs skill):**
- Same stats, but attacker caught defender casting a skill
- Damage = max(1, round(11 * 1.5)) = **17 damage** (+54%)

**Example — Counter with momentum streak of 3:**
- Damage = max(1, round(11 * 1.5 * 1.25)) = **21 damage** (+91%)

**Example — Stat disadvantage but perfect play:**
- Fresh bot (15 ATK) vs maxed bot (13 DEF), counter + 4 streak
- Fresh: 8 + (15-13)*0.5 = 9 → 9 * 1.5 * 1.5 = **20 damage**
- Maxed bot (18 ATK) vs fresh (10 DEF), no counter, no momentum
- Maxed: 8 + (18-10)*0.5 = **12 damage**
- **Smart bot wins despite worse stats.**

---

## Action Priority (Speed)

1. **Higher speed acts first** within the round
2. If speeds are equal: **seeded random tiebreaker** (match seed + round number)
3. First mover's attack resolves before second mover's
4. If first mover kills second mover, second mover's action still resolves (simultaneous resolution within the round — both actions happen)

**Why simultaneous:** Prevents speed from being too dominant. A slow bot can still trade damage even if it dies that round.

---

## Skills System

### Skill Slots
- Each bot can equip **2 skills**
- Skills are acquired through the shop or leveling
- Skills have **cooldowns** (rounds before reuse)

### Starter Skills (Available to All)

| Skill ID | Name | Effect | Cooldown | Target |
|----------|------|--------|----------|--------|
| `power_strike` | Power Strike | Deal 1.5x attack damage (ignores 50% of defense) | 3 rounds | Opponent |
| `shield_wall` | Shield Wall | Block 100% of incoming damage this round + heal 5 HP | 4 rounds | Self |
| `overclock` | Overclock | +5 attack and +5 speed for 2 rounds | 4 rounds | Self |
| `scan` | Scan | Reveal opponent's exact stats (attack, defense, speed) for the rest of the match | 5 rounds | Opponent |

### Shop Skills (Purchasable)

| Skill ID | Name | Rarity | Price | Effect | Cooldown | Target |
|----------|------|--------|-------|--------|----------|--------|
| `fireball` | Fireball | Rare | 300 | Deal 20 flat damage (ignores defense). Apply `burning` (3 damage/round for 2 rounds) | 4 rounds | Opponent |
| `iron_fortress` | Iron Fortress | Rare | 300 | +10 defense for 3 rounds. Cannot attack while active. | 5 rounds | Self |
| `emp_blast` | EMP Blast | Epic | 600 | Stun opponent for 1 round (auto-defend). Reset opponent's skill cooldowns to max. | 6 rounds | Opponent |
| `regenerate` | Regenerate | Epic | 600 | Heal 8 HP per round for 3 rounds | 5 rounds | Self |
| `berserker` | Berserker Rage | Legendary | 1000 | +15 attack for 3 rounds, but -5 defense for same duration | 7 rounds | Self |
| `mirror_coat` | Mirror Coat | Legendary | 1000 | Reflect 50% of incoming damage back to attacker for 2 rounds | 6 rounds | Self |

### Skill Resolution Rules

1. Skills resolve **before** normal attacks in priority order
2. If both bots use skills: higher speed resolves first
3. Buff/debuff skills apply immediately (affect the current round)
4. Damage skills use the skill's own damage formula (not the standard attack formula)
5. If a skill is on cooldown: action is **rejected** → server auto-assigns `defend` + emits error
6. Cooldown starts the round **after** the skill is used (can't use same skill next round even if cooldown=1)

### Status Effects

| Effect | Duration | Behavior |
|--------|----------|----------|
| `burning` | 2 rounds | 3 damage per round (applied at round start, ignores defense) |
| `stunned` | 1 round | Auto-defend, cannot choose action |
| `armor_broken` | 1 round | -2 defense (from successful `armor` target attack) |
| `overclock` | 2 rounds | +5 attack, +5 speed |
| `iron_fortress` | 3 rounds | +10 defense, cannot attack |
| `regenerating` | 3 rounds | Heal 8 HP per round (applied at round start) |
| `berserker` | 3 rounds | +15 attack, -5 defense |
| `mirror_coat` | 2 rounds | Reflect 50% incoming damage |

### Status Effect Resolution Order (per round)

1. **Tick effects** — burning damage, regeneration healing (at round start)
2. **Expiry check** — remove expired effects
3. **Skill resolution** — new skills apply
4. **Action resolution** — attacks/defends resolve
5. **Post-action effects** — stun from processor hit, armor break

---

## Round Resolution Flow (Server-Side)

```
function resolveRound(match, bot1Action, bot2Action):
    
    1. TICK STATUS EFFECTS
       - Apply burning damage to affected bots
       - Apply regeneration healing
       - Decrement all effect durations
       - Remove expired effects
    
    2. CHECK FORCED ACTIONS
       - If bot is stunned → override action to 'defend'
       - If bot has iron_fortress → override action to 'defend' (can't attack)
       - If skill is on cooldown → override to 'defend' + emit error
    
    3. DETERMINE PRIORITY
       - Compare effective speed (base + buffs)
       - Tiebreak with seeded random
    
    4. RESOLVE SKILLS (if any, before attacks)
       - Apply buffs/debuffs immediately
       - Deal skill damage
       - Start cooldown timers
    
    5. RESOLVE FIRST MOVER ACTION
       - Calculate damage using formula
       - Apply target special effects (armor break, stun chance)
       - Apply mirror coat reflection if active
    
    6. RESOLVE SECOND MOVER ACTION
       - Same as above (second mover still acts even if killed)
    
    7. APPLY RESULTS
       - Update HP values
       - Clamp HP to 0 minimum
       - Record round result
    
    8. CHECK WIN CONDITION
       - If both bots HP ≤ 0 → draw
       - If one bot HP ≤ 0 → other wins
       - If max rounds reached → highest HP wins (draw if equal)
    
    return roundResult
```

---

## ELO System

Standard ELO with K-factor:

```
K = 32 (standard)
expected_a = 1 / (1 + 10^((elo_b - elo_a) / 400))
expected_b = 1 - expected_a

if A wins:
    new_elo_a = elo_a + K * (1 - expected_a)
    new_elo_b = elo_b + K * (0 - expected_b)

if draw:
    new_elo_a = elo_a + K * (0.5 - expected_a)
    new_elo_b = elo_b + K * (0.5 - expected_b)
```

**ELO floors by tier:**

| Tier | Min ELO | Entry Fee | Win Reward |
|------|---------|-----------|------------|
| Bronze | 0 | 50 | 90 |
| Silver | 1200 | 100 | 180 |
| Gold | 1400 | 200 | 360 |
| Platinum | 1600 | 400 | 720 |
| Legend | 1800 | 800 | 1440 |

**Reward formula:** `win_reward = entry_fee * 2 * 0.9` (10% platform rake)

---

## PvE Bots (Server-Controlled)

PvE bots use fixed strategies. No entry fee, no ELO change, reduced credit rewards.

| Bot | HP | ATK | DEF | SPD | Strategy | Reward |
|-----|-----|-----|-----|-----|----------|--------|
| Training Dummy | 50 | 5 | 5 | 5 | Random actions | 10 |
| Bronze Bot | 80 | 10 | 8 | 8 | Attacks core every round | 25 |
| Silver Bot | 100 | 15 | 12 | 10 | Alternates attack/defend | 50 |
| Gold Bot | 120 | 20 | 15 | 15 | Uses skills + targets processor | 100 |
| Platinum Bot | 150 | 25 | 20 | 20 | Adapts to player patterns | 200 |

---

## Match Types Summary

| Type | ELO Change | Credits | Replay | Notes |
|------|------------|---------|--------|-------|
| Ranked PvP | Yes | Entry fee + reward | Public | Main competitive mode |
| PvE | No | Small reward | Private | Practice / tutorial |
| Friendly (future) | No | No | Public | Casual matches |

---

**This document is the source of truth for combat mechanics. Update here first, then sync WebSocket events and types.**
