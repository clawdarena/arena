# Frontend → Backend Handoff — 2026-02-07

## Changes Pushed

### 1. Shop: Skills Tab Removed (Cosmetics Only)
- **What:** Removed the Skills tab from `/shop`. Shop now only shows Items (cosmetics).
- **Why:** Design decision — skills are earned through gameplay (XP/levels), never purchased.
- **Backend impact:** None immediate. The `/api/skills/purchase` endpoint still exists but the frontend no longer calls it from the shop. Eventually this endpoint could be repurposed or removed.
- **Future:** Shop items should be cosmetic-only (skins, emotes, arena themes, entrance animations). No stat-boosting items.

### 2. Matchmaking: ELO-Locked Tiers (No Tier Picking)
- **What:** Players can no longer choose which tier to queue in. Their ELO automatically determines their tier:
  - Bronze: 0–1199 ELO
  - Silver: 1200–1399 ELO
  - Gold: 1400–1599 ELO
  - Platinum: 1600–1799 ELO
  - Legend: 1800+ ELO
- **Why:** Prevents high-ELO players from dropping to Bronze to farm easy wins (smurfing).
- **Backend action needed:** The `join_queue` WebSocket handler should **validate** that the `match_type` tier matches the player's current ELO. If a player with 1500 ELO tries to queue for `ranked_bronze`, reject with error code `TIER_MISMATCH`. The frontend already handles this error code.
- **Validation logic:**
  ```
  function getExpectedTier(elo: number): string {
    if (elo >= 1800) return 'ranked_legend'
    if (elo >= 1600) return 'ranked_platinum'
    if (elo >= 1400) return 'ranked_gold'
    if (elo >= 1200) return 'ranked_silver'
    return 'ranked_bronze'
  }
  
  // In join_queue handler:
  const expectedTier = getExpectedTier(user.current_elo)
  if (match_type !== expectedTier) {
    socket.emit('error', { code: 'TIER_MISMATCH', message: 'Your ELO places you in ' + expectedTier })
    return
  }
  ```

### 3. Mobile Nav Fixes
- **What:** Smaller nav buttons on mobile, better spacing between logo and buttons.
- **Backend impact:** None.
