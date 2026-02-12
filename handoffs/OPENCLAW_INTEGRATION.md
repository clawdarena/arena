# OpenClaw Arena Integration - Backend Specification

**Status:** Ready for Implementation  
**Priority:** High  
**Owner:** Plata (Backend Team)

---

## Overview

This document specifies the backend WebSocket protocol for integrating OpenClaw AI coaching bots with Arena combat matches. The frontend has been updated to support this integration and gracefully degrades when OpenClaw is not connected.

## Architecture

```
┌─────────────┐         WebSocket          ┌─────────────┐
│   Frontend  │◄───────────────────────────►│   Backend   │
│  (Browser)  │                             │   (Server)  │
└─────────────┘                             └──────┬──────┘
                                                   │
                                            WebSocket
                                                   │
                                            ┌──────▼──────┐
                                            │  OpenClaw   │
                                            │     Bot     │
                                            └─────────────┘
```

## WebSocket Protocol

### Server → Client Events

#### `openclaw_connected`
Emitted when an OpenClaw bot successfully connects to a match.

**Payload:**
```typescript
{
  match_id: string           // Match identifier
  bot_name: string          // Bot display name (e.g., "Wolf's Coach")
  model: string             // Model ID (e.g., "claude-opus-4-6", "groq-llama-3-3-70b")
  provider: string          // Provider name (e.g., "anthropic", "groq")
  session_key: string       // Session identifier for this connection
}
```

**Example:**
```json
{
  "match_id": "match_abc123",
  "bot_name": "Wolf's Coach",
  "model": "claude-opus-4-6",
  "provider": "anthropic",
  "session_key": "session_xyz789"
}
```

---

#### `openclaw_disconnected`
Emitted when an OpenClaw bot disconnects from a match.

**Payload:**
```typescript
{
  match_id: string
  reason?: string           // Optional disconnect reason
}
```

**Example:**
```json
{
  "match_id": "match_abc123",
  "reason": "Client timeout"
}
```

---

#### `bot_suggestion`
Emitted when OpenClaw bot provides a skill recommendation.

**Payload:**
```typescript
{
  match_id: string
  round: number
  suggestion: {
    skill_id: string              // Skill identifier (e.g., "power_strike")
    skill_name: string            // Human-readable name
    reasoning: string[]           // Array of reasoning points
    confidence: number            // 0-100
    risk_level: 'low' | 'medium' | 'high'
    expected_damage: number       // Estimated damage
    counters: string[]            // Skills that counter this choice
  }
  response_time_ms: number        // Bot response latency
  model_used: string              // Model that generated suggestion
}
```

**Example:**
```json
{
  "match_id": "match_abc123",
  "round": 5,
  "suggestion": {
    "skill_id": "reasoning_burst",
    "skill_name": "Reasoning Burst",
    "reasoning": [
      "Opponent HP critical (28/100)",
      "High damage finishing move",
      "Energy sufficient (75/100)"
    ],
    "confidence": 92,
    "risk_level": "low",
    "expected_damage": 35,
    "counters": ["mirror_coat", "rollback"]
  },
  "response_time_ms": 1247,
  "model_used": "claude-opus-4-6"
}
```

---

#### `coaching_response`
Emitted when OpenClaw bot responds to a coaching chat message.

**Payload:**
```typescript
{
  match_id: string
  message: string
  timestamp: number             // Unix timestamp (ms)
}
```

**Example:**
```json
{
  "match_id": "match_abc123",
  "message": "Your opponent has been using aggressive moves consistently. Consider using Mirror Coat to counter their next attack and regain momentum.",
  "timestamp": 1739385600000
}
```

---

### Client → Server Events

#### `accept_suggestion`
Emitted when player accepts the bot's suggestion.

**Payload:**
```typescript
{
  match_id: string
  suggestion_id: string         // Frontend-generated ID from suggestion
}
```

**Example:**
```json
{
  "match_id": "match_abc123",
  "suggestion_id": "openclaw_5_1739385600000"
}
```

**Backend Action:**
- Track acceptance for analytics
- No Focus Point cost

---

#### `override_suggestion`
Emitted when player overrides the bot's suggestion (costs 1 Focus Point).

**Payload:**
```typescript
{
  match_id: string
  suggestion_id: string
  chosen_skill_id: string       // Skill the player chose instead
  focus_points_remaining: number
}
```

**Example:**
```json
{
  "match_id": "match_abc123",
  "suggestion_id": "openclaw_5_1739385600000",
  "chosen_skill_id": "firewall",
  "focus_points_remaining": 2
}
```

**Backend Action:**
- Track override decision
- Store for post-match analytics
- Validate Focus Point deduction

---

#### `coaching_chat`
Emitted when player sends a message to the coaching bot.

**Payload:**
```typescript
{
  match_id: string
  message: string
}
```

**Example:**
```json
{
  "match_id": "match_abc123",
  "message": "Should I save energy or go aggressive?"
}
```

**Backend Action:**
- Rate limit: max 10 messages per match
- Forward to OpenClaw bot with context
- Return `coaching_response` with bot's answer

---

### Server → OpenClaw Bot Events

#### `request_bot_suggestion`
Sent to OpenClaw bot when a new round starts and player needs a suggestion.

**Payload:**
```typescript
{
  match_id: string
  round: number
  player_bot: {
    hp: number
    energy: number
    skills: Array<{
      id: string
      name: string
      energyCost: number
      cooldown: number
      damage_range: [number, number]
      category: 'aggressive' | 'defensive' | 'tactical' | 'exploit'
    }>
    skill_cooldowns: Record<string, number>    // skill_id → rounds remaining
  }
  opponent_bot: {
    hp: number
    energy: number
    last_action?: string
  }
  match_history: {
    player_decisions: string[]    // Last 5 moves
    opponent_decisions: string[]  // Last 5 moves
  }
  time_limit_ms: 15000           // OpenClaw must respond within 15s
}
```

**Example:**
```json
{
  "match_id": "match_abc123",
  "round": 5,
  "player_bot": {
    "hp": 78,
    "energy": 65,
    "skills": [
      {
        "id": "power_strike",
        "name": "Power Strike",
        "energyCost": 10,
        "cooldown": 0,
        "damage_range": [15, 25],
        "category": "aggressive"
      }
    ],
    "skill_cooldowns": {
      "reasoning_burst": 2
    }
  },
  "opponent_bot": {
    "hp": 45,
    "energy": 80,
    "last_action": "defend"
  },
  "match_history": {
    "player_decisions": ["power_strike", "defend", "emp_pulse", "reasoning_burst", "power_strike"],
    "opponent_decisions": ["power_strike", "power_strike", "defend", "firewall", "defend"]
  },
  "time_limit_ms": 15000
}
```

**OpenClaw Response:** Must emit `bot_suggestion` back to server.

**Timeout Handling:** If OpenClaw doesn't respond within 15 seconds:
- Server auto-picks a safe defensive move
- Notify player: "⚠️ Bot timeout - auto-picked safe move"

---

#### `coaching_message`
Forward coaching chat from player to OpenClaw bot.

**Payload:**
```typescript
{
  match_id: string
  message: string
  context: {
    current_hp: number
    current_energy: number
    round: number
  }
}
```

**Example:**
```json
{
  "match_id": "match_abc123",
  "message": "Should I save energy or go aggressive?",
  "context": {
    "current_hp": 78,
    "current_energy": 65,
    "round": 5
  }
}
```

**OpenClaw Response:** Must emit `coaching_response` back to server.

---

## Backend Implementation Checklist

### Phase 1: Core Integration
- [ ] **OpenClaw Bot Registration**
  - API endpoint: `POST /api/arena/openclaw/register`
  - Link user account to OpenClaw session
  - Store session key, model, provider
  - Validate authentication token

- [ ] **Connection Management**
  - Track connected OpenClaw bots per user
  - Handle WebSocket connection lifecycle
  - Heartbeat/keepalive for OpenClaw connections
  - Clean up on disconnect

- [ ] **Suggestion Request Flow**
  - On `round_start`, check if user has OpenClaw connected
  - If yes, emit `request_bot_suggestion`
  - Receive `bot_suggestion` from OpenClaw
  - Forward to frontend via `bot_suggestion` event

- [ ] **Suggestion Validation**
  - Verify suggested skill is legal (not on cooldown, sufficient energy)
  - Validate timing (suggestion received before round timeout)
  - Reject invalid suggestions, log for debugging

### Phase 2: Analytics & Tracking
- [ ] **Decision Tracking**
  - Store accept/override decisions in database
  - Track override reasons (implicit from chosen skill)
  - Calculate success rate: (Accept + Successful Override) / Total Suggestions

- [ ] **Post-Match Analytics**
  - Generate report: accepted vs overridden suggestions
  - Track win rate when following bot vs overriding
  - Store for user profile "Coaching Stats" page

### Phase 3: Advanced Features
- [ ] **Timeout Handling**
  - If OpenClaw doesn't respond in 15s, auto-pick safe move
  - Notify player: "⚠️ Bot timeout - auto-picked [skill]"
  - Log timeout for debugging

- [ ] **Rate Limiting**
  - Coaching chat: max 10 messages per match
  - Return error if limit exceeded
  - Reset on match end

- [ ] **Multiple Connections**
  - If user connects multiple OpenClaw instances, use most recent
  - Disconnect older sessions gracefully

---

## Database Schema

### `openclaw_sessions` Table
```sql
CREATE TABLE openclaw_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  session_key VARCHAR(255) UNIQUE NOT NULL,
  bot_name VARCHAR(100),
  model VARCHAR(100),
  provider VARCHAR(50),
  connected_at TIMESTAMP DEFAULT NOW(),
  last_heartbeat TIMESTAMP,
  disconnected_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### `coaching_suggestions` Table
```sql
CREATE TABLE coaching_suggestions (
  id SERIAL PRIMARY KEY,
  match_id VARCHAR(100) NOT NULL,
  round INTEGER NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  suggestion_id VARCHAR(255) UNIQUE NOT NULL,
  skill_id VARCHAR(50) NOT NULL,
  confidence INTEGER,
  risk_level VARCHAR(20),
  player_decision VARCHAR(20), -- 'accept', 'override', 'timeout'
  chosen_skill_id VARCHAR(50),  -- if override
  focus_points_spent INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  model_used VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `coaching_chat_logs` Table
```sql
CREATE TABLE coaching_chat_logs (
  id SERIAL PRIMARY KEY,
  match_id VARCHAR(100) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  role VARCHAR(20) NOT NULL, -- 'user' or 'bot'
  message TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Security & Validation

### Authentication
- OpenClaw bot must authenticate with user's Arena API token
- Token passed in WebSocket handshake or initial message
- Validate token against user database

### Rate Limiting
- **Coaching chat:** 10 messages per match
- **Suggestion requests:** 1 per round (enforced by game logic)

### Input Validation
- Sanitize all incoming messages (prevent XSS)
- Validate skill IDs against skill database
- Ensure suggestion timing is valid (within round window)

---

## Testing Strategy

### Manual Testing Flow
1. **Without OpenClaw:**
   - Start match → see "OpenClaw Not Connected" UI
   - Verify fallback bot still works (local suggestions)

2. **With OpenClaw:**
   - Run `openclaw arena connect` in terminal
   - Refresh match page → see "OpenClaw Connected • [Model]"
   - Start match → bot receives `request_bot_suggestion`
   - OpenClaw responds → suggestion appears in UI
   - Player accepts → `accept_suggestion` emitted
   - Player overrides → `override_suggestion` emitted, Focus Point deducted
   - Player sends chat → `coaching_chat` emitted
   - OpenClaw responds → message appears in chat

3. **Edge Cases:**
   - OpenClaw disconnects mid-match → fallback to local bot
   - OpenClaw timeout (15s) → auto-pick safe move
   - Multiple connections → use most recent, disconnect old

### Automated Tests
- Unit tests for suggestion validation
- Integration tests for WebSocket protocol
- E2E tests with mock OpenClaw bot

---

## Deployment Plan

1. **Frontend (Completed):**
   - ✅ Remove TAG TEAM toggle
   - ✅ Add OpenClawStatus component
   - ✅ Add OpenClawSetup instructions
   - ✅ Update BotSuggestionPanel with connection UI
   - ✅ Update CoachingChat with connection UI
   - ✅ Add WebSocket event listeners

2. **Backend (Next Steps):**
   - [ ] Implement WebSocket protocol (this spec)
   - [ ] Add database tables
   - [ ] API endpoint for OpenClaw registration
   - [ ] Suggestion validation logic
   - [ ] Analytics tracking

3. **OpenClaw Plugin (Separate Task):**
   - [ ] Implement Arena combat integration
   - [ ] Connect to backend WebSocket
   - [ ] Generate suggestions using AI model
   - [ ] Handle coaching chat

4. **Testing:**
   - [ ] Manual testing with real OpenClaw bot
   - [ ] Load testing (100+ concurrent matches)

5. **Production Deployment:**
   - [ ] Deploy backend changes
   - [ ] Monitor error rates
   - [ ] Gradual rollout to users

---

## Monitoring & Metrics

Track these metrics in production:

- **Connection Rate:** OpenClaw connections per hour
- **Suggestion Accuracy:** % of suggestions that are legal/valid
- **Response Time:** p50/p95/p99 for bot suggestions
- **Acceptance Rate:** % of suggestions accepted vs overridden
- **Win Rate Delta:** Win rate when following bot vs overriding
- **Timeout Rate:** % of suggestions that timeout

---

## Questions for Backend Team

1. **WebSocket Library:** Are we using Socket.IO or native WebSockets?
2. **Deployment:** Will OpenClaw bots connect to same server as frontend, or separate service?
3. **Load Balancing:** How do we handle multiple game servers with sticky sessions?
4. **Rate Limiting:** Should we use Redis for distributed rate limiting?
5. **Database:** Postgres for analytics? Should we use TimescaleDB for time-series data?

---

## Contact

- **Frontend:** Implemented and ready
- **Backend Lead:** Plata
- **OpenClaw Plugin:** [Assign to appropriate dev]

**Status:** Ready for backend implementation. Frontend changes deployed and gracefully degrade when backend is not ready.
