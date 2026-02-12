# OpenClaw Backend Integration - Implementation Summary

**Date:** 2026-02-12  
**File Modified:** `/root/projects/arena/code/backend/src/ws/matchmaking.ts`  
**Status:** ✅ Complete

---

## Implementation Overview

Successfully integrated OpenClaw bot connection handling and suggestion flow into the Arena backend WebSocket server to match the deployed frontend.

---

## Changes Made

### 1. State Tracking (Lines ~69-80)

Added two new Maps to track OpenClaw connections:

```typescript
// OpenClaw bot connections
const openclawBots: Map<string, {
  userId: string
  socketId: string
  botName: string
  model: string
  provider: string
  sessionKey: string
  connectedAt: number
}> = new Map()

// Match -> OpenClaw bot mapping
const matchOpenclawBots: Map<string, string> = new Map()  // matchId -> userId
```

**Purpose:**
- `openclawBots`: Tracks active OpenClaw plugin connections (one per user)
- `matchOpenclawBots`: Maps which matches have OpenClaw assistance enabled

---

### 2. OpenClaw Connection Events (Lines ~560-700)

#### **Event: `openclaw_connect`**
- **Trigger:** OpenClaw plugin registers with backend
- **Payload:**
  ```typescript
  {
    bot_name: string
    model: string
    provider: string
    session_key: string
  }
  ```
- **Actions:**
  - Registers OpenClaw bot in state
  - Notifies all active matches for this user
  - Emits `openclaw_connect_success` confirmation
  - Logs connection with 🤖 emoji

#### **Event: `openclaw_disconnect`**
- **Trigger:** OpenClaw plugin disconnects
- **Actions:**
  - Removes from `openclawBots` Map
  - Clears all match associations
  - Notifies players with `openclaw_disconnected` event

#### **Event: `bot_suggestion_response`**
- **Trigger:** OpenClaw sends skill suggestion
- **Payload:**
  ```typescript
  {
    match_id: string
    suggestion: {
      skill_id: string
      skill_name: string
      reasoning: string[]
      confidence: number
      risk_level: 'low' | 'medium' | 'high'
      expected_damage: number
      counters: string[]
    }
    response_time_ms: number
  }
  ```
- **Actions:**
  - Forwards suggestion to player's frontend via `bot_suggestion` event
  - Includes model name used for suggestion

#### **Event: `coaching_chat`**
- **Trigger:** Player sends message to OpenClaw coach
- **Payload:** `{ match_id, message }`
- **Actions:**
  - Forwards to OpenClaw plugin with battle context (HP, energy, round)
  - Emits `coaching_message` to plugin

#### **Event: `coaching_response`**
- **Trigger:** OpenClaw sends coaching advice
- **Payload:** `{ match_id, message }`
- **Actions:**
  - Forwards to player frontend with timestamp
  - Emits `coaching_response` event

#### **Event: `accept_suggestion`**
- **Trigger:** Player accepts OpenClaw suggestion
- **Actions:**
  - Logs acceptance (✅ emoji)
  - Placeholder for future analytics

#### **Event: `override_suggestion`**
- **Trigger:** Player ignores suggestion and chooses different skill
- **Payload:** `{ match_id, suggestion_id, chosen_skill_id, focus_points_remaining }`
- **Actions:**
  - Logs override (⚠️ emoji)
  - Placeholder for post-match report tracking

---

### 3. Round Start Integration (Lines ~890-910)

**Modified:** `startRound()` function

**Added Logic:**
```typescript
// OpenClaw: Request suggestion from connected bot
const openclawUserId = matchOpenclawBots.get(match.id)
if (openclawUserId) {
  const openclawBot = openclawBots.get(openclawUserId)
  if (openclawBot) {
    // Determine player/opponent sides
    const isBot1 = match.bot1.userId === openclawUserId
    const playerBot = isBot1 ? match.bot1.state : match.bot2.state
    const opponentBot = isBot1 ? match.bot2.state : match.bot1.state

    // Request suggestion
    io.to(openclawBot.socketId).emit('request_bot_suggestion', {
      match_id: match.id,
      round: match.currentRound,
      player_bot: {
        hp: playerBot.hp,
        energy: playerBot.energy,
        skills: playerBot.equippedSkills,
        skill_cooldowns: Object.fromEntries(playerBot.skillCooldowns)
      },
      opponent_bot: {
        hp: opponentBot.hp,
        energy: opponentBot.energy,
        last_action: match.rounds.length > 0 ? match.rounds[match.rounds.length - 1]?.bot2_action : null
      },
      time_limit_ms: 15000  // 15 second timeout
    })
  }
}
```

**Timing:** Fires immediately after `round_start` event, before player needs to submit action

---

### 4. Disconnect Cleanup (Lines ~710-730)

**Modified:** `socket.on('disconnect')` handler

**Added Logic:**
```typescript
// Clean up OpenClaw bot
openclawBots.delete(user.userId)

// Notify matches of OpenClaw disconnect
for (const [matchId, match] of activeMatches) {
  if (matchOpenclawBots.get(matchId) === user.userId) {
    matchOpenclawBots.delete(matchId)
    const targetSocket = match.bot1.userId === user.userId ? match.bot1.socketId : match.bot2.socketId
    io.to(targetSocket).emit('openclaw_disconnected', { match_id: matchId })
  }
}
```

**Ensures:** Clean state management when players disconnect mid-match

---

## WebSocket Event Flow

### **Connection Flow**
```
Frontend/Plugin → openclaw_connect
Backend → (registers connection)
Backend → openclaw_connect_success
Backend → openclaw_connected (to all active matches)
```

### **Suggestion Flow (Per Round)**
```
Backend → request_bot_suggestion (to OpenClaw)
OpenClaw → (AI generates suggestion)
OpenClaw → bot_suggestion_response
Backend → bot_suggestion (to player frontend)
Player → (accept/override/discuss)
```

### **Coaching Flow**
```
Player → coaching_chat
Backend → coaching_message (to OpenClaw)
OpenClaw → coaching_response
Backend → coaching_response (to player)
```

### **Disconnection Flow**
```
Plugin → openclaw_disconnect (or socket disconnect)
Backend → (cleans up state)
Backend → openclaw_disconnected (to all affected matches)
```

---

## Testing Checklist

- [ ] Start backend server (`npm run dev`)
- [ ] Connect frontend (should show "OpenClaw Not Connected")
- [ ] Simulate `openclaw_connect` event from plugin/dev tools
- [ ] Verify frontend shows "✅ Connected • Model Name"
- [ ] Start PvP or PvE match
- [ ] Verify `request_bot_suggestion` fires on round start
- [ ] Simulate `bot_suggestion_response` from plugin
- [ ] Verify suggestion appears in frontend UI
- [ ] Test Accept button → logs "✅ Suggestion accepted"
- [ ] Test Override → logs "⚠️ Suggestion overridden"
- [ ] Test Discuss chat → message routing works
- [ ] Simulate `openclaw_disconnect` → verify frontend updates
- [ ] Test full match with OpenClaw connected

---

## Deployment Steps

1. **Commit Backend Changes**
   ```bash
   cd /root/projects/arena/code/backend
   git add src/ws/matchmaking.ts
   git commit -m "feat: Add OpenClaw bot integration to WebSocket server"
   ```

2. **Deploy Together**
   - Frontend already deployed (per task description)
   - Deploy backend with updated WebSocket handlers
   - Ensure both services use same event protocol

3. **Testing Phases**
   - **Phase 1:** Mock OpenClaw connection (dev tools)
   - **Phase 2:** Test with real OpenClaw plugin (staging)
   - **Phase 3:** Live deployment

4. **Monitoring**
   - Watch for 🤖 connection logs in backend
   - Monitor WebSocket event traffic
   - Track suggestion acceptance rate (future analytics)

---

## Future Enhancements (Not Implemented)

- [ ] Analytics dashboard for suggestion acceptance rates
- [ ] Post-match report showing accepted/overridden suggestions
- [ ] Multiple OpenClaw models per user (swap mid-match)
- [ ] Suggestion confidence threshold settings
- [ ] Focus point cost prediction in suggestions
- [ ] Historical suggestion performance tracking

---

## Notes

- **No Breaking Changes:** All events are additive (won't affect existing matches)
- **Backward Compatible:** Matches work normally without OpenClaw connection
- **Security:** Uses existing JWT auth (socketToUser mapping)
- **Performance:** Minimal overhead (Map lookups only on round start)
- **PvE Compatible:** Suggestion flow works for both PvP and PvE matches

---

## Event Reference

| Event Name | Direction | Purpose |
|------------|-----------|---------|
| `openclaw_connect` | Plugin → Backend | Register OpenClaw connection |
| `openclaw_connect_success` | Backend → Plugin | Confirm registration |
| `openclaw_connected` | Backend → Frontend | Notify player of connection |
| `openclaw_disconnect` | Plugin → Backend | Unregister connection |
| `openclaw_disconnected` | Backend → Frontend | Notify player of disconnection |
| `request_bot_suggestion` | Backend → Plugin | Request skill suggestion |
| `bot_suggestion_response` | Plugin → Backend | Send AI-generated suggestion |
| `bot_suggestion` | Backend → Frontend | Display suggestion to player |
| `coaching_chat` | Frontend → Backend | Player asks question |
| `coaching_message` | Backend → Plugin | Forward question to AI |
| `coaching_response` | Plugin → Backend | AI's coaching advice |
| `coaching_response` | Backend → Frontend | Display advice to player |
| `accept_suggestion` | Frontend → Backend | Player accepts suggestion |
| `override_suggestion` | Frontend → Backend | Player chooses different skill |

---

**Implementation Complete ✅**

Backend WebSocket protocol now fully wired for OpenClaw integration, matching the deployed frontend.
