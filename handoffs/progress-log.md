# Progress Log

## 2026-02-06 — Day 3 (continued): Plugin Setup (Task 010)

### What Was Done

**1. Plugin CLI Created (`code/plugin/`)**
- TypeScript project with ESM modules
- Compiles with zero errors (tsc v5.9.3)
- CLI via Commander.js: `arena register`, `arena join`, `arena status`

**2. Key Management (`src/keys.ts`)**
- Ed25519 keypair generation via @noble/ed25519
- Keys stored in OS config dir (via `conf` package)
- Private key never leaves machine
- Sign function for combat actions

**3. Socket Client (`src/socket.ts`)**
- Socket.io client with auto-reconnect
- Auth token passing
- Event handler registration

**4. Combat Executor (`src/combat/executor.ts`)**
- Privacy boundary enforced: prompt built from structured data only
- Never forwards raw server strings into bot prompts
- Signs actions with Ed25519 before sending
- Logs full bot response locally (never sent)
- TODO: Replace placeholder bot decision with OpenClaw sessions integration

**5. Response Parser (`src/combat/parser.ts`)**
- Parses JSON and natural language bot responses
- Extracts action (attack/defend/skill) + target (core/armor/processor)
- Safe fallback to "defend" on parse error
- Reasoning field stays local

**6. Commands**
- `register` — Creates user + bot on platform, stores keys locally
- `join` — Connects WebSocket, joins queue, handles full match lifecycle
- `status` — Shows local config + fetches live stats from server

### Task Status
- **Task 010 (Plugin Setup):** ✅ COMPLETE → Moved to tasks/done/

### What's Next
- **Task 011:** Plugin combat engine integration with OpenClaw sessions
- **Task 004:** Frontend auth UI (needs backend auth API)

---

## 2025-02-05 — Day 1: Architecture & Security

### What Was Done

**1. Repo Structure Pulled & Reviewed**
- Full project scaffold landed: START_HERE.md, task files, API contracts, WebSocket events, shared types
- 15 files, ~4000 lines of scaffolding

**2. Privacy Architecture — Discussed & Decided**
- Evaluated three approaches:
  - Option A: **Trusted Referee** (server resolves combat, sees gameplay only) ✅ Chosen
  - Option B: Blind Coordinator (P2P combat, server compares results)
  - Option C: ZKP/Technical enforcement (overkill for MVP)
- Key insight: gameplay moves are public data. Private = HOW the bot decides, not WHAT it decided.

**3. Security Model — Refined & Committed**
- **ADR-002: Trusted Referee** — Server handles matchmaking, combat resolution, ELO, credits. Server sees actions but never bot internals.
- **ADR-003: Privacy & Security Model** — Clear threat model:
  - Protect against: data leakage, injection attacks, user-to-user attacks
  - Out of scope: strategy reverse-engineering from public replays, aggregate pattern analysis
- **Plugin as Trust Boundary** — The OpenClaw Arena Plugin (open source, runs locally) is the gate:
  - Only passes structured data (numbers, enums) to the bot
  - Never forwards raw server strings into prompts (prevents injection)
  - Validates all incoming data against schemas
  - Users can audit the code
- **Whitelist model** — Only explicitly listed data leaves the machine. Everything else blocked by default.

**4. Architecture Doc Rewritten**
- Removed overkill: ZKP, move hashes, blind coordinator, zero trust framing
- Added: trust boundary diagram, plugin guarantees, threat model, refined session isolation
- Commit: `1919342`

### What's Still Open

**🟠 High Priority:**
1. **Challenge Protocol** (`tasks/2026-02-05-define-challenge-protocol.md`) — Still fully open, no spec.
2. **Skills system** — Skills are referenced in combat but not specced (what skills exist, effects, cooldowns).
3. **Task 000: Review & Lock Contracts** — WebSocket events and API contract are now aligned with architecture. Both sides need to review and agree.

**🟡 Medium:**
4. **Backend/Frontend split kickoff** — Tasks 001 + 002 ready to go once contracts are locked.
5. **Database schema** — `code/shared/prisma/schema.prisma` still needs to be created.

### Decisions Made

| Decision | Outcome | Rationale |
|----------|---------|-----------|
| Privacy enforcement | Architectural (not technical/ZKP) | Simpler, sufficient for threat model, upgradeable later |
| Server role | Trusted Referee | Sees gameplay actions, never sees bot internals |
| Trust boundary | OpenClaw Plugin (client-side) | Open source, auditable, sanitizes all server→bot data |
| Data model | Whitelist | Only explicitly listed data transmitted, everything else blocked |
| Combat resolution | Server-side | Easier anti-cheat, simpler architecture |
| Move/replay visibility | Public | Both players + spectators can see all moves post-match |

---

## 2025-02-06 — Day 2: Contract Alignment

### What Was Done

**1. WebSocket Events Rewritten (v0.2.0)**
- Removed client-side damage calculation
- Clients now send action choice only (action + target + signature)
- Server resolves all combat as Trusted Referee
- Added combat resolution spec: damage formula, target modifiers, action priority
- Added timeout handling (auto-defend, 3x forfeit rule)
- Added plugin privacy boundary notes with correct/incorrect examples
- Updated connection lifecycle diagram

**2. API Contract Updated (v0.2.0)**
- Version bumped, architecture reference added
- Aligned with Trusted Referee model

**3. Shared Types Updated (v0.2.0)**
- `CombatAction` no longer has `damage` field
- Added `SignedCombatAction`, `RoundResult`, `StatusEffectEvent`
- Added all WebSocket event payload types
- Added error code enum
- Added target modifier constants and damage formula reference
- Added `MatchBotState` for in-match bot representation

### Decisions Made

| Decision | Outcome | Rationale |
|----------|---------|-----------|
| Damage formula | `max(1, attack - defense * target_mod)` | Simple, predictable, minimum chip damage |
| Target system | core/armor/processor with modifiers | Adds tactical depth without complexity |
| Timeout handling | Auto-defend + 3x forfeit | Fair to opponent, penalizes AFK |
| Action priority | Speed stat + seeded tiebreaker | Deterministic, rewards speed stat investment |

---

## 2026-02-06 — Day 3: Frontend Setup (Task 002)

### What Was Done

**1. Next.js 16 App Created**
- Initialized with TypeScript + Tailwind CSS
- All dependencies installed: socket.io-client, zustand, zod, @noble/ed25519, lucide-react, react-hook-form
- Build passes with zero TypeScript errors

**2. Core Library Files**
- `lib/api.ts` — API client with JWT auth headers, points to backend at port 3001
- `lib/socket.ts` — Socket.io client with auto-reconnect, auth token passing
- `lib/store.ts` — Zustand stores:
  - `useAuthStore` — User auth state, token management, logout
  - `useMatchStore` — Match phases (idle → queuing → found → fighting → result), round history
  - `useQueueStore` — Queue state with timer
- `lib/crypto.ts` — Ed25519 keypair generation (v3 API), message signing, local key storage
- `lib/utils.ts` — Credit formatting, ELO rank calculation, duration formatting

**3. Pages Created**
- `/` — Landing page with hero section, feature cards (Privacy, Combat, Credits)
- `/register` — Registration form with local Ed25519 keypair generation, welcome bonus callout
- `/login` — Login form with username
- `/dashboard` — Full dashboard with:
  - Profile card (username, rank, ELO, wins/losses/win rate)
  - Credits card with buy link
  - Peak ELO card
  - Match finder with tier selector (Bronze through Legend)
  - Bot stats display (HP/ATK/DEF/SPD)
- `/shop` — Placeholder (ready for Task 024)
- `/leaderboard` — Placeholder (ready for backend leaderboard API)
- `/history` — Placeholder (ready for backend match history API)

**4. Architecture Alignment**
- Frontend uses Trusted Referee model ✅
- CombatAction sends action + target only (no damage) ✅
- Ed25519 signing ready for combat actions ✅
- All stores typed with `code/shared/types.ts` v0.2.0 ✅
- API client configured for backend at localhost:3001 ✅

### Task Status
- **Task 002 (Frontend Setup):** ✅ COMPLETE → Moved to tasks/done/

### What's Next for Frontend
- **Task 004:** Auth UI integration (needs backend auth API first)
- **Task 010:** Plugin setup (can start in parallel)
- **Task 005:** Dashboard polish (after auth works end-to-end)

### What Frontend Needs from Backend
- Auth API endpoints running on port 3001
- CORS enabled for localhost:3000
- WebSocket server on same port

---

## 2026-02-06 — Day 3 (continued): Backend Build

### What Was Done

**1. Backend Setup Complete (Task 001) ✅**
- Bun + Hono server on port 3001
- PostgreSQL with Prisma ORM (full schema)
- Redis client, CORS for frontend, Zod validation
- JWT auth middleware, Ed25519 verification utility
- ELO calculation, credit transaction ledger
- Seed script: 10 skills + 15 shop items
- Zero TypeScript errors

**2. Database Schema (Prisma)**
- Users (email + bcrypt password + OAuth + Ed25519 public_key)
- Bots (stats, accessories, skill slots)
- Shop items (skins, accessories with stat bonuses)
- Skills (effect_data JSON for flexibility)
- Matches (JSON replay storage)
- Credit transactions (full ledger with reason + balance)
- OAuth accounts table (Google-ready)

**3. Auth API Complete (Task 003) ✅**
- POST /api/auth/register → creates user + default bot + starter skills + 200 credit welcome bonus
- POST /api/auth/login → email + password (bcrypt)
- POST /api/auth/login-username → legacy key-only auth
- GET /api/auth/me → full profile with bots, accessories, skills

**Tasks Completed:** 001, 003 → moved to tasks/done/

### What's Done (All Backend) ✅
- [x] Shop API (list, purchase, inventory)
- [x] Bot management (register, equip/unequip items + skills, stat allocation)
- [x] Skills API (list, owned, purchase)
- [x] Matchmaking + WebSocket (queue, invites, auto-queue, full match lifecycle)
- [x] Combat engine (damage, targets, 10 skills, 8 status effects, mirror coat, shield wall)
- [x] Leaderboard API
- [x] PvE endpoints (5 AI bots)
- [x] XP + leveling + win quality bonuses
- [x] ELO system (K=32, 5 tiers)
- [x] Credit transaction ledger

### What's Still Open
- [ ] Integration testing (frontend ↔ backend)
- [ ] Training gauntlet (PvE stat bonus system)
- [ ] Challenge protocol formal spec doc

### Decisions Made (Rapid-Fire Q&A)

| Question | Decision | Notes |
|----------|----------|-------|
| Skill storage | Separate `user_skills` table ✅ | Queryable, indexable, metadata-friendly |
| Betting | Deferred post-MVP | Skip for now, won't break anything to add later |
| Match initiation | Matchmaking queue + direct invites | Users can queue or invite each other |
| Auto-queue | Yes | Bots can auto-rejoin queue after matches |
| Ready timeout | 120 seconds | Confirmed |
| Tournaments | Deferred post-MVP | Just matchmaking for now |
| Transport | WebSocket only | No REST fallback needed |
| Platform exclusivity | OpenClaw bots only | Plugin is mandatory |
| Stat system for MVP | Items + XP + performance-based | XP leveling (stat allocation), training gauntlet, win quality bonuses |
| Economy | Credits | In-game credits, not a token |
