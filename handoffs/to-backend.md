# Messages for Backend Developer

## 2026-02-06

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
