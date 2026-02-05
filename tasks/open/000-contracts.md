# Task 000: Define Core Contracts

**Owner:** Both (Together)  
**Priority:** 🔴 CRITICAL - Must complete first  
**Estimated:** 2 days  
**Depends on:** None  
**Blocks:** All other tasks

## Objective

Define the API contracts, WebSocket events, and database schema that both agents will use. This is the foundation - get this right to prevent integration bugs later.

## Deliverables

- [ ] `docs/API_CONTRACT.md` - All REST endpoints defined
- [ ] `docs/WEBSOCKET_EVENTS.md` - All real-time events defined
- [ ] `code/shared/prisma/schema.prisma` - Database schema
- [ ] `code/shared/types.ts` - TypeScript types (generated from above)
- [ ] `docs/ARCHITECTURE.md` - System design diagram

## Work Together On

### 1. API Contract
Define every REST endpoint:
- Authentication (`POST /api/auth/register`, `/login`)
- User management (`GET /api/users/me`)
- Shop (`GET /api/shop/items`, `POST /api/shop/purchase`)
- Bots (`POST /api/bots/register`, `POST /api/bots/equip`)
- Matchmaking (`POST /api/matchmaking/join`)

### 2. WebSocket Events
Define every real-time event:
- `match_found` (server → client)
- `round_start` (server → client)
- `combat_action` (client → server)
- `round_complete` (server → client)
- `match_end` (server → client)

### 3. Database Schema
Design tables:
- `users` (id, username, credits, elo, ...)
- `bots` (id, user_id, name, customization, stats, ...)
- `matches` (id, bot1_id, bot2_id, winner_id, ...)
- `shop_items` (id, name, price, rarity, ...)
- `user_inventory` (id, user_id, item_id, ...)
- `bets` (id, match_id, user_id, amount, ...)

## Acceptance Criteria

- [ ] Both agents reviewed and agreed on all contracts
- [ ] TypeScript types compile without errors
- [ ] Prisma schema is valid (`npx prisma validate`)
- [ ] No ambiguity in event structures
- [ ] All field types clearly defined (string vs number vs enum)

## Coordination

**How to work together:**
1. Agent A creates initial draft of API_CONTRACT.md
2. Agent A commits → pushes
3. Agent B pulls → reviews → suggests changes via comments
4. Iterate until both agree
5. Repeat for WebSocket events and DB schema

**Use handoffs/ if you disagree:**
- Create `handoffs/contract-discussion.md` with questions
- Other agent responds with answers
- Resolve before proceeding

## Notes

⚠️ **Do NOT skip this task!** Getting contracts wrong = weeks of rework.

✅ **Spend 2 full days here.** It's worth it.

💡 **Think about edge cases:**
- What happens if user disconnects mid-match?
- What if both players submit actions at exact same time?
- How do we handle invalid signatures?

## When Done

1. Move this file to `tasks/done/000-contracts.md`
2. Post in Telegram: "Contracts complete! Ready for parallel development."
3. Both agents can now pick their domain-specific tasks independently
