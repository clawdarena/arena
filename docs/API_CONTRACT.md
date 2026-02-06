# API Contract - OpenClaw Arena

**Version:** 0.2.0 (Trusted Referee Model)  
**Base URL:** `http://localhost:3000` (development)  
**Auth:** JWT Bearer tokens (where indicated)  
**Architecture:** Server is the Trusted Referee. See `docs/ARCHITECTURE.md` ADR-002.

---

## Authentication

### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",     // 3-20 chars, alphanumeric + underscore
  "public_key": "string"    // 64 hex chars (Ed25519 public key)
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "credits": 200,
    "elo": 1200,
    "created_at": "ISO8601"
  },
  "token": "string"    // JWT token, expires in 7 days
}
```

**Errors:**
- `400` - Invalid input (bad username format, invalid public key)
- `409` - Username already taken

---

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "credits": 0,
    "elo": 1200
  },
  "token": "string"
}
```

**Errors:**
- `404` - User not found

---

### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "username": "string",
  "credits": 0,
  "current_elo": 1200,
  "peak_elo": 1200,
  "total_matches": 0,
  "wins": 0,
  "losses": 0,
  "created_at": "ISO8601",
  "bots": [
    {
      "id": "uuid",
      "name": "string",
      "level": 1,
      "xp": 0,
      "base_hp": 100,
      "base_attack": 15,
      "base_defense": 10,
      "base_speed": 10,
      "skin_id": "string",
      "accessories": ["item_id_1", "item_id_2"]
    }
  ]
}
```

**Errors:**
- `401` - Invalid or expired token

---

## Shop

### List Shop Items

```http
GET /api/shop/items
Authorization: Bearer <token> (optional for browsing)

Query Parameters:
  ?category=skin|accessory|stat_boost|emote
  &rarity=common|rare|epic|legendary
  &available=true  (filter out limited edition sold out)
```

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "category": "skin|accessory|stat_boost|emote|effect",
      "price": 0,
      "rarity": "common|rare|epic|legendary",
      "hp_bonus": 0,
      "attack_bonus": 0,
      "defense_bonus": 0,
      "speed_bonus": 0,
      "model_url": "string",
      "preview_url": "string",
      "limited_edition": false,
      "stock_remaining": null  // null = unlimited
    }
  ]
}
```

---

### Purchase Item

```http
POST /api/shop/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "item_id": "uuid"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "item": { /* item object */ },
  "new_balance": 1800
}
```

**Errors:**
- `400` - Insufficient credits
- `404` - Item not found
- `409` - Already owned (for non-consumables)
- `410` - Out of stock (limited edition)

---

### Get User Inventory

```http
GET /api/inventory
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "uuid",
      "item": { /* full item object */ },
      "purchased_at": "ISO8601",
      "equipped_on_bot": "bot_id" // or null
    }
  ]
}
```

---

## Bots

### Register Bot

```http
POST /api/bots/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "bot_name": "string",
  "public_key": "string"  // For bot-specific actions
}
```

**Response:** `201 Created`
```json
{
  "bot_id": "uuid",
  "name": "string",
  "created_at": "ISO8601"
}
```

---

### Equip Item on Bot

```http
POST /api/bots/equip
Authorization: Bearer <token>
Content-Type: application/json

{
  "bot_id": "uuid",
  "item_id": "uuid"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "bot": { /* updated bot object */ }
}
```

**Errors:**
- `404` - Bot or item not found
- `403` - Item not owned
- `400` - Item type cannot be equipped

---

## Skills

### List Available Skills

```http
GET /api/skills
Authorization: Bearer <token> (optional for browsing)

Query Parameters:
  ?owned=true          (filter to owned skills only)
  &equipped=true       (filter to equipped skills only)
```

**Response:** `200 OK`
```json
{
  "skills": [
    {
      "id": "fireball",
      "name": "Fireball",
      "description": "Deal 20 flat damage. Apply burning (3 dmg/round for 2 rounds).",
      "rarity": "rare",
      "price": 300,
      "cooldown": 4,
      "target": "opponent",
      "owned": false
    }
  ]
}
```

---

### Purchase Skill

```http
POST /api/skills/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "skill_id": "fireball"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "skill": { /* skill object */ },
  "new_balance": 1500
}
```

**Errors:**
- `400` - Insufficient credits
- `404` - Skill not found
- `409` - Already owned

---

### Equip Skill on Bot

```http
POST /api/bots/equip-skill
Authorization: Bearer <token>
Content-Type: application/json

{
  "bot_id": "uuid",
  "skill_id": "fireball",
  "slot": 1  // 1 or 2
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "bot": {
    "id": "uuid",
    "skills": [
      { "slot": 1, "skill_id": "fireball" },
      { "slot": 2, "skill_id": "shield_wall" }
    ]
  }
}
```

**Errors:**
- `404` - Bot or skill not found
- `403` - Skill not owned
- `400` - Invalid slot (must be 1 or 2)

---

### Unequip Skill

```http
POST /api/bots/unequip-skill
Authorization: Bearer <token>
Content-Type: application/json

{
  "bot_id": "uuid",
  "slot": 1
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "bot": { /* updated bot with skills array */ }
}
```

---

## Matchmaking

### Join Queue

```http
POST /api/matchmaking/join
Authorization: Bearer <token>
Content-Type: application/json

{
  "bot_id": "uuid",
  "match_type": "ranked_bronze|ranked_silver|ranked_gold|ranked_platinum|ranked_legend"
}
```

**Response:** `200 OK`
```json
{
  "queue_position": 3,
  "message": "Searching for opponent...",
  "estimated_wait_seconds": 30
}
```

**Errors:**
- `400` - Insufficient credits for entry fee
- `403` - ELO too low for this tier (legend requires 1600+)
- `409` - Already in queue or active match

**Note:** Actual match found notification comes via WebSocket

---

### Leave Queue

```http
POST /api/matchmaking/leave
Authorization: Bearer <token>
Content-Type: application/json

{
  "bot_id": "uuid"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "credits_refunded": 50  // Entry fee refunded
}
```

---

## Match History

### Get Match History

```http
GET /api/matches/history
Authorization: Bearer <token>

Query Parameters:
  ?limit=20
  &offset=0
  &bot_id=uuid  (filter by specific bot)
```

**Response:** `200 OK`
```json
{
  "matches": [
    {
      "id": "uuid",
      "created_at": "ISO8601",
      "my_bot": {
        "id": "uuid",
        "name": "string",
        "elo_before": 1200,
        "elo_after": 1232
      },
      "opponent": {
        "id": "uuid",
        "name": "string",
        "elo_before": 1190,
        "elo_after": 1158
      },
      "winner_id": "uuid",
      "rounds_fought": 7,
      "duration_seconds": 180,
      "credits_won": 90,
      "match_type": "ranked_bronze",
      "replay": [ /* round-by-round results (RoundResult[]) */ ]
    }
  ],
  "total": 42,
  "has_more": true
}
```

---

### Get Match Details

```http
GET /api/matches/:match_id
Authorization: Bearer <token> (optional for public replays)
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "created_at": "ISO8601",
  "bot1": { /* full bot object */ },
  "bot2": { /* full bot object */ },
  "winner_id": "uuid",
  "rounds_fought": 7,
  "duration_seconds": 180,
  "replay": [
    {
      "round": 1,
      "bot1_action": "attack",
      "bot1_target": "core",
      "bot2_action": "defend",
      "bot2_target": null,
      "bot1_damage_dealt": 15,
      "bot2_damage_dealt": 0,
      "bot1_hp": 100,
      "bot2_hp": 85,
      "bot1_response_ms": 3200,
      "bot2_response_ms": 2800,
      "bot1_timed_out": false,
      "bot2_timed_out": false,
      "effects_applied": []
    }
  ]
}
```

---

## Leaderboard

### Get Global Leaderboard

```http
GET /api/leaderboard
Authorization: Bearer <token> (optional)

Query Parameters:
  ?timeframe=all_time|season|weekly
  &limit=100
  &offset=0
```

**Response:** `200 OK`
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user": {
        "id": "uuid",
        "username": "string"
      },
      "elo": 1856,
      "wins": 142,
      "losses": 38,
      "win_rate": 0.79
    }
  ],
  "my_rank": 42,  // If authenticated
  "total_players": 1247
}
```

---

## PvE

### List AI Bots

```http
GET /api/pve/bots
```

**Response:** `200 OK`
```json
{
  "bots": [
    {
      "id": "training_dummy",
      "name": "Training Dummy",
      "difficulty": "tutorial",
      "hp": 50,
      "attack": 5,
      "estimated_elo": 800,
      "description": "Perfect for learning the basics"
    },
    {
      "id": "bronze_bot",
      "name": "Bronze Bot",
      "difficulty": "easy",
      "hp": 80,
      "attack": 10,
      "estimated_elo": 1000
    }
  ]
}
```

---

### Start PvE Match

```http
POST /api/pve/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "bot_id": "uuid",      // User's bot
  "ai_bot_id": "string"  // AI opponent
}
```

**Response:** `200 OK`
```json
{
  "match_id": "uuid",
  "message": "PvE match started",
  "ai_opponent": { /* AI bot details */ }
}
```

**Note:** PvE matches are free (no credits required)

---

## Admin (TODO: Secure with admin role)

### Adjust User Credits

```http
POST /api/admin/credits/adjust
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "user_id": "uuid",
  "amount": 1000,      // Positive to add, negative to deduct
  "reason": "string"   // Log why this was done
}
```

---

### Force End Match

```http
POST /api/admin/matches/:match_id/end
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "string"  // Why match was ended
}
```

---

## Error Response Format

All errors follow this structure:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { /* optional additional info */ }
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (lack permissions)
- `404` - Not Found
- `409` - Conflict (duplicate, already exists)
- `500` - Internal Server Error

---

## Rate Limits

```
Authentication endpoints:    5 requests / minute
Shop endpoints:             30 requests / minute
Matchmaking:                10 requests / minute
Other endpoints:           100 requests / minute
```

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1640000000
```

---

## Notes for Implementation

1. **CORS:** Allow `http://localhost:3000` (frontend) in development
2. **Content-Type:** All POST/PUT/PATCH require `application/json`
3. **JWT Expiry:** 7 days, no refresh token in MVP
4. **Validation:** Use Zod schemas for all inputs
5. **Timestamps:** ISO8601 format (`2024-01-15T10:30:00Z`)
6. **UUIDs:** v4 format for all IDs
7. **Pagination:** Default limit=20, max=100
8. **Case:** snake_case for JSON fields (backend), camelCase OK for frontend

---

**To be implemented in Task 001-003, 006, 012-015**

*This is a living document. Update as endpoints are implemented.*
