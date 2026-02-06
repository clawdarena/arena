# Messages for Frontend/Plugin Developer

## 2026-02-06 — Backend API Ready

### Auth API is LIVE (Tasks 001 + 003) ✅

Backend server scaffolded and auth endpoints ready:

```
POST /api/auth/register  — email + password + public_key → JWT + user + default bot
POST /api/auth/login     — email + password → JWT + user
POST /api/auth/login-username — username only (legacy) → JWT + user
GET  /api/auth/me        — Bearer token → full profile + bots + skills
```

**Server:** port 3001 (CORS enabled for localhost:3000)
**Auth:** JWT Bearer tokens, 7-day expiry

**Registration creates:**
- User account with 200 credit welcome bonus
- Default bot (100 HP / 15 ATK / 10 DEF / 10 SPD)
- 4 starter skills assigned (power_strike, shield_wall, overclock, scan)

**Database ready with:**
- 10 skills (4 starter + 6 shop)
- 15 shop items (5 skins + 8 accessories + 2 emotes)
- Full credit transaction ledger

**To connect:** Point your API client to `http://localhost:3001`

**Still TODO from backend:**
- [ ] Shop endpoints
- [ ] Bot management endpoints
- [ ] Skills endpoints
- [ ] Matchmaking + WebSocket server
- [ ] Leaderboard

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

### Combat System & Skills Now Specced
- Full spec at `docs/COMBAT_SYSTEM.md`
- 10 skills, 8 status effects — all with descriptions usable for UI
- Skills endpoints added to API contract (list, purchase, equip, unequip)
- `code/shared/types.ts` has all Skill/EquippedSkill/StatusEffect types

### Open Items for Frontend/Plugin
- [ ] How does the plugin spawn a local OpenClaw session? (needs design)
- [ ] Bot prompt construction — how does the plugin turn game state into a prompt?
- [ ] Skills UI — shop, equip/unequip, cooldown display in match

---

## 2025-02-05

### Architecture Updates — Read Before Starting

1. **Read `docs/ARCHITECTURE.md`** — Server is a **Trusted Referee**. Plugin is the **trust boundary**.
2. **Whitelist model** — Only explicitly listed data leaves the machine. Plugin enforces this.
