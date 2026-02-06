# Progress Log

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
