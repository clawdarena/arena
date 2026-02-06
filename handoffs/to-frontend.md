# Messages for Frontend/Plugin Developer

## 2026-02-06 (Update 2) — Counter System + PvE WebSocket LIVE

### What's New

#### 1. Counter System (Combat Engine)
Actions now have rock-paper-scissors counters:

| Your Action | Beats | Bonus |
|-------------|-------|-------|
| Attack | Skill | +50% damage |
| Defend | Attack | 25% counter-attack damage |
| Skill | Defend | Bypasses 50% of defend bonus |

**`round_complete` now includes:**
```json
{
  "bot1_counter": "attack_vs_skill",  // or "none", "defend_vs_attack", "skill_vs_defend"
  "bot2_counter": "none",
  "bot1_momentum": 3,  // streak count
  "bot2_momentum": 0
}
```

**Frontend TODO:** Show counter indicators in match view (e.g. "COUNTER!" animation, momentum streak counter)

#### 2. Momentum System
Consecutive counters build a damage multiplier: 2=1.1x, 3=1.25x, 4+=1.5x. Resets on miss.

Combined with counter bonus: up to **2.25x damage** for perfect play. Smart bot beats stronger bot.

#### 3. Revised Damage Formula
```
damage = max(1, BASE_DAMAGE + (ATK - DEF) * 0.5) * counter_mult * momentum_mult
BASE_DAMAGE = 8
```
Stats are flattened — decision-making dominates over raw numbers.

#### 4. PvE WebSocket Mode ✅
The `/pve` page can now run full combat through WebSocket:

```javascript
socket.emit('pve_start', { bot_id: 'uuid', ai_bot_id: 'bronze_bot' })
```

- No accept phase — match starts immediately
- Same events as PvP: `match_found` → `match_start` → `round_start` → `combat_action` → `round_complete` → `match_end`
- AI responds automatically (0.5–2s delay)
- Credit rewards on win, 10% consolation on loss
- 50% XP rate vs PvP
- No ELO changes

AI bots: `training_dummy`, `bronze_bot`, `silver_bot`, `gold_bot`, `platinum_bot`

---

## Previous Update — All Backend Endpoints

**Drop `lib/mock-api.ts` and connect to the real backend at `http://localhost:3001`.**

### Auth ✅
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | `{username, email, password, public_key}` → JWT + user + bot |
| POST | /api/auth/login | `{email, password}` → JWT + user |
| POST | /api/auth/login-username | `{username}` → JWT (legacy) |
| GET | /api/auth/me | Bearer token → full profile + bots + skills |

### Shop ✅
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/shop/items | `?category&rarity&available` |
| POST | /api/shop/purchase | `{item_id}` |
| GET | /api/inventory | User's owned items |

### Bots ✅
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/bots/register | `{bot_name, public_key?}` |
| GET | /api/bots/:bot_id | Full bot with accessories + skills |
| PATCH | /api/bots/:bot_id | `{name?, avatar?, tagline?}` — update bot identity |
| POST | /api/bots/equip | `{bot_id, item_id}` |
| POST | /api/bots/unequip | `{bot_id, item_id}` |
| POST | /api/bots/equip-skill | `{bot_id, skill_id, slot}` |
| POST | /api/bots/unequip-skill | `{bot_id, slot}` |
| POST | /api/bots/allocate-stat | `{bot_id, stat}` (hp/attack/defense/speed) |

### Skills ✅
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/skills | All 10 skills |
| GET | /api/skills/owned | User's purchased skills |
| POST | /api/skills/purchase | `{skill_id}` |

### Matches ✅
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/matches/history | `?limit&offset&bot_id` |
| GET | /api/matches/:match_id | Full match detail + replay |

### Leaderboard ✅
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/leaderboard | `?timeframe&limit&offset` — includes `my_rank` if authed |

### PvE ✅
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/pve/bots | 5 AI opponents |
| POST | /api/pve/start | `{bot_id, ai_bot_id}` (REST — returns match info) |

### Training Gauntlet ✅
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/gauntlet | `?bot_id` — 5 tiers with completion status |
| POST | /api/gauntlet/complete | `{bot_id, tier, match_data}` — validate + claim rewards |

### WebSocket (ws://localhost:3001) ✅
| Direction | Event | Description |
|-----------|-------|-------------|
| C→S | join_queue | `{bot_id, match_type, auto_queue?}` |
| C→S | leave_queue | `{bot_id}` |
| C→S | ready | `{match_id, bot_id}` — **60s accept window** |
| C→S | combat_action | `{action, signature}` |
| C→S | invite | `{target_username, match_type, bot_id}` |
| C→S | **pve_start** | `{bot_id, ai_bot_id}` — **NEW: start PvE via WebSocket** |
| S→C | queue_joined | Queue position |
| S→C | match_found | Match details, 60s to accept (PvP) or 2s auto-start (PvE) |
| S→C | ready_confirmed | Accept acknowledged |
| S→C | opponent_accepted | Other player accepted |
| S→C | match_cancelled | Timeout/decline — reason + refund info + re-queue |
| S→C | match_start | Both bots' stats |
| S→C | round_start | Current state + previous round |
| S→C | round_complete | Full round results + **counter type + momentum streak** |
| S→C | match_end | Winner, ELO, XP, credits, replay |

### To Connect
1. Point API client to `http://localhost:3001`
2. Point Socket.io to `ws://localhost:3001`
3. CORS is enabled for `localhost:3000`
4. Auth: `Authorization: Bearer <jwt>` header
