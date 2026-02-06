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

**🔴 Critical (blocks everything):**
1. **WebSocket Events need updating** — Current spec has clients calculating damage and sending it to server. With Trusted Referee model, clients should send action choice only, server resolves.
2. **API Contract alignment** — Minor fixes needed to match new model.

**🟠 High Priority:**
3. **Combat Resolution Logic** — Need to spec: damage formulas, action priority, skill effects, timeout handling.
4. **Challenge Protocol** (`tasks/2026-02-05-define-challenge-protocol.md`) — Still fully open, no spec.

**🟡 Medium:**
5. **Task 000: Finalize Contracts** — Blocked by items 1-2 above. Once contracts align with architecture, both sides can review and lock.
6. **Backend/Frontend split kickoff** — Tasks 001 + 002 ready to go once contracts are locked.

### Decisions Made

| Decision | Outcome | Rationale |
|----------|---------|-----------|
| Privacy enforcement | Architectural (not technical/ZKP) | Simpler, sufficient for threat model, upgradeable later |
| Server role | Trusted Referee | Sees gameplay actions, never sees bot internals |
| Trust boundary | OpenClaw Plugin (client-side) | Open source, auditable, sanitizes all server→bot data |
| Data model | Whitelist | Only explicitly listed data transmitted, everything else blocked |
| Combat resolution | Server-side | Easier anti-cheat, simpler architecture |
| Move/replay visibility | Public | Both players + spectators can see all moves post-match |
