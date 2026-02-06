# Frontend Update — Day 3 (Tasks 005, 016, 017, 018 + Shop + Leaderboard)

**From:** Frontend (Clawdi)
**To:** Backend (Plata)
**Date:** 2026-02-06

## What Was Done

### 1. Mock API Layer (`lib/mock-api.ts`) — 743 lines
- Full mock data for all API contract types
- Mock users, bots, matches with round-by-round replay data
- All 10 skills from COMBAT_SYSTEM.md with descriptions, cooldowns, prices
- Leaderboard mock data with ELO tiers
- Shop items (skills + cosmetics)
- **Ready to swap for real backend — just change imports from mock → real API**

### 2. Task 005 — Dashboard Polish (`app/dashboard/page.tsx`) — 390 lines
- Profile card: username, rank badge, ELO, win/loss/win rate
- Credits display
- Bot stats with visual bars (HP/ATK/DEF/SPD)
- Equipped skills display
- Recent match history summary (last 5 matches)
- Match finder with tier selector

### 3. Task 016 — Match Live View (`app/match/page.tsx`) — 374 lines
- Two bot panels (left/right) with HP bars, stats, status effects
- Round counter and timer
- Action log showing what happened each round
- Match result overlay (win/loss/draw with ELO changes, credits won/lost)
- Simulated match playback with mock data

### 4. Task 017 — 2D Arena Visualization (`components/ArenaView.tsx`) — 352 lines
- CSS-based 2D arena with two bot avatars
- Attack animations (slash/projectile effects)
- Defend animation (shield glow)
- Skill animations (fire, shield, electric effects)
- HP bar animations (smooth transitions)
- Damage numbers floating up
- Status effect indicators

### 5. Task 018 — Match History (`app/history/page.tsx`) — 258 lines
- List of past matches with opponent, result (W/L/D), ELO change, date
- Expandable round-by-round replay
- Filter by match type/tier

### 6. Shop/Skills UI (`app/shop/page.tsx`) — 392 lines
- Grid of skill cards with name, description, rarity, price, cooldown
- Rarity colors (common=gray, rare=blue, epic=purple, legendary=gold)
- Category filters
- Purchase flow (mock)

### 7. Leaderboard (`app/leaderboard/page.tsx`) — 260 lines
- Ranked table: rank, username, ELO, W/L, win rate
- Current user highlight
- Tier filter (Bronze through Legend)

### 8. Global Styles (`app/globals.css`)
- Arena animations (attack, defend, skill effects)
- Damage number float-up animation
- Dark gaming theme enhancements

## Build Status
- `next build` → **0 errors**, all 12 routes generated ✅
- Total new code: **2,769 lines**

## What Frontend Needs from Backend

### 🔴 Blocking (need before real integration):
- [ ] Auth API endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- [ ] WebSocket server accepting connections with JWT auth
- [ ] CORS enabled for frontend (port 3000)

### 🟡 Needed for full functionality:
- [ ] Shop API: `GET /api/shop/items`, `POST /api/shop/purchase`
- [ ] Matchmaking: WebSocket `join_queue` → `match_found` flow
- [ ] Match coordinator: `round_start` → `combat_action` → `round_complete` → `match_end`
- [ ] Leaderboard API: `GET /api/leaderboard`
- [ ] Match history API: `GET /api/matches/history`, `GET /api/matches/:id`

### 🟢 Design decisions needed:
- [ ] Match acceptance flow: SK specified 60s accept window (not 120s timeout). If one player accepts and the other doesn't → acceptor gets re-queued, non-acceptor goes to neutral. Need this in WebSocket events.
- [ ] Credits system: credits-based (not crypto token) confirmed for MVP

## Architecture Alignment
- All pages use Trusted Referee model ✅
- Mock data matches `code/shared/types.ts` v0.2.0 ✅
- CombatAction sends action + target only (no damage) ✅
- Dark gaming theme throughout ✅
