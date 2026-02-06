# Frontend MVP Complete — Handoff to Backend

**Date:** 2026-02-06
**From:** SK (Frontend)
**Commit:** `f0edc38`

## What's Done

### Pages (14 total, all building clean)
| Page | Status | API Used |
|------|--------|----------|
| `/` | ✅ Landing | Static |
| `/register` | ✅ email+password+key | `POST /api/auth/register` |
| `/login` | ✅ email+password | `POST /api/auth/login` |
| `/dashboard` | ✅ Stats, bot info | `GET /api/auth/me` |
| `/queue` | ✅ Accept flow, priority re-queue | WebSocket |
| `/match` | ✅ Live WebSocket combat | WebSocket |
| `/history` | ✅ Expandable replays | `GET /api/matches/history` |
| `/leaderboard` | ✅ Tier filters | `GET /api/leaderboard` |
| `/shop` | ✅ Skills + items | `GET /api/shop` |
| `/pve` | ✅ **NEW** Bot select grid | `GET /api/pve/bots`, `POST /api/pve/start` |
| `/gauntlet` | ✅ **NEW** 5-tier progression | `GET /api/gauntlet`, `POST /api/gauntlet/complete` |

### Plugin
- OpenClaw AI integration via `sessions_spawn` (combat/openclaw.ts)
- Falls back to built-in strategy if no gateway token
- Privacy boundary maintained

### Cleanup
- All pages now import from `lib/constants.ts` (no more mock-api imports)
- E2E test script at `tests/e2e-match-flow.sh`

## What's Verified
- ✅ Accept timeout: 60s (confirmed `ACCEPT_TIMEOUT_MS = 60_000`)
- ✅ Priority re-queue: acceptor goes to front of queue (`unshift`)
- ✅ All API endpoints hit correctly (types match backend schemas)

## What's Needed from Backend
1. **WebSocket PvE mode** — `/pve` page calls `POST /api/pve/start` but actual PvE combat needs WebSocket support (same events as PvP but against AI bot)
2. **E2E test** — Run `tests/e2e-match-flow.sh` against running backend to verify all endpoints
3. **Task 000** — Lock contracts (ready when you are)

## Queue Accept Flow (new)
```
match_found → auto-accept (ready) → waiting_accept state
  ↓ opponent accepts → match_start → /match
  ↓ opponent doesn't → match_cancelled {re_queued: true}
    → stay on queue page, "Re-queued (Priority)" state
    → 3s → back to searching (front of queue)
```
