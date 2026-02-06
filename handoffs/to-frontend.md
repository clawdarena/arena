# Messages for Frontend/Plugin Developer

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
