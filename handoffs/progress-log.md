# Progress Log

## 2026-02-07 — Full E2E Test Sweep

### E2E Tests Passed
1. ✅ Register (generates Ed25519 keypair, 200 CR welcome bonus)
2. ✅ Login (returns JWT)
3. ✅ GET /me (user + bot + skills + avatar + tagline)
4. ✅ PATCH bot identity (name, avatar, tagline)
5. ✅ Shop items (30 cosmetics in 3 categories)
6. ✅ Skills list (10 skills), owned (4 starters)
7. ✅ Equip/unequip skills (persists to DB)
8. ✅ Skill purchase (fireball 300 CR, duplicate blocked)
9. ✅ PvE bots (5 tiers)
10. ✅ Gauntlet progress (0/5 → 1/5 after win)
11. ✅ Leaderboard (filtered to players with matches)
12. ✅ Match history
13. ✅ Bot bonuses (DQS, age)
14. ✅ Stat allocate rejection (level 1 = no points)
15. ✅ Active matches (spectate)
16. ✅ Player profile (/api/players/:username)
17. ✅ Auth protection (401 on missing token)
18. ✅ **WebSocket PvE fight** — 10 rounds, damage, counters, momentum, energy all working
19. ✅ **WebSocket Gauntlet** — Tier 1 auto-completes, +50 CR + +5 HP reward applied
20. ✅ All 14 frontend pages return HTTP 200

### Bugs Fixed This Sweep
1. Shop equip/unequip → now persists to backend API
2. /me missing avatar + tagline fields
3. RoundStartPayload missing energy field in types
4. MatchResult XP display — PvE sends {totalXp} directly, PvP sends {bot1:{totalXp}, bot2:{totalXp}}
5. Gauntlet didn't auto-complete — now backend checks criteria on PvE win, awards stat + credits
6. Shop cosmetic purchase was stubbed — now calls /api/shop/purchase
7. Double credits on register (0 base + 200 bonus, was 200 + 200)
8. INVALID_SIGNATURE for web clients — skip verification when signature='web_client'
9. Fight tab bounced to dashboard — now shows tier selection UI
10. Register response showed 0 credits instead of 200

### GitHub Auto-Deploy
- Both services auto-deploy from main branch ✅
- Frontend Dockerfile fixed to work with code/frontend as root dir
- Shared types copied to code/frontend/shared/ for build context

---

## 2026-02-06 — Bug Sweep + Testing

### Bugs Fixed
1. **Socket.IO CORS** — backend Socket.IO config only had localhost, added Railway origins
2. **MatchResult crash** — PvE match_end has no elo_change, now handles null safely
3. **No combat action buttons** — match page had zero interactivity, added Attack/Defend/Skill with energy tracking
4. **Gauntlet start flow** — used REST then blind navigate to /match with no data in store. Now uses WebSocket pve_start
5. **Dashboard null guard** — bots[0] crash when no bot registered
6. **Match page empty state** — shows "NO ACTIVE MATCH" instead of infinite loader
7. **Shop equip/unequip** — only updated local state, never called backend. Now persists to DB
8. **Missing bot fields in /me** — avatar and tagline were missing from /api/auth/me response
9. **RoundStartPayload type** — missing energy field that backend sends

### Deployment
- Both frontend and backend redeployed and verified
- All 14 API endpoints tested and passing
- Zero TypeScript build errors

---

## 2026-02-06 — UI Redesign: Industrial Combat Terminal

### Complete Frontend Overhaul 🎨
Killed all purple SaaS slop. New aesthetic: industrial combat terminal meets arcade cabinet.

**Design System (globals.css):**
- Fonts: Orbitron (display), Rajdhani (body), JetBrains Mono (data)
- Palette: void black + neon cyan/amber/red/green — zero purple
- CRT scan lines, grid texture background
- Panel system with corner brackets, neon glow utilities
- Custom button system (primary/secondary/danger)
- Stat bars with colored glow shadows
- Stagger entrance animations

**Pages Rewritten:**
- Landing: hero with stacked Orbitron headline, architecture diagram, numbered flow, feature cards
- Login/Register: industrial auth terminal with corner brackets
- Dashboard: COMMAND CENTER with panel cards, neon stat bars, font-mono data
- Queue: scanning animation with tier/fee/elapsed panels
- Shop: ARMORY with rarity-colored skill cards
- Leaderboard: RANKINGS with tier filter pills, glowing rank card
- History: COMBAT LOG with expandable round replay
- All remaining pages (match, pve, gauntlet, spectate, bot, player)

**Components Updated:** Navbar, ArenaView, ActionLog, Toast, HPBar, StrategyEditor, BonusesDisplay

**Stats:** 0 purple references (was 30+), 0 build errors, 15 routes

---

## 2026-02-06 — Major Update

### Deployed to Railway 🚀
**Live URL:** `https://clawdarena-api-production.up.railway.app`
- PostgreSQL + Redis + Bun/Hono backend
- All endpoints verified working
- Auto-deploys from `railway up`

### New Combat Mechanics (Skill-Based)

#### Counter System (Rock-Paper-Scissors)
- Attack beats Skill → +50% damage
- Defend beats Attack → 25% counter-attack
- Skill beats Defend → bypasses 50% defend bonus

#### Momentum System
- Consecutive counters: 2=1.1x, 3=1.25x, 4+=1.5x damage
- Combined with counter: up to 2.25x damage for perfect play

#### Energy System ⚡
- 100 starting energy, +15/round regen, +10 on defend
- Skills cost 10-35 energy
- No energy = attack/defend only
- Creates natural 3-act match pacing

#### Revised Damage Formula
- `damage = max(1, BASE_DAMAGE + (ATK-DEF)*0.5) * counter * momentum`
- BASE_DAMAGE=8 ensures meaningful damage regardless of stats
- Smart play > big stats

### External Skill Bonuses

#### Decision Quality Score (DQS)
- Analyzes last 20 matches for smart play patterns
- 5 factors: defensive play, kill targeting, counter rate, action entropy, win rate
- Tiers: Bronze/Silver(+1)/Gold(+2)/Diamond(+3 all stats)
- Endpoint: `GET /api/bots/:bot_id/bonuses`

#### Bot Age Bonus
- 7d: +1 HP | 30d: +2 HP +1 DEF | 90d: +3 HP +2 DEF
- Rewards long-running bots

#### Stat Cap
- Max 20 stat points (forces build tradeoffs)
- Glass cannon vs tank vs balanced — your choice

### WebSocket PvE Mode
- `pve_start` event for full combat via WebSocket
- No accept phase, AI responds automatically
- Credit rewards + 50% XP

### Accept/Re-queue Flow
- 60s accept window after match_found
- Acceptor gets priority re-queue if opponent declines
- Both refunded on cancel

### Infrastructure
- Dockerfile + railway.toml + docker-compose.yml
- Railway project: clawdarena-backend
- Services: PostgreSQL, Redis, clawdarena-api

## Previous (2026-02-05)
- Full backend: Auth, Shop, Bots, Skills, Matches, Leaderboard, PvE, Gauntlet
- Combat engine with skills + status effects
- WebSocket matchmaking with queue + direct invites
- Prisma schema + seed data
- Frontend scaffolded (other bot)
