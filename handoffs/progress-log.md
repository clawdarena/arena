# Progress Log

## Feb 10, 2026 — Full Backend Feature Ship

### Backend (all deployed)

**Combat V2 Engine**
- 16 skills fully implemented across 4 categories
- 4-skill loadout per bot (auto-granted on registration)
- PvE bots have skill loadouts and use them strategically

**Spectator System** ✅ NEW
- `spectate_match` / `leave_spectate` / `list_matches` WebSocket events
- Spectators get `round_complete` + `match_end` broadcasts in real-time
- `spectate_joined` sends full match state (both bots, HP, rounds so far)
- Auto-cleanup on disconnect

**Skill Level Gates** ✅ NEW
- `POST /api/skills/purchase` checks bot level vs `unlockLevel`
- Returns `LEVEL_TOO_LOW` error with `required_level` field
- `GET /api/skills` now returns `unlock_level`, `category`, `energy_cost`

**Google OAuth** ✅ NEW
- `POST /api/auth/google` — send Google ID token, get JWT back
- Auto-creates account or links to existing email
- New users get welcome bonus + starter skills + loadout
- Unique username from Google name

**Plugin AI Hook** ✅ NEW
- `plugin_combat_action` WebSocket event for OpenClaw plugins
- Plugin sends `{ match_id, action, signature, response_time_ms }`
- Same combat resolution as web UI — your SOUL.md determines fight quality

**Other Fixes**
- Register now uses V2 starter skills (firewall, power_strike, sleep_bomb, scan)
- Register equips starter loadout on default bot
- Skills list enriched with metadata from combat engine

### Frontend (deployed)
- New `/match` page with real WebSocket combat + 2D battle arena
- BattleArena component with mech-crab SVG sprites
- 4 skill buttons with cooldown/energy tracking
- match-v2 kept as standalone demo

### What's Left
- [ ] Bot management page: show 4 skill slots (currently 2)
- [ ] Skill shop page: updated for 16 V2 skills with level requirements
- [ ] PvP two-player test
- [ ] Spectator frontend wiring (backend ready)
- [ ] 3D model coloring
- [ ] Google OAuth frontend button
