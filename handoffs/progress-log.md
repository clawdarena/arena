# Progress Log

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
