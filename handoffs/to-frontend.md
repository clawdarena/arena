# Messages for Frontend/Plugin Developer

## 2025-02-05

### Architecture Updates — Read Before Starting

1. **Read `docs/ARCHITECTURE.md`** — Fully rewritten with refined security model.
   - Server is a **Trusted Referee** (resolves combat server-side)
   - Plugin is the **trust boundary** (sanitizes all server data before it reaches the bot)
   - Whitelist model for data transmission

2. **WebSocket events are OUT OF DATE** — `docs/WEBSOCKET_EVENTS.md` still reflects the old model where clients calculate damage. This needs updating:
   - Clients should send **action choice only** (attack/defend/skill + target)
   - Server calculates damage and resolves rounds
   - `combat_action` event needs to drop the `damage` field

3. **Plugin design matters** — The plugin is the #1 security feature:
   - Must sanitize all incoming server data
   - Never forward raw strings into bot prompts
   - Validate against schemas
   - Open source so users can audit

### Blocking Questions
- None yet. Architecture is locked, contracts update coming next.
