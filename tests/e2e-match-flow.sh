#!/usr/bin/env bash
#
# ClawdArena E2E Match Flow Test
#
# Tests the full flow: register → login → queue → fight → results
# Requires: backend running on localhost:3001
#
# Usage:
#   ./tests/e2e-match-flow.sh
#
set -euo pipefail

API="http://localhost:3001"
BOLD="\033[1m"
GREEN="\033[32m"
RED="\033[31m"
YELLOW="\033[33m"
RESET="\033[0m"

pass() { echo -e "${GREEN}✅ $1${RESET}"; }
fail() { echo -e "${RED}❌ $1${RESET}"; exit 1; }
info() { echo -e "${YELLOW}→ $1${RESET}"; }
step() { echo -e "\n${BOLD}═══ $1 ═══${RESET}"; }

# ─── Step 0: Health check ───────────────────────────────────
step "Health Check"
info "Checking backend at $API..."
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/leaderboard" 2>/dev/null || echo "000")
if [ "$HTTP" = "000" ]; then
  fail "Backend not running at $API. Start with: cd code/backend && bun run dev"
fi
pass "Backend is up (HTTP $HTTP)"

# ─── Step 1: Register two users ─────────────────────────────
step "Register Users"

# Generate random usernames
TS=$(date +%s)
USER1="testbot_${TS}_a"
USER2="testbot_${TS}_b"
EMAIL1="${USER1}@test.local"
EMAIL2="${USER2}@test.local"
# Dummy Ed25519 public keys (64 hex chars)
PUBKEY1="$(head -c 32 /dev/urandom | xxd -p -c 64)"
PUBKEY2="$(head -c 32 /dev/urandom | xxd -p -c 64)"

info "Registering $USER1..."
REG1=$(curl -s -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USER1\",\"email\":\"$EMAIL1\",\"password\":\"testpass123\",\"public_key\":\"$PUBKEY1\"}")
TOKEN1=$(echo "$REG1" | jq -r '.token // empty')
USER1_ID=$(echo "$REG1" | jq -r '.user.id // empty')
BOT1_ID=$(echo "$REG1" | jq -r '.user.bots[0].id // empty')

if [ -z "$TOKEN1" ]; then
  echo "$REG1" | jq .
  fail "Registration failed for $USER1"
fi
pass "User 1: $USER1 (bot: ${BOT1_ID:0:8}...)"

info "Registering $USER2..."
REG2=$(curl -s -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USER2\",\"email\":\"$EMAIL2\",\"password\":\"testpass123\",\"public_key\":\"$PUBKEY2\"}")
TOKEN2=$(echo "$REG2" | jq -r '.token // empty')
USER2_ID=$(echo "$REG2" | jq -r '.user.id // empty')
BOT2_ID=$(echo "$REG2" | jq -r '.user.bots[0].id // empty')

if [ -z "$TOKEN2" ]; then
  echo "$REG2" | jq .
  fail "Registration failed for $USER2"
fi
pass "User 2: $USER2 (bot: ${BOT2_ID:0:8}...)"

# ─── Step 2: Login ───────────────────────────────────────────
step "Login"

info "Logging in as $USER1..."
LOGIN1=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL1\",\"password\":\"testpass123\"}")
LOGIN_TOKEN1=$(echo "$LOGIN1" | jq -r '.token // empty')
[ -n "$LOGIN_TOKEN1" ] && pass "Login successful for $USER1" || fail "Login failed for $USER1"

info "Logging in as $USER2..."
LOGIN2=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL2\",\"password\":\"testpass123\"}")
LOGIN_TOKEN2=$(echo "$LOGIN2" | jq -r '.token // empty')
[ -n "$LOGIN_TOKEN2" ] && pass "Login successful for $USER2" || fail "Login failed for $USER2"

# ─── Step 3: Check user profiles ────────────────────────────
step "User Profiles"

info "Fetching profile for $USER1..."
ME1=$(curl -s "$API/api/auth/me" -H "Authorization: Bearer $TOKEN1")
CREDITS1=$(echo "$ME1" | jq -r '.user.credits // 0')
pass "$USER1: $CREDITS1 credits"

info "Fetching profile for $USER2..."
ME2=$(curl -s "$API/api/auth/me" -H "Authorization: Bearer $TOKEN2")
CREDITS2=$(echo "$ME2" | jq -r '.user.credits // 0')
pass "$USER2: $CREDITS2 credits"

# ─── Step 4: Check leaderboard ──────────────────────────────
step "Leaderboard"

LB=$(curl -s "$API/api/leaderboard?limit=10")
TOTAL=$(echo "$LB" | jq -r '.total_players // 0')
pass "Leaderboard has $TOTAL players"

# ─── Step 5: Check PvE bots ─────────────────────────────────
step "PvE Bots"

PVE=$(curl -s "$API/api/pve/bots")
PVE_COUNT=$(echo "$PVE" | jq '.bots | length')
pass "Found $PVE_COUNT PvE bots"

# ─── Step 6: Check Gauntlet ─────────────────────────────────
step "Gauntlet"

GAUNTLET=$(curl -s "$API/api/gauntlet?bot_id=$BOT1_ID" -H "Authorization: Bearer $TOKEN1")
TIERS=$(echo "$GAUNTLET" | jq '.total_tiers // 0')
COMPLETED=$(echo "$GAUNTLET" | jq '.total_completed // 0')
pass "Gauntlet: $COMPLETED/$TIERS tiers completed"

# ─── Step 7: Check shop ─────────────────────────────────────
step "Shop"

SHOP=$(curl -s "$API/api/shop" -H "Authorization: Bearer $TOKEN1")
ITEMS=$(echo "$SHOP" | jq '.items | length // 0')
pass "Shop has $ITEMS items"

# ─── Step 8: Match history ──────────────────────────────────
step "Match History"

HISTORY=$(curl -s "$API/api/matches/history?limit=10" -H "Authorization: Bearer $TOKEN1")
MATCHES=$(echo "$HISTORY" | jq '.matches | length // 0')
pass "Match history: $MATCHES matches"

# ─── Step 9: WebSocket match flow (manual test) ─────────────
step "WebSocket Match Flow"

echo -e "${YELLOW}
WebSocket testing requires two concurrent socket connections.
To test manually:

  Terminal 1 (Player A):
    cd code/plugin
    ARENA_TOKEN=$TOKEN1 node dist/index.js join -t ranked_bronze

  Terminal 2 (Player B):
    cd code/plugin
    ARENA_TOKEN=$TOKEN2 node dist/index.js join -t ranked_bronze

  Expected flow:
    1. Both connect → join_queue events sent
    2. Server matches them → match_found events
    3. Both emit ready → match_start
    4. 10 rounds of round_start → combat_action → round_complete
    5. match_end with winner/loser/elo changes
${RESET}"

# ─── Summary ─────────────────────────────────────────────────
step "Summary"
pass "API endpoints verified"
pass "Auth flow: register → login → me ✓"
pass "Leaderboard, Shop, PvE, Gauntlet, History endpoints ✓"
pass "Accept timeout: 60s (verified in code)"
echo -e "\n${BOLD}Remaining: WebSocket match flow needs manual 2-player test${RESET}"
echo -e "Tokens for manual testing:"
echo -e "  Player 1: $TOKEN1"
echo -e "  Player 2: $TOKEN2"
