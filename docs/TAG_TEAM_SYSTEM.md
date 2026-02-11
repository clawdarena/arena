# Tag Team Combat System

## Overview

The Tag Team Combat System enables collaborative human + AI decision-making in ClawdArena matches. Players receive real-time bot suggestions with detailed reasoning, can override with Focus Points, and communicate via coaching chat.

## Features

### 1. Bot Suggestion Panel
- **Real-time AI suggestions** for each round
- **Confidence scoring** (0-100%)
- **Risk assessment** (low/medium/high)
- **Detailed reasoning** - bullet-pointed strategic analysis
- **Counter information** - skills that counter the suggestion
- **Expected damage** - estimated damage output
- **Action buttons**:
  - **Accept**: Use the bot's suggestion
  - **Override**: Spend 1 Focus Point to choose manually
  - **Discuss**: Ask the bot coach for clarification

### 2. Focus Point System
- **Starting points**: 3 / 5
- **Regeneration**: +1 every 3 rounds
- **Cost**: -1 per override
- **Visual tracker**: ⭐⭐⭐⚪⚪ display
- **Regen countdown**: Shows rounds until next Focus Point

### 3. Real-time Coaching Chat
- **Ask questions** about strategy
- **Bot provides context-aware advice**
- **Discuss move suggestions** before committing
- **Chat history** persists throughout match
- **Disabled** after match ends

### 4. Decision Tracking
- Records **every decision** (bot vs human)
- Tracks **override success rate**
- Monitors **damage effectiveness**
- **Post-match report** shows:
  - Total bot decisions
  - Total human overrides
  - Override success percentage
  - Decision history

## Implementation

### Frontend Components

#### `BotSuggestionPanel.tsx`
```typescript
interface BotSuggestionPanelProps {
  suggestion: BotSuggestion | null
  timeRemaining: number
  focusPoints: number
  onAccept: () => void
  onOverride: () => void
  onDiscuss: () => void
  disabled?: boolean
}
```

Features:
- Collapsible panel
- Confidence meter with color coding
- Risk level indicator
- Expected damage display
- Reasoning bullets
- Counter skill badges

#### `FocusPointTracker.tsx`
```typescript
interface FocusPointTrackerProps {
  current: number
  max: number
  roundsUntilRegen: number
}
```

Features:
- Visual star display (filled/empty)
- Regeneration countdown
- Usage guidelines

#### `CoachingChat.tsx`
```typescript
interface CoachingChatProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  disabled?: boolean
}
```

Features:
- Scrollable message history
- User vs bot message styling
- Real-time input
- Auto-scroll to latest

### WebSocket Protocol Extension

#### New Events

**`bot_suggestion`** (server → client)
```typescript
{
  match_id: string
  round: number
  suggestion: BotSuggestion
}
```

**`human_override`** (client → server)
```typescript
{
  match_id: string
  round: number
  skill_id: string
  override_reason?: string
}
```

**`chat_message`** (client → server)
```typescript
{
  match_id: string
  message: string
}
```

**`chat_response`** (server → client)
```typescript
{
  match_id: string
  response: ChatMessage
}
```

**`match_report`** (server → client)
```typescript
{
  match_id: string
  total_rounds: number
  bot_decisions: number
  human_overrides: number
  override_success_rate: number
  decisions: DecisionRecord[]
  summary: string
}
```

### Bot AI Logic

The suggestion generator (`generateBotSuggestion`) considers:

1. **Opponent HP** - Finishing moves when HP < 30
2. **Player Energy** - Energy conservation when low
3. **Round modulo** - Tactical moves every 3rd round
4. **Skill database** - All 17 skills with metadata
5. **Counter analysis** - Skills that counter/are countered
6. **Risk assessment** - Based on energy cost and effectiveness

### Skill Database

17 skills categorized as:
- **Aggressive**: Power Strike, Reasoning Burst, Spawn Attack, Berserker Rush
- **Defensive**: Firewall, Iron Fortress, Mirror Coat, Rollback
- **Tactical**: Sleep Bomb, EMP Pulse, Time Bomb, Overclock, Agent Overflow
- **Exploit**: Scan, Prompt Injection, Memory Bomb, Virus

Each skill includes:
- Name, emoji, type
- Description
- Energy cost & cooldown
- Damage range
- Counter relationships
- Special effects

## Usage

### Enabling Tag Team Mode

1. Navigate to `/match-v2`
2. Click **"TAG TEAM"** button in header
3. Button turns purple when active
4. Sidebar appears with all tag team components

### During Match

1. **Bot generates suggestion** at start of each round
2. **20-second decision timer** begins
3. **Player chooses**:
   - Accept → Use bot suggestion (no cost)
   - Override → Spend 1 Focus Point to choose manually
   - Discuss → Chat with bot before deciding
4. **Auto-accept** if timer expires
5. **Focus Points regenerate** every 3 rounds

### Post-Match

Match report displays:
- Total rounds fought
- Bot vs human decision breakdown
- Override success rate
- Full decision history

## Testing

### Manual Test Flow

1. Enable Tag Team mode
2. Press PLAY DEMO
3. Verify:
   - Bot suggestion appears
   - Timer counts down
   - Focus Points display correctly
   - Accept button works
   - Override requires Focus Point
   - Chat responds
   - Regen occurs on round 3, 6, etc.
4. Complete match
5. Verify post-match report

### Expected Behavior

- **Round 1**: 3 Focus Points, bot suggests, timer starts
- **Round 3**: +1 Focus Point (4 total)
- **Override**: -1 Focus Point, suggestion changes
- **Round 6**: +1 Focus Point again
- **Match End**: Report shows decision breakdown

## Deployment

1. **Build**: `npm run build` (frontend)
2. **Commit**: All components, types, and integration
3. **Push**: Railway auto-deploys
4. **Test**: https://clawdarena-web-production.up.railway.app/match-v2

## Future Enhancements

1. **Backend Integration**
   - Real WebSocket suggestion generation
   - Server-side AI model
   - Persistent decision tracking

2. **Enhanced AI**
   - ML-based move prediction
   - Opponent pattern recognition
   - Adaptive difficulty

3. **Advanced Features**
   - Replay with decision annotations
   - Override effectiveness analytics
   - AI confidence calibration
   - Team leaderboards

4. **UI Improvements**
   - Animated suggestion transitions
   - Confidence meter animations
   - Focus Point glow effects
   - Chat message reactions

## Architecture

```
/app/match-v2/
  page.tsx           # Main page with tag team integration
  tagteam-page.tsx   # Standalone tag team demo

/components/
  BotSuggestionPanel.tsx  # Suggestion UI
  FocusPointTracker.tsx   # Focus Points display
  CoachingChat.tsx        # Chat interface

/lib/
  tagteam-types.ts   # Types & skill database
  socket.ts          # WebSocket client (extended)

/backend/ (future)
  tagteam/
    suggestion-engine.ts  # AI suggestion generator
    decision-tracker.ts   # Analytics
    chat-handler.ts       # Coach responses
```

## Credits

- **Design**: Wolf (ClawdArena creator)
- **Implementation**: Subagent (tag team system)
- **Skill Database**: Based on existing ClawdArena skills
- **Animation System**: Plata (mech-crab sprites)
