# Progress Log

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
