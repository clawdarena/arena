# Messages for Backend Developer

## 2026-02-06

### Plugin Setup Complete (Task 010) ✅

1. **OpenClaw Arena Plugin** — CLI tool in `code/plugin/`
   - TypeScript, builds with zero errors
   - CLI commands: `arena register`, `arena join`, `arena status`
   - Ed25519 key management (generate, store locally, sign actions)
   - Socket.io client for match events
   - Combat executor with privacy boundary enforced

2. **CLI Commands:**
   - `arena register <name> --username <user>` — Register bot + generate keys
   - `arena join --type ranked_bronze` — Join matchmaking queue
   - `arena status` — Show bot info + live stats from server

3. **Combat Flow (Local Execution):**
   - Receives `round_start` → builds safe prompt (no raw server strings)
   - Sends prompt to local bot → parses response
   - Signs action with private key → sends ONLY action + target to server
   - Full bot response stays local (never transmitted)

4. **Privacy Boundary Enforced:**
   - ✅ Prompt built from structured data only (numbers, enums)
   - ✅ Bot reasoning never leaves machine
   - ✅ Private key stored in OS config dir (never in git)
   - ✅ Action signing with Ed25519

5. **TODO for full integration:**
   - [ ] OpenClaw `sessions_spawn` / `sessions_send` integration (currently uses placeholder)
   - [ ] Local SQLite combat log storage
   - [ ] Skills support (when specced)

### What Plugin Needs from Backend
- [ ] WebSocket server accepting `join_queue`, `ready`, `combat_action` events
- [ ] Auth API for `arena register` command
- [ ] Match coordinator sending `round_start`, `round_complete`, `match_end`

---

### Frontend Setup Complete (Task 002) ✅

1. **Next.js 16 app** — Running in `code/frontend/`
   - TypeScript + Tailwind CSS
   - All dependencies installed (socket.io-client, zustand, zod, ed25519, etc.)
   - Build passes with zero errors

2. **Pages created:**
   - `/` — Landing page (hero, features)
   - `/register` — Registration with local Ed25519 keypair generation
   - `/login` — Login form
   - `/dashboard` — Main dashboard (stats, match finder, bot info, tier selector)
   - `/shop` — Placeholder
   - `/leaderboard` — Placeholder
   - `/history` — Placeholder

3. **Lib utilities ready:**
   - `lib/api.ts` — API client with JWT auth (points to `localhost:3001`)
   - `lib/socket.ts` — Socket.io client for match events
   - `lib/store.ts` — Zustand stores (auth, match state, queue)
   - `lib/crypto.ts` — Ed25519 keypair generation + message signing
   - `lib/utils.ts` — Formatters (credits, ELO, ranks, durations)

4. **Shared types imported** from `code/shared/types.ts` ✅

### What Frontend Needs from Backend

- [ ] Auth API endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- [ ] API running on port 3001 (frontend API client configured for that)
- [ ] WebSocket server on same port (socket.io)
- [ ] CORS enabled for frontend dev server (port 3000)

### Architecture Alignment

- Frontend uses **Trusted Referee** model as specced
- `CombatAction` sends action + target only (no damage) ✅
- Ed25519 signing ready for combat actions ✅
- All stores aligned with `code/shared/types.ts` v0.2.0 ✅

---

## 2025-02-06

### Contracts Updated — Ready for Review

1. **WebSocket events v0.2.0** — Fully aligned with Trusted Referee model:
   - `combat_action` sends action choice only (no damage)
   - All event payloads fully typed in `code/shared/types.ts`
   - Plugin privacy boundary documented with correct/incorrect examples
   - See `docs/WEBSOCKET_EVENTS.md`

2. **Plugin privacy is critical** — Read the "Plugin Implementation Notes" section in WebSocket events:
   - ✅ Pass only structured data to bot (numbers, enums)
   - ❌ Never pass raw server strings into bot prompts
   - Validate all incoming data against schemas
   - Example code included

3. **Mock server included** — WebSocket events doc has a mock server snippet for plugin development.

4. **Shared types v0.2.0** — Import from `code/shared/types.ts`:
   - `CombatAction` — what the plugin sends
   - `SignedCombatAction` — signed wrapper
   - `MatchFoundPayload`, `RoundStartPayload`, etc. — all event shapes

### Open Items for Frontend/Plugin
- [ ] Skills UI — skills referenced but not specced yet
- [ ] How does the plugin spawn a local OpenClaw session? (needs design)
- [ ] Bot prompt construction — how does the plugin turn game state into a prompt?

---

## 2025-02-05

### Architecture Updates — Read Before Starting

1. **Read `docs/ARCHITECTURE.md`** — Server is a **Trusted Referee**. Plugin is the **trust boundary**.
2. **Whitelist model** — Only explicitly listed data leaves the machine. Plugin enforces this.
