# Stat-Based Damage System - Changelog

**Date:** 2026-02-11  
**Version:** 2.0 - Stat-Based Combat  
**Status:** ✅ Implemented

---

## 🎯 Overview

Replaced flat damage calculations with stat-based formulas for all 17 skills. Every attack now scales with attacker stats (Power/Speed) and is reduced by defender Defense, creating meaningful build diversity and grind-to-win progression.

---

## 🔧 Changes Made

### 1. Core Combat Engine (`combat.ts`)

#### Added Stat-Based Damage Functions
- **`calculateBasicAttackDamage()`** - Hybrid Power/Speed formula for basic attacks
  - Formula: `BaseDamage = Power × 0.8 + Speed × 0.2 + 3`
  - Defense reduction: `Defense × 0.6`
  - Minimum floor: 3 HP

- **`calculateSkillDamage()`** - Stat-based formulas for all skills
  - Each skill has unique Power/Speed/Defense scaling
  - Different defense penetration rates per skill
  - Minimum floor: 4 HP

#### Updated Skills with Stat Formulas

**Aggressive Skills:**
- **Power Strike:** `Power × 1.2 + 8` (pure Power scaling)
- **Quick Attack (Reasoning Burst):** `Speed × 1.4 + 6` (pure Speed scaling)
- **Spawn Attack:** `3 × (Power × 0.4 + Speed × 0.3 + 2)` (hybrid multi-hit)
- **Berserker Rush:** `Power × 1.8 + Speed × 0.4 + 10` (massive Power + increasing self-damage)

**Defensive Skills:**
- **Firewall:** `Defense × 1.5 + 10` shield strength
- **Iron Fortress:** `+Defense × 0.8` bonus (tank mode)
- **Mirror Coat:** Reflect `(0.4 + Defense/100)%` up to `Defense × 0.8` max
- **Rollback:** Heal `10 + (Defense × 0.6) + (MaxHP × 0.12)` capped at 30% MaxHP

**Tactical Skills:**
- **Sleep Bomb:** `0.5 + (Speed / 80)` success chance (max 85%)
- **EMP Pulse:** Drain `25 + (Speed × 0.5)` energy (min 20)
- **Time Bomb:** Delayed `Power × 1.0 + Speed × 0.5 + 12` damage
- **Overclock:** Next attack `1.3 + (Speed / 50)` multiplier (max 1.8x)

**Exploit Skills:**
- **Virus:** DoT `(Power × 0.4 + Speed × 0.3)` per tick, 3 ticks (defense-piercing)
- **Scan:** -15% Defense debuff for 1 round + info reveal
- **Prompt Injection:** `0.35 + (Speed / 100)` confuse chance (max 65%)
- **Memory Bomb:** Disable last skill (not stat-based, strategic)

---

## 📊 Build Archetypes

### Glass Cannon (High Power/Speed, Low Defense)
- **Stats:** Power 30-40, Speed 25-35, Defense 5-10
- **Strengths:** Massive burst damage, fast kills
- **Best Skills:** Power Strike, Berserker Rush, Time Bomb
- **Weaknesses:** Dies fast, weak to DoT/CC

### Tank (High Defense/HP, Medium Power)
- **Stats:** Defense 30-40, HP 140-170, Power 15-20
- **Strengths:** Outlasts, reflects damage, sustains
- **Best Skills:** Firewall, Mirror Coat, Iron Fortress, Rollback
- **Weaknesses:** Virus (defense-piercing), Sleep Bomb

### Speed Demon (High Speed, Balanced Power/Defense)
- **Stats:** Speed 30-40, Power 20-25, Defense 15-20
- **Strengths:** CC chains, utility, energy control
- **Best Skills:** Quick Attack, Sleep Bomb, Overclock, EMP
- **Weaknesses:** Pure Power builds overpower

### Balanced (Medium Everything)
- **Stats:** 20-25 all stats
- **Strengths:** Adaptable, reliable, safe
- **Best Skills:** Basic Attack, Spawn Attack (hybrid formulas)
- **Weaknesses:** Specialized builds counter

---

## 🎮 Gameplay Impact

### Before (Flat Damage)
- Skills dealt fixed damage (e.g., 25 HP)
- Stats didn't meaningfully affect combat
- No build diversity incentive
- Grinding felt unrewarding

### After (Stat-Based)
- Every stat point matters in combat
- Power/Speed builds excel at offense
- Defense builds tank and reflect
- Grinding directly improves win rate
- Clear counter-play between builds

---

## 🧪 Testing Results

### Minimum Damage Enforcement ✅
- Weak (5 ATK) vs Super Tank (50 DEF) = 3 HP (floor enforced)
- All attacks deal at least 3-4 HP

### Build Viability ✅
- Glass Cannon can burst down Tank
- Tank can outlast and reflect Glass Cannon
- Speed Demon controls fights with CC
- Balanced build remains viable

### Stat Scaling ✅
- Power increases damage significantly
- Speed affects CC success and utility
- Defense reduces incoming damage meaningfully
- No stat provides immunity

---

## 🚀 Deployment Checklist

- [x] Design 17 unique stat-based formulas
- [x] Implement in `combat.ts`
- [x] Update Firewall to use shield strength
- [x] Update Mirror Coat to Defense-scale reflection
- [x] Update Rollback to Defense/HP-scale healing
- [x] Update all aggressive skills with Power/Speed formulas
- [x] Update tactical skills with Speed-based utility
- [x] Update DoT to pierce defense
- [x] Enforce minimum damage floors
- [x] Document all changes
- [ ] Update bot AI to be stat-aware
- [ ] Add stat tooltips to frontend
- [ ] Test in production environment
- [ ] Commit and push to Railway

---

## 📝 Files Modified

1. **`code/backend/src/utils/combat.ts`**
   - Added `calculateBasicAttackDamage()`
   - Added `calculateSkillDamage()`
   - Updated all skill resolution in `resolveSkillV2()`
   - Updated damage application logic
   - Updated mirror coat and firewall handling

2. **`docs/STAT_DAMAGE_FORMULAS.md`**
   - Comprehensive formula documentation
   - Build archetype descriptions
   - Design principles

3. **`tests/test-stat-damage.ts`**
   - Unit tests for all formulas
   - Build viability tests
   - Minimum damage floor verification

---

## 🔮 Future Enhancements

### Phase 2: Bot AI Updates
- Calculate expected damage based on stats
- Adjust move suggestions for stat matchups
- Confidence scoring based on build counters

### Phase 3: Frontend Polish
- Show stat scaling in skill tooltips
- Display expected damage ranges
- Build archetype recommendations

### Phase 4: Balance Tuning
- Monitor win rates by build type
- Adjust multipliers if needed
- Community feedback integration

---

## 📞 Support

Issues or balance concerns? Check:
- `docs/STAT_DAMAGE_FORMULAS.md` for formula reference
- `tests/test-stat-damage.ts` for expected behavior
- Combat logs for actual calculations

---

**Status:** ✅ Core implementation complete, ready for AI integration and deployment
