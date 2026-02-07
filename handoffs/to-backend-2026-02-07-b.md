# Frontend → Backend Handoff — 2026-02-07 (Part 2)

**Commit:** pending push
**From:** SK (Frontend)

## New Backend Endpoints Added (need deploy)

### 1. `GET /api/players/:username` — Public Player Profile
**File:** `code/backend/src/routes/players.ts` (NEW)
**Registered in:** `code/backend/src/index.ts` as `/api/players`

Returns:
```json
{
  "user": { "id", "username", "created_at" },
  "bot": { "id", "name", "avatar", "tagline", "level", "xp", "base_hp/atk/def/spd" },
  "stats": { "elo", "peak_elo", "wins", "losses", "draws", "win_rate", "matches_played", "streak" },
  "recent_matches": [{ "id", "result", "opponent", "match_type", "rounds_fought", "elo_change", "created_at" }]
}
```
- No auth required (public profiles)
- Streak calculated from recent match results
- Returns 404 if username not found

### 2. `GET /api/matches/active` — Live Matches for Spectators  
**File:** `code/backend/src/routes/matches.ts` (added before `:match_id` route)

Returns:
```json
{
  "matches": [{ "id", "match_type", "bot1": { "name", "hp" }, "bot2": { "name", "hp" }, "round", "started_at" }],
  "total": 3
}
```
- No auth required
- Queries matches with `status: 'in_progress'`
- Max 20 results, ordered by most recent

## Action Items for Plata

1. **Deploy backend** — Both endpoints are written and registered, just need `railway up` or push to trigger auto-deploy
2. **Run migration** — `20260206_bot_identity` adds `avatar` + `tagline` columns to bots table (if not already run)
3. **ELO tier validation** — Add to `join_queue` handler (code provided in previous handoff `to-backend-2026-02-07.md`)

## Already Working (no action needed)
- Strategy editor — saves to localStorage (never hits server, privacy preserved)
- DQS/Bonuses display — hits existing `GET /api/bots/:bot_id/bonuses` 
- All 16 frontend pages build clean, 0 errors
