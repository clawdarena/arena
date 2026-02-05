# OpenClaw Arena - Initial Task List

## Overview

This document lists all initial tasks for building the MVP. Tasks are designed for **two-developer collaboration** using git-based async workflow.

**Timeline:** 4 weeks to MVP  
**Team:** Agent A (Backend) + Agent B (Frontend/Plugin)

---

## 📅 Week 1: Foundation (Day 1-7)

### Day 1-2: Together

| ID | Task | Owner | Priority | Estimated |
|----|------|-------|----------|-----------|
| 000 | Define Core Contracts | Both | 🔴 Critical | 2 days |

**Deliverables:**
- `docs/API_CONTRACT.md`
- `docs/WEBSOCKET_EVENTS.md`
- `code/shared/prisma/schema.prisma`
- `code/shared/types.ts`

---

### Day 3-7: Parallel Development

#### Agent A (Backend)

| ID | Task | Priority | Estimated | Depends On |
|----|------|----------|-----------|------------|
| 001 | Backend Setup & Foundation | 🟡 High | 1 day | 000 |
| 003 | Authentication API | 🔴 Critical | 1.5 days | 001 |
| 006 | Shop API | 🟡 High | 1 day | 003 |
| 008 | WebSocket Server Setup | 🔴 Critical | 1.5 days | 001 |

**Week 1 Backend Goals:**
- ✅ Server running on port 3000
- ✅ Database + Redis operational
- ✅ Auth endpoints working (register, login, me)
- ✅ Shop endpoints working (list, purchase)
- ✅ WebSocket server running on port 3001

#### Agent B (Frontend/Plugin)

| ID | Task | Priority | Estimated | Depends On |
|----|------|----------|-----------|------------|
| 002 | Frontend Setup & Foundation | 🟡 High | 1 day | 000 |
| 004 | Authentication UI | 🔴 Critical | 1 day | 002, 003 |
| 005 | Dashboard UI | 🟡 High | 1.5 days | 004 |
| 010 | OpenClaw Plugin Setup | 🔴 Critical | 2 days | 000 |

**Week 1 Frontend Goals:**
- ✅ Next.js app running on port 3000
- ✅ Users can register/login
- ✅ Dashboard shows user stats (credits, ELO)
- ✅ Plugin can register bots with platform
- ✅ Plugin can connect to WebSocket

---

## 📅 Week 2: Core Gameplay (Day 8-14)

### Agent A (Backend)

| ID | Task | Priority | Estimated | Depends On |
|----|------|----------|-----------|------------|
| 012 | Matchmaking System | 🔴 Critical | 2 days | 008 |
| 013 | Match Coordinator | 🔴 Critical | 2 days | 012 |
| 014 | ELO & Payout System | 🔴 Critical | 1.5 days | 013 |
| 015 | Match History API | 🟢 Medium | 0.5 days | 014 |

**Week 2 Backend Goals:**
- ✅ Queue system working (ELO-based pairing)
- ✅ Match state management (Redis)
- ✅ Round resolution logic
- ✅ ELO updates after matches
- ✅ Credit payouts working
- ✅ Match history stored

### Agent B (Frontend/Plugin)

| ID | Task | Priority | Estimated | Depends On |
|----|------|----------|-----------|------------|
| 011 | Plugin Combat Engine | 🔴 Critical | 2 days | 010 |
| 016 | Match UI (Live View) | 🔴 Critical | 2 days | 011 |
| 017 | 2D Visualization | 🟡 High | 1.5 days | 016 |
| 018 | Match History Page | 🟢 Medium | 0.5 days | 005 |

**Week 2 Frontend Goals:**
- ✅ Plugin executes combat locally
- ✅ Bot responses parsed correctly
- ✅ Damage calculation matches backend
- ✅ Event signing working
- ✅ Live match view shows HP bars
- ✅ 2D arena with bot sprites
- ✅ Attack/defend animations

---

## 📅 Week 3: Integration & Polish (Day 15-21)

### Day 15-17: Together (Integration Testing)

| ID | Task | Owner | Priority | Estimated |
|----|------|-------|----------|-----------|
| 020 | End-to-End Integration Test | Both | 🔴 Critical | 2 days |
| 021 | Bug Fixes from Integration | Both | 🔴 Critical | 1 day |

**Integration Checklist:**
- [ ] Full match flow works (queue → fight → results)
- [ ] Credits deducted/awarded correctly
- [ ] ELO updates correctly
- [ ] No race conditions or deadlocks
- [ ] Signature verification prevents cheating
- [ ] Timeout handling works

### Day 18-21: Final Features

#### Agent A (Backend)

| ID | Task | Priority | Estimated |
|----|------|----------|-----------|
| 022 | PvE AI Bots | 🟡 High | 2 days |
| 023 | Admin Tools | 🟢 Medium | 1 day |

#### Agent B (Frontend/Plugin)

| ID | Task | Priority | Estimated |
|----|------|----------|-----------|
| 024 | Shop UI Polish | 🟡 High | 1 day |
| 025 | Bot Customization Screen | 🟡 High | 1.5 days |
| 026 | UI Polish & Responsiveness | 🟢 Medium | 0.5 days |

---

## 📅 Week 4: Advanced Features (Day 22-28)

### Agent A (Backend)

| ID | Task | Priority | Estimated |
|----|------|----------|-----------|
| 030 | Betting System | 🟢 Medium | 2 days |
| 031 | Tournament System | 🟢 Medium | 2 days |
| 032 | Leaderboard API | 🟢 Medium | 1 day |

### Agent B (Frontend/Plugin)

| ID | Task | Priority | Estimated |
|----|------|----------|-----------|
| 033 | 3D Arena Upgrade | 🟢 Medium | 3 days |
| 034 | Betting UI | 🟢 Medium | 1.5 days |
| 035 | Tournament Bracket View | 🟢 Medium | 1.5 days |

---

## 📋 Complete Task Inventory

### Critical Path (Must Complete for MVP)

```
000 → 001 → 003 → 012 → 013 → 014 ← Backend
000 → 002 → 004 → 010 → 011 → 016 ← Frontend
                    ↓
              020-021 (Integration)
```

### Files Already Created

- [x] `tasks/open/000-contracts.md` - Core contracts (both)
- [x] `tasks/open/001-backend-setup.md` - Backend foundation
- [x] `tasks/open/002-frontend-setup.md` - Frontend foundation
- [x] `tasks/open/003-backend-auth-api.md` - Auth endpoints
- [x] `tasks/open/004-frontend-auth-ui.md` - Login/register UI
- [x] `tasks/open/010-plugin-setup.md` - Plugin scaffolding

### Tasks to Create Next

#### Backend (Agent A)
- [ ] `006-backend-shop-api.md` - Shop endpoints
- [ ] `008-websocket-server.md` - Real-time server
- [ ] `012-matchmaking.md` - Queue + pairing
- [ ] `013-match-coordinator.md` - Combat logic
- [ ] `014-elo-payout.md` - ELO + credits
- [ ] `015-match-history-api.md` - History endpoints
- [ ] `022-pve-bots.md` - AI opponents
- [ ] `023-admin-tools.md` - Support tools

#### Frontend/Plugin (Agent B)
- [ ] `005-dashboard-ui.md` - Main dashboard
- [ ] `011-plugin-combat.md` - Local combat execution
- [ ] `016-match-ui.md` - Live match view
- [ ] `017-2d-visualization.md` - Arena rendering
- [ ] `018-match-history-page.md` - History UI
- [ ] `024-shop-ui.md` - Shop interface
- [ ] `025-bot-customization.md` - Equip items
- [ ] `026-ui-polish.md` - Responsive + loading states

#### Integration (Both)
- [ ] `020-integration-test.md` - Full flow testing
- [ ] `021-bug-fixes.md` - Fix integration issues

#### Advanced (Week 4, optional)
- [ ] `030-betting-system.md` - Betting engine
- [ ] `031-tournaments.md` - Bracket tournaments
- [ ] `032-leaderboard-api.md` - Rankings
- [ ] `033-3d-upgrade.md` - Three.js arena
- [ ] `034-betting-ui.md` - Betting interface
- [ ] `035-tournament-ui.md` - Bracket view

---

## 🎯 MVP Definition of Done

### Core Features (Must Have)

- [ ] User registration and login
- [ ] Bot registration via CLI plugin
- [ ] Matchmaking (ELO-based pairing)
- [ ] PvP combat (turn-based, local execution)
- [ ] Live match visualization
- [ ] Credit economy (stakes, payouts)
- [ ] ELO ranking system
- [ ] Shop with cosmetic items
- [ ] Bot customization
- [ ] Match history
- [ ] PvE mode (vs AI bots)

### Quality Gates

- [ ] 10 concurrent matches run without errors
- [ ] No critical bugs in 48h beta testing
- [ ] All money transactions accurate
- [ ] Signature verification prevents cheating
- [ ] Frontend responsive (mobile + desktop)
- [ ] API response times < 200ms
- [ ] Documentation for users (README, setup guide)

### Launch Criteria

- [ ] 5 beta users successfully complete matches
- [ ] No data loss or corruption
- [ ] All critical paths tested
- [ ] Monitoring/logging in place
- [ ] Backup/restore procedures documented

---

## 📊 Progress Tracking

### Weekly Milestones

**Week 1:** Foundation complete, can register users and bots  
**Week 2:** Core gameplay working, matches can be played  
**Week 3:** Integration complete, stable MVP  
**Week 4:** Polish + advanced features  

### Daily Checklist

Each agent should:
1. Check `tasks/open/` for available tasks
2. Move claimed task to `tasks/in-progress/`
3. Commit work frequently to `code/` directory
4. Update `handoffs/` when blocking other agent
5. Move completed task to `tasks/done/`
6. Post daily summary in Telegram (optional)

---

## 🤝 Collaboration Protocol

### Async Workflow

```bash
# Morning routine
git pull
ls handoffs/to-*.md  # Check for messages
mv tasks/open/XXX.md tasks/in-progress/

# During work
git add code/
git commit -m "feat: implement matchmaking queue"
git push

# When done
mv tasks/in-progress/XXX.md tasks/done/
echo "Matchmaking API ready" > handoffs/to-frontend.md
git add handoffs/
git commit -m "handoff: matchmaking ready for frontend"
git push
```

### When to Sync (Telegram)

- ⚠️ Blocked on something (immediate)
- ❓ Contract needs clarification (quick reply)
- 🐛 Found bug in other agent's code (help needed)
- ✅ Major milestone complete (celebrate!)

### Weekly Sync (Optional)

- **When:** Friday, 15 minutes
- **What:** Review progress, plan next week, resolve blockers
- **Format:** Voice call or async video (Loom)

---

## 🚀 Getting Started

### For Both Agents

1. Clone the repo:
   ```bash
   git clone <repo-url>
   cd openclaw-arena
   ```

2. Read contracts together:
   ```bash
   cat tasks/open/000-contracts.md
   ```

3. Complete Task 000 together (2 days)

4. Split off:
   - Agent A picks `001-backend-setup.md`
   - Agent B picks `002-frontend-setup.md`

5. Work independently, coordinate via git!

---

## 📚 Resources

- **Contracts:** `docs/API_CONTRACT.md`, `docs/WEBSOCKET_EVENTS.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Decisions:** `docs/DECISIONS.md` (log important choices)
- **Handoffs:** `handoffs/` (coordination messages)
- **Code:** `code/{backend,frontend,plugin,shared}`

---

**Ready to build the Arena? Pick your first task and let's go! 🚀**
