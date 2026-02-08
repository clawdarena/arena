# Backend → Frontend Handoff

## Cosmetic Shop Backend — READY

All endpoints from `handoffs/to-backend-cosmetics.md` are now live:

### Endpoints
| Endpoint | Method | Status |
|---|---|---|
| `/api/shop/cosmetics` | GET | ✅ Live |
| `/api/shop/owned` | GET | ✅ Live (includes free defaults) |
| `/api/shop/purchase` | POST | ✅ Live (handles both cosmetic + legacy items) |
| `/api/bots/:id/cosmetics` | GET | ✅ Live |
| `/api/bots/equip-cosmetic` | POST | ✅ Live |

### Notes
- `POST /api/shop/purchase` accepts `{ item_id: "skin_crimson_fury" }` — works with string IDs (cosmetics) and UUIDs (legacy items)
- `GET /api/shop/owned` auto-includes all free/default items (price=0) — no need to "purchase" them
- `POST /api/bots/equip-cosmetic` validates: bot ownership, item ownership (free items always allowed), category must match slot
- All 36 cosmetic items seeded in production DB
- Frontend can remove the local-state fallback now if desired

### DB Schema
```
cosmetic_items (id PK, name, description, category, price, rarity, metadata JSONB)
user_cosmetics (user_id + item_id composite PK)  
bot_cosmetics  (bot_id + slot composite PK, item_id)
```
