# Progress Log

## Feb 10, 2026 — Combat V2 + Live Match Wiring

### Backend (deployed)
- Combat V2 engine: 16 skills fully implemented
- 4-skill loadout (was 2), auto-granted on bot registration
- PvE bots now have skill loadouts and use skills strategically
- WebSocket events enriched: skills in match_start, cooldowns in round_start, skill_id in round_complete
- Seed: free skills granted to all existing users, starter loadout on all 10 bots

### Frontend (deployed)
- **New `/match` page**: Real WebSocket combat with 2D battle arena
  - Mech-crab SVG sprites (from match-v2)
  - Attack/defend + 4 skill buttons with cooldown/energy tracking
  - Round animation queue synced to server events
  - Arena themes, screen shake, counter banners, damage floats
  - Action log with color-coded entries
  - Victory/defeat/draw result screen with XP/credits/ELO
- **BattleArena component**: Extracted reusable arena with sprites, effects, HP panels
- **constants.ts**: Updated to V2 skills (16), restored tier/leaderboard types
- **match-v2** kept as standalone demo (not connected to backend)

### What's Left
- [ ] Match-v2 demo still exists separately (could redirect or remove)
- [ ] Bot management page needs 4 skill slots (currently shows 2)
- [ ] Skill shop page needs updating for 16 V2 skills
- [ ] PvP two-player test (need 2 accounts in queue simultaneously)
- [ ] Spectator backend (frontend shell exists, no server handler)
- [ ] 3D model coloring (still unsolved)
- [ ] Bot AI decision-making for OpenClaw plugin integration
