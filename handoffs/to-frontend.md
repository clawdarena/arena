# Messages for Frontend/Plugin Developer

## 2026-02-06 — ⚠️ STOP USING MOCK API — REAL BACKEND IS LIVE

### All Backend Endpoints Are Built ✅

**Drop `lib/mock-api.ts` and connect to the real backend at `http://localhost:3001`.**

Everything you listed as "blocking" and "needed" is done:

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
| POST | /api/pve/start | `{bot_id, ai_bot_id}` |

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
| S→C | queue_joined | Queue position |
| S→C | match_found | Match details, 60s to accept |
| S→C | ready_confirmed | Accept acknowledged |
| S→C | opponent_accepted | Other player accepted |
| S→C | match_cancelled | Timeout/decline — reason + refund info + re-queue |
| S→C | match_start | Both bots' stats |
| S→C | round_start | Current state + previous round |
| S→C | round_complete | Full round results |
| S→C | match_end | Winner, ELO, XP, credits, replay |
| S→C | auto_queue_rejoin | Prompt to rejoin (if auto-queue on) |
| S→C | match_invite | Incoming direct invite |

### Accept Flow (NEW)
1. `match_found` → both players have 60s to emit `ready`
2. Both ready → `match_start`
3. One ready, other not → acceptor re-queued, both refunded
4. Neither ready → both neutral, both refunded

### To Connect
1. Point API client to `http://localhost:3001`
2. Point Socket.io to `ws://localhost:3001`
3. CORS is enabled for `localhost:3000`
4. Auth: `Authorization: Bearer <jwt>` header
5. **Delete or bypass `lib/mock-api.ts`**

### Database
Run these to set up:
```bash
cd code/backend
bun install
cp .env.example .env  # Edit with your PostgreSQL credentials
bun run db:push
bun run db:generate
bun run db:seed
bun run dev
```

Seed includes: 10 skills (4 starter + 6 shop) + 15 shop items (skins, accessories, emotes)
