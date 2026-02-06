# Messages for Frontend/Plugin Developer

## 2026-02-06 — FULL BACKEND COMPLETE 🚀

### All API Endpoints Ready

**Auth:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Email + password + public_key |
| POST | /api/auth/login | No | Email + password |
| POST | /api/auth/login-username | No | Legacy username-only |
| GET | /api/auth/me | Yes | Full profile + bots + skills |

**Shop:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/shop/items | No | List items (?category, ?rarity, ?available) |
| POST | /api/shop/purchase | Yes | Buy item {item_id} |
| GET | /api/inventory | Yes | User's owned items |

**Bots:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/bots/register | Yes | Create new bot {bot_name} |
| GET | /api/bots/:bot_id | Yes | Get bot details |
| POST | /api/bots/equip | Yes | Equip accessory/skin {bot_id, item_id} |
| POST | /api/bots/unequip | Yes | Unequip {bot_id, item_id} |
| POST | /api/bots/equip-skill | Yes | Equip skill {bot_id, skill_id, slot} |
| POST | /api/bots/unequip-skill | Yes | Clear skill slot {bot_id, slot} |
| POST | /api/bots/allocate-stat | Yes | Spend stat points {bot_id, stat} |

**Skills:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/skills | No | List all skills |
| GET | /api/skills/owned | Yes | User's owned skills |
| POST | /api/skills/purchase | Yes | Buy skill {skill_id} |

**Matches:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/matches/history | Yes | Match history (?limit, ?offset, ?bot_id) |
| GET | /api/matches/:match_id | No | Match details + replay |

**Leaderboard:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/leaderboard | No | Global rankings (?timeframe, ?limit) |

**PvE:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/pve/bots | No | List AI opponents |
| POST | /api/pve/start | Yes | Start PvE match {bot_id, ai_bot_id} |

### WebSocket Server Ready (same port: 3001)

**Events:**
| Direction | Event | Description |
|-----------|-------|-------------|
| C→S | join_queue | {bot_id, match_type, auto_queue?} |
| C→S | leave_queue | {bot_id} |
| C→S | ready | {match_id, bot_id} |
| C→S | combat_action | {action, signature} — action only, no damage |
| C→S | invite | {target_username, match_type, bot_id} |
| S→C | match_found | Match details + opponent info |
| S→C | match_start | Both bots' stats + first_mover |
| S→C | round_start | Current state + previous round |
| S→C | round_complete | Full round results |
| S→C | match_end | Winner, ELO changes, XP, replay |
| S→C | auto_queue_rejoin | Prompt to rejoin queue |
| S→C | match_invite | Incoming invite from another user |

### Combat Engine
- Full server-side resolution (Trusted Referee)
- Damage formula, target modifiers, skill system
- Status effects, cooldowns, mirror coat reflection
- XP + level system with win quality bonuses
- 3x timeout = forfeit, auto-defend on timeout

### What's Left
- Integration testing between frontend/plugin and backend
- Polish and bug fixes
