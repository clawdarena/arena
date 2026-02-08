# Backend Handoff: Cosmetic-Only Shop System

## Overview
The frontend shop has been completely rebuilt as a **cosmetic-only** shop. No stat-boosting items exist. All items are purely visual — zero gameplay advantage.

The frontend is ready and working with local state. It needs these backend changes to persist data.

---

## 1. Replace ALL Current Shop Items

**Remove or zero out** all existing shop items with `hp_bonus`, `attack_bonus`, `defense_bonus`, `speed_bonus`. Replace with the cosmetic items below.

Every item must have:
- `id` (string, unique)
- `name` (string)
- `description` (string)
- `category` (enum: `skin` | `taunt` | `dance` | `arena` | `entrance`)
- `price` (integer, 0 = free default)
- `rarity` (enum: `common` | `rare` | `epic` | `legendary`)
- `metadata` (JSON object, varies by category)
- `hp_bonus = 0`, `attack_bonus = 0`, `defense_bonus = 0`, `speed_bonus = 0` (all zeroed)

---

## 2. Item Data (seed/migrate these)

### SKINS (category: `skin`)
Metadata format: `{"color": "#hex", "colorAlt": "#hex"}`

| ID | Name | Price | Rarity | Color | ColorAlt |
|---|---|---|---|---|---|
| skin_neon_blue | Neon Blue | 0 (default) | common | #00f0ff | #001a33 |
| skin_crimson_fury | Crimson Fury | 200 | common | #ff2020 | #330808 |
| skin_shadow_ops | Shadow Ops | 200 | common | #444444 | #111111 |
| skin_toxic_waste | Toxic Waste | 500 | rare | #39ff14 | #0a3300 |
| skin_royal_gold | Royal Gold | 500 | rare | #ffd700 | #332b00 |
| skin_arctic_frost | Arctic Frost | 500 | rare | #b0e0ff | #1a2a33 |
| skin_sunset_blaze | Sunset Blaze | 1000 | epic | #ff6b00 | #331500 |
| skin_phantom_purple | Phantom Purple | 1000 | epic | #9b30ff | #1f0a33 |
| skin_prismatic | Prismatic | 5000 | legendary | #ff69b4 | #330a1f |
| skin_obsidian | Obsidian | 5000 | legendary | #1a1a1a | #080808 |

### TAUNTS (category: `taunt`)
Metadata format: `{"text": "display text", "emoji": "emoji"}`

| ID | Name | Price | Rarity | Text |
|---|---|---|---|---|
| taunt_gg_ez | GG EZ | 100 | common | GG EZ |
| taunt_get_rekt | Get Rekt | 100 | common | Get rekt |
| taunt_calculated | Calculated. | 100 | common | Calculated. |
| taunt_fighting | You Call That Fighting? | 500 | rare | You call that fighting? |
| taunt_grandma | Grandma Hits Harder | 500 | rare | My grandma hits harder |
| taunt_barely_tried | I Barely Tried | 1200 | epic | I barely tried |
| taunt_overlord | Bow Before Your Overlord | 3000 | legendary | Bow before your overlord |

### VICTORY DANCES (category: `dance`)
Metadata format: `{"animation": "name", "emoji": "emoji"}`

| ID | Name | Price | Rarity | Animation |
|---|---|---|---|---|
| dance_basic | Basic Victory | 0 (default) | common | basic |
| dance_robot_spin | Robot Spin | 300 | common | robot_spin |
| dance_claw_snap | Claw Snap | 300 | common | claw_snap |
| dance_moonwalk | Moonwalk | 800 | rare | moonwalk |
| dance_breakdance | Breakdance | 800 | rare | breakdance |
| dance_dab | Dab | 1500 | epic | dab |
| dance_floss | Floss | 1500 | epic | floss |
| dance_tpose | T-Pose Dominance | 4000 | legendary | tpose |

### ARENA THEMES (category: `arena`)
Metadata format: `{"theme": "name", "color1": "#hex", "color2": "#hex"}`

| ID | Name | Price | Rarity | Theme |
|---|---|---|---|---|
| arena_default | Default Arena | 0 (default) | common | default |
| arena_neon_city | Neon City | 500 | rare | neon_city |
| arena_space_station | Space Station | 500 | rare | space_station |
| arena_volcanic | Volcanic | 1000 | epic | volcanic |
| arena_underwater | Underwater | 1000 | epic | underwater |
| arena_matrix | Matrix | 3500 | legendary | matrix |

### ENTRANCE EFFECTS (category: `entrance`)
Metadata format: `{"effect": "name", "emoji": "emoji"}`

| ID | Name | Price | Rarity | Effect |
|---|---|---|---|---|
| entrance_standard | Standard | 0 (default) | common | standard |
| entrance_lightning | Lightning Strike | 300 | common | lightning |
| entrance_teleport | Teleport Glitch | 500 | rare | teleport |
| entrance_fire | Fire Rise | 1000 | epic | fire |
| entrance_portal | Portal | 3000 | legendary | portal |

---

## 3. New Endpoints Required

### `POST /api/bots/equip-cosmetic`
Equip a cosmetic item to a bot.

**Request:**
```json
{
  "bot_id": "uuid",
  "item_id": "skin_crimson_fury",
  "slot": "skin"  // "skin" | "taunt" | "dance" | "arena" | "entrance"
}
```

**Validation:**
- User must own the item (purchased or default/free)
- Item category must match slot
- One item per slot (replacing existing)

**Response:**
```json
{
  "success": true,
  "equipped": {
    "slot": "skin",
    "item_id": "skin_crimson_fury"
  }
}
```

### `GET /api/bots/:id/cosmetics`
Get all equipped cosmetics for a bot.

**Response:**
```json
{
  "cosmetics": {
    "skin": "skin_neon_blue",
    "taunt": null,
    "dance": "dance_basic",
    "arena": "arena_default",
    "entrance": "entrance_standard"
  }
}
```

### `GET /api/shop/owned`
Get all items the current user owns.

**Response:**
```json
{
  "items": ["skin_neon_blue", "dance_basic", "arena_default", "entrance_standard", "skin_crimson_fury"]
}
```

### `POST /api/shop/purchase` (existing — update to handle new items)
Purchase a cosmetic item.

**Request:**
```json
{
  "item_id": "skin_crimson_fury"
}
```

**Response:**
```json
{
  "success": true,
  "new_balance": 1800,
  "item": { ... }
}
```

---

## 4. Database Changes

### Option A: Update `shop_items` table
- Zero out all stat bonus columns
- Add `metadata JSONB` column for category-specific data
- Update `category` enum to: `skin`, `taunt`, `dance`, `arena`, `entrance`

### Option B: New `cosmetic_items` table
```sql
CREATE TABLE cosmetic_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('skin', 'taunt', 'dance', 'arena', 'entrance')),
  price INTEGER NOT NULL DEFAULT 0,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Equipped cosmetics tracking
```sql
CREATE TABLE bot_cosmetics (
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  slot TEXT NOT NULL CHECK (slot IN ('skin', 'taunt', 'dance', 'arena', 'entrance')),
  item_id TEXT REFERENCES cosmetic_items(id),
  equipped_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (bot_id, slot)
);
```

### Owned items tracking
```sql
CREATE TABLE user_cosmetics (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES cosmetic_items(id),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);
```

---

## 5. Important Notes

- **ZERO gameplay advantage.** No stat bonuses. Ever. This is cosmetic only.
- Default/free items (price=0) should be automatically "owned" by all users without needing a purchase.
- The frontend works with local state as fallback if endpoints don't exist yet.
- Frontend file with all item data: `lib/cosmetics.ts` — use this as the source of truth for seeding.
