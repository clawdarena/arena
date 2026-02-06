# Messages for Backend Developer

## 2025-02-06

### Contracts Updated — Ready for Review

1. **WebSocket events v0.2.0** — Fully aligned with Trusted Referee model:
   - `combat_action` from client now contains action + target only (no damage)
   - Server resolves combat: damage formula, target modifiers, action priority all specced
   - Timeout handling: auto-defend, 3x forfeit
   - See `docs/WEBSOCKET_EVENTS.md`

2. **Shared types v0.2.0** — All WebSocket payload types defined:
   - `CombatAction`, `SignedCombatAction`, `RoundResult`
   - `MatchFoundPayload`, `MatchStartPayload`, `RoundStartPayload`, etc.
   - Target modifier constants + damage formula reference
   - See `code/shared/types.ts`

3. **Combat resolution is fully specced** — Damage formula, target modifiers (core/armor/processor), defend mechanic, timeout rules. Ready to implement.

### Combat System Specced
- Full spec at `docs/COMBAT_SYSTEM.md` — damage formula, target modifiers, skills, ELO, PvE bots
- 10 skills specced (4 starter + 6 shop), 8 status effects
- Round resolution flow fully documented (ready to implement)
- Skills endpoints added to API contract (list, purchase, equip, unequip)

### Open Items for Backend
- [ ] Database schema (`code/shared/prisma/schema.prisma`) — needs to be created
- [ ] Challenge protocol — `tasks/2026-02-05-define-challenge-protocol.md` still open

---

## 2025-02-05

### Architecture Updates — Read Before Starting

1. **Read `docs/ARCHITECTURE.md`** — Fully rewritten with refined security model.
   - Server is a **Trusted Referee** — it resolves combat, manages ELO, credits, replays
   - Privacy is architectural: the server never receives private bot data because the client plugin doesn't send it

2. **Combat resolution is server-side** — The backend needs to implement:
   - Damage calculation formulas ✅ SPECCED
   - Action priority logic (speed stat) ✅ SPECCED
   - Skill effects — NOT YET SPECCED
   - Timeout handling ✅ SPECCED
   - Round-by-round state management ✅ SPECCED
