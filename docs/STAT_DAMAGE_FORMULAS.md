# Stat-Based Damage Formula Design

## Overview
Replace flat damage with stat-based calculations for all 17 skills in ClawdArena. Each formula uses different stat combinations to create strategic depth and build diversity.

## Design Principles
- **Grind to Win:** Higher stats provide meaningful advantages
- **Fair:** No single stat dominates everything
- **Strategic Depth:** Different skills counter different builds
- **Minimum Damage Floor:** 3-4 HP guaranteed damage

## Stat Roles
- **Power (Attack):** Raw damage output
- **Speed:** Critical hits, multi-hits, dodge chance
- **Defense:** Damage mitigation
- **Health:** HP pool only (no damage reduction)

## Damage Calculation Framework

### Base Formula Structure
```
BaseDamage = f(AttackerStats)
EffectiveDefense = DefenderDefense × Modifiers
FinalDamage = max(FLOOR, BaseDamage - EffectiveDefense)
```

### Defense Reduction
```
DamageReduction = (DefenderDefense × 0.6)
```
- 60% efficiency so Defense doesn't completely negate high Power
- Allows meaningful damage progression through stat grinding

---

## 17 Skill Formulas

### BASIC ATTACK (17th skill)
**Type:** Balanced  
**Formula:**
```
BaseDamage = Power × 0.8 + Speed × 0.2 + 3
Defense Reduction = Defender.Defense × 0.6
FinalDamage = max(3, BaseDamage - Defense Reduction)
```
**Design:** Hybrid Power/Speed with guaranteed minimum. Balanced starter move.

---

### 1. POWER STRIKE
**Type:** Power-focused  
**Category:** Aggressive  
**Formula:**
```
BaseDamage = Power × 1.2 + 8
Defense Reduction = Defender.Defense × 0.6
FinalDamage = max(4, BaseDamage - Defense Reduction)
```
**Design:** Pure power scaling. Best for high-Power builds.

---

### 2. QUICK ATTACK (Reasoning Burst)
**Type:** Speed-focused  
**Category:** Aggressive  
**Formula:**
```
BaseDamage = Speed × 1.4 + 6
Defense Reduction = Defender.Defense × 0.5
FinalDamage = max(4, BaseDamage - Defense Reduction)
```
**Design:** Speed-based with lower defense penetration. Rewards Speed builds.

---

### 3. FIREWALL
**Type:** Defensive (Shield)  
**Category:** Defensive  
**Formula:**
```
ShieldStrength = Defense × 1.5 + 10
Duration = 1 round
Effect: Blocks next attack up to ShieldStrength damage
```
**Design:** Defense-scaling shield. Better shields for tank builds.

---

### 4. VIRUS
**Type:** DoT (Defense-piercing)  
**Category:** Exploit  
**Formula:**
```
TickDamage = (Power × 0.4 + Speed × 0.3) / 3 rounds
Total = TickDamage × 3 rounds
Defense Reduction = Defender.Defense × 0.3 (DoT pierces defense)
FinalTickDamage = max(2, TickDamage - (Defender.Defense × 0.3))
```
**Design:** Hybrid stat DoT that bypasses most defense. Good vs tanks.

---

### 5. MIRROR COAT
**Type:** Reflect  
**Category:** Defensive  
**Formula:**
```
ReflectPercent = 0.4 + (Defense / 100)
ReflectDamage = IncomingDamage × ReflectPercent
MaxReflect = Defense × 0.8
FinalReflect = min(MaxReflect, ReflectDamage)
```
**Design:** Defense-scaled reflection. Tanks reflect more damage.

---

### 6. EMP PULSE
**Type:** Utility  
**Category:** Tactical  
**Formula:**
```
EnergyDrained = 25 + (Speed × 0.5)
MinDrain = 20
FinalDrain = max(MinDrain, EnergyDrained)
```
**Design:** Speed affects energy drain effectiveness.

---

### 7. SLEEP BOMB
**Type:** CC  
**Category:** Tactical  
**Formula:**
```
SleepChance = 0.5 + (Speed / 80)
MaxChance = 0.85
FinalChance = min(MaxChance, SleepChance)
```
**Design:** Speed improves CC accuracy. Fast bots land CC more reliably.

---

### 8. OVERCLOCK
**Type:** Buff  
**Category:** Tactical  
**Formula:**
```
NextAttackMultiplier = 1.3 + (Speed / 50)
MaxMultiplier = 1.8
FinalMultiplier = min(MaxMultiplier, NextAttackMultiplier)
```
**Design:** Speed affects overclock effectiveness.

---

### 9. BERSERKER RUSH
**Type:** High-risk Power  
**Category:** Aggressive  
**Formula:**
```
BaseDamage = Power × 1.8 + Speed × 0.4 + 10
SelfDamage = 8 + (Power × 0.15)
Defense Reduction = Defender.Defense × 0.5
FinalDamage = max(5, BaseDamage - Defense Reduction)
```
**Design:** Massive power scaling with increasing self-damage. High-risk/reward.

---

### 10. HEAL (Rollback)
**Type:** Healing  
**Category:** Defensive  
**Formula:**
```
HealAmount = 10 + (Defense × 0.6) + (MaxHP × 0.12)
MaxHeal = MaxHP × 0.3
FinalHeal = min(MaxHeal, HealAmount)
```
**Design:** Defense and max HP scale healing. Tanks sustain better.

---

### 11. SPAWN ATTACK
**Type:** Multi-hit  
**Category:** Aggressive  
**Formula:**
```
Hit1 = (Power × 0.4 + Speed × 0.3) + 2
Hit2 = (Power × 0.4 + Speed × 0.3) + 2
Hit3 = (Power × 0.4 + Speed × 0.3) + 2
TotalDamage = Hit1 + Hit2 + Hit3
Defense Reduction per hit = Defender.Defense × 0.4
FinalDamage = max(3 per hit, Hit - Defense Reduction) × 3
```
**Design:** Hybrid stat multi-hit. Breaks shields. Lower per-hit defense reduction.

---

### 12. CRITICAL HIT (Iron Fortress)
**Type:** Tank mode  
**Category:** Defensive  
**Formula:**
```
DefenseBonus = Defense × 0.8
Duration = 2 rounds
Effect: +DefenseBonus to Defense, cannot attack
```
**Design:** Pure tank stance. Defense-scaling defensive buff.

---

### 13. TIME BOMB
**Type:** Delayed burst  
**Category:** Tactical  
**Formula:**
```
Delay = 2 rounds
ExplosionDamage = Power × 1.0 + Speed × 0.5 + 12
Defense Reduction = Defender.Defense × 0.4
FinalDamage = max(4, ExplosionDamage - Defense Reduction)
```
**Design:** Hybrid stat delayed damage. Telegraphed but powerful.

---

### 14. SCAN
**Type:** Utility  
**Category:** Exploit  
**Formula:**
```
DefenseReduction = 15% of target's Defense for 1 round
Duration = 1 round
Effect: Reveals stats + reduces target Defense by 15%
```
**Design:** Utility with minor defense debuff. Information advantage.

---

### 15. PROMPT INJECTION
**Type:** CC  
**Category:** Exploit  
**Formula:**
```
ConfuseChance = 0.35 + (Speed / 100)
MaxChance = 0.65
FinalChance = min(MaxChance, ConfuseChance)
SelfDamage = TargetAttack × 0.5 (if confused)
```
**Design:** Speed-based confusion. Makes opponent hit themselves.

---

### 16. MEMORY BOMB
**Type:** Debuff  
**Category:** Exploit  
**Formula:**
```
DisableDuration = 2 rounds
Effect: Disables last-used skill
Success based on execution, not stats
```
**Design:** Strategic counter. Not stat-based to maintain utility for all builds.

---

### 17. STUN LOCK (Scan alternate)
**Type:** DoT pierce  
**Category:** Exploit  
**Formula:**
```
Same as Virus (already designed above)
```
**Design:** Defense-piercing DoT option.

---

## Build Archetypes

### Glass Cannon (High Power/Speed, Low Defense)
- **Strengths:** Power Strike, Quick Attack, Berserker Rush, Time Bomb
- **Weaknesses:** Dies fast to sustained damage, reflect effects
- **Playstyle:** Burst damage, finish fights quickly

### Tank (High Defense/HP, Medium Power)
- **Strengths:** Firewall, Mirror Coat, Iron Fortress, Heal
- **Weaknesses:** Virus, Sleep Bomb (DoT/CC bypass defense)
- **Playstyle:** Outlast, reflect, sustain

### Speed Demon (High Speed, Balanced Power/Defense)
- **Strengths:** Quick Attack, Sleep Bomb, Overclock, EMP
- **Weaknesses:** Pure Power builds can overpower
- **Playstyle:** CC chains, energy manipulation, multi-hits

### Balanced (Medium everything)
- **Strengths:** Basic Attack, Spawn Attack (hybrid formulas)
- **Weaknesses:** Specialized builds counter
- **Playstyle:** Adaptable, safe, reliable

---

## Implementation Notes

### Minimum Damage Enforcement
All damage formulas use `max(FLOOR, calculated)` where FLOOR is 3-4 HP depending on skill type.

### Defense Scaling
Defense provides diminishing returns through the 0.5-0.6x multiplier, preventing full negation.

### Stat Soft Caps
No hard caps, but formulas designed so:
- 30-40 Power = strong attacker
- 30-40 Defense = tank
- 30-40 Speed = specialist
- Balanced 20/20/20 = viable

### Energy Costs
Remain unchanged (defined in SKILL_DEFS).

### Status Effect Durations
Unchanged from current system.

---

## Testing Checklist
- [ ] All 17 skills have formulas
- [ ] Minimum damage floors enforced
- [ ] Tank build viable
- [ ] Glass cannon build viable
- [ ] Speed build viable
- [ ] Balanced build viable
- [ ] No formula results in negative damage
- [ ] Defense provides meaningful protection without immunity
- [ ] Power/Speed provide meaningful offense growth

---

## Deployment Steps
1. Implement formulas in `combat.ts`
2. Update bot AI to calculate expected damage
3. Add stat tooltips to frontend
4. Test with various stat combinations
5. Commit with clear documentation
6. Deploy to Railway
