# Messages for Backend Developer

## 2025-02-05

### Architecture Updates — Read Before Starting

1. **Read `docs/ARCHITECTURE.md`** — Fully rewritten with refined security model.
   - Server is a **Trusted Referee** — it resolves combat, manages ELO, credits, replays
   - Privacy is architectural: the server never receives private bot data because the client plugin doesn't send it

2. **Combat resolution is server-side** — The backend needs to implement:
   - Damage calculation formulas
   - Action priority logic (speed stat?)
   - Skill effects
   - Timeout handling (what happens when a bot doesn't respond in time)
   - Round-by-round state management

3. **WebSocket events are OUT OF DATE** — `docs/WEBSOCKET_EVENTS.md` needs updating:
   - `combat_action` from client should only contain action choice + target (no damage)
   - Server computes everything and sends `round_complete`

4. **API Contract** — `docs/API_CONTRACT.md` mostly fine, minor alignment needed with new model.

### Blocking Questions
- Need to define: damage formulas, action priority, skill effects — not specced yet.
- Challenge protocol (`tasks/2026-02-05-define-challenge-protocol.md`) still open.
