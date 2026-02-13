# ClawdArena Comprehensive Code Audit

Date: 2026-02-13  
Scope: `~/projects/arena/code/{backend,frontend,plugin,shared}` (all files read)

---

## 🔴 CRITICAL

### 1) Auth bypass endpoint (`login-username`) allows account takeover
- **File:** `code/backend/src/routes/auth.ts`
- **Lines:** 155-174
- **Issue:** `POST /api/auth/login-username` returns a valid JWT for any existing username with no password/signature proof.
- **Impact:** Anyone who knows a username can fully impersonate that account.
- **Fix:** Remove this endpoint in production, or require cryptographic challenge-response using the registered Ed25519 key.

### 2) Insecure JWT secret fallback
- **File:** `code/backend/src/middleware/auth.ts`
- **Lines:** 4, 13-19
- **Issue:** Falls back to hardcoded `dev-secret-change-me` when `JWT_SECRET` is missing.
- **Impact:** Predictable secret enables forged tokens and full auth bypass.
- **Fix:** Fail fast on startup if `JWT_SECRET` is absent/weak; do not provide a default.

### 3) Gauntlet reward endpoint trusts client-reported match outcome
- **File:** `code/backend/src/routes/gauntlet.ts`
- **Lines:** 127-139, 141-213
- **Issue:** `/api/gauntlet/complete` accepts arbitrary `match_data` from client and grants stats/credits based on it.
- **Impact:** Users can self-award gauntlet completions, stat boosts, and credits without playing.
- **Fix:** Require server-side match ID; validate against authoritative match replay/state in DB before rewards.

### 4) Combat engine does not verify skill ownership/equipment for V2 skills
- **File:** `code/backend/src/utils/combat.ts`
- **Lines:** 703-711, 756-767, 397-571
- **Issue:** Skill use checks cooldown/energy only; any known V2 `skill_id` is resolved even if not equipped/unlocked.
- **Impact:** Players can use unowned high-tier skills (e.g., legendary exploit skills) during combat.
- **Fix:** In round validation, enforce `action.skill_id` ∈ `bot.equippedSkills` and user ownership before resolution.

### 5) Plugin action path does not verify signatures at all
- **File:** `code/backend/src/ws/matchmaking.ts`
- **Lines:** 459-485
- **Issue:** `plugin_combat_action` accepts a `signature` field but never verifies it.
- **Impact:** Any authenticated socket for that user can inject bot actions, defeating non-repudiation/anti-spoofing.
- **Fix:** Apply the same signature validation as `combat_action` (without bypass), reject invalid/absent signatures.

### 6) Match history IDOR via unvalidated `bot_id` filter
- **File:** `code/backend/src/routes/matches.ts`
- **Lines:** 15-23
- **Issue:** User-supplied `bot_id` is trusted without ownership check; query then returns matches for that bot.
- **Impact:** Authenticated users can fetch replay/history data for other players’ bots.
- **Fix:** If `bot_id` is provided, verify it belongs to requesting user before use.

---

## 🟠 HIGH

### 1) Signature verification can silently fail open for malformed keys
- **File:** `code/backend/src/ws/matchmaking.ts`
- **Lines:** 247-255
- **Issue:** Verification exceptions are swallowed and action proceeds.
- **Impact:** Invalid key/signature edge cases bypass integrity checks.
- **Fix:** On verification errors, reject action (`INVALID_SIGNATURE`) instead of continuing.

### 2) Match creation + entry fee debit are non-atomic
- **File:** `code/backend/src/ws/matchmaking.ts`
- **Lines:** 856-872
- **Issue:** DB match is created before fee deduction; no transaction wraps both players + match creation.
- **Impact:** Orphaned pending matches / inconsistent state if debit fails for one side.
- **Fix:** Wrap match create + both `recordTransaction` calls in single DB transaction; rollback on failure.

### 3) Shop purchase flow is non-atomic (charge-before-grant)
- **File:** `code/backend/src/routes/shop.ts`
- **Lines:** 100-112, 136-149
- **Issue:** Credits are debited before ownership insert/stock decrement, outside one transaction.
- **Impact:** Users can be charged but not receive item on race/conflict/error.
- **Fix:** Use one transaction per purchase: check ownership/balance/stock + debit + grant + stock decrement atomically.

### 4) Active matches endpoint is broken due status mismatch
- **Files:**
  - `code/backend/src/ws/matchmaking.ts` lines 1000-1003 (`status: 'active'`)
  - `code/backend/src/routes/matches.ts` lines 84-87 (`status: 'in_progress'`)
- **Issue:** Reader and writer use different status values.
- **Impact:** `/api/matches/active` will miss real active matches.
- **Fix:** Standardize match status enum across schema/routes/ws.

### 5) Google OAuth verification incomplete
- **File:** `code/backend/src/routes/auth.ts`
- **Lines:** 187-195
- **Issue:** Token is checked via `tokeninfo` but no strict `aud` check against configured client ID and no enforced `email_verified`.
- **Impact:** Potential acceptance of tokens not intended for this app / weaker account assurance.
- **Fix:** Validate audience/issuer/expiry/email_verified explicitly using Google JWT verification library.

### 6) No rate limiting on auth and WS actions
- **Files:** `code/backend/src/index.ts`, `code/backend/src/routes/auth.ts`, `code/backend/src/ws/matchmaking.ts`
- **Lines:** N/A (missing control)
- **Issue:** No brute-force or abuse throttling.
- **Impact:** Password brute force, credential stuffing, event spam, resource exhaustion.
- **Fix:** Add IP+user-based rate limits for login/register/oauth and WS event quotas.

### 7) Plugin CLI/backend contract is incompatible (registration/login)
- **File:** `code/plugin/src/index.ts`
- **Lines:** 130-137, 141-145, 182-184
- **Issue:** Plugin posts `/api/auth/register` without required `email/password`; then tries `/api/auth/login` with `username`; expects `{bot_id}` response while backend returns `{bot}`.
- **Impact:** Plugin registration/login flow fails.
- **Fix:** Align plugin to backend API contracts (or expose dedicated plugin auth endpoints).

### 8) Plugin runtime/backend WS contract mismatches break combat decisions
- **Files:**
  - `code/plugin/src/service.ts` lines 266-269, 279-303, 333-338, 366-368, 420-425
  - `code/backend/src/ws/matchmaking.ts` lines 1032-1038, 1068-1084, 459-485, 630-663
- **Issue:** Plugin expects different payload shape (`data.skills`, `bot1_hp`, `energy`), sends nested action envelope incompatible with backend parser, and emits wrong suggestion event name (`bot_suggestion` vs backend `bot_suggestion_response`).
- **Impact:** Plugin chooses from empty/incorrect state, submits malformed actions, coaching suggestions are dropped.
- **Fix:** Unify event schema in shared contract package and enforce with runtime validation.

### 9) Frontend Google login payload key mismatch
- **Files:**
  - `code/frontend/app/login/page.tsx` line 74 (`id_token`)
  - `code/backend/src/routes/auth.ts` line 181 (`google_token`)
- **Issue:** Client sends wrong field name.
- **Impact:** Google sign-in fails with validation error.
- **Fix:** Send `google_token` from frontend or accept both keys server-side.

---

## 🟡 MEDIUM

### 1) Frontend stores auth token and private key in `localStorage`
- **Files:**
  - `code/frontend/lib/store.ts` lines 29-33, 43-45
  - `code/frontend/lib/crypto.ts` lines 65-75
- **Issue:** Sensitive data in `localStorage` is vulnerable to XSS exfiltration.
- **Impact:** Session hijack and key theft if any XSS lands.
- **Fix:** Prefer httpOnly secure cookies for JWT, and avoid persistent browser private key storage (or encrypt with user passphrase + stricter CSP).

### 2) Query params are not validated (`limit`, `offset`)
- **File:** `code/backend/src/routes/matches.ts`
- **Lines:** 13-14
- **Issue:** `parseInt` results are not sanitized for NaN/negative.
- **Impact:** Potential runtime errors or unintended DB behavior.
- **Fix:** Validate with Zod and clamp to sane ranges.

### 3) Shared type duplication across two paths
- **Files:**
  - `code/shared/types.ts`
  - `code/frontend/shared/types.ts`
- **Issue:** Duplicated contract files create drift risk.
- **Impact:** Backend/frontend/plugin incompatibilities increase over time.
- **Fix:** Keep a single source of truth (workspace package) and import it everywhere.

### 4) Multiple conflicting skill definitions in frontend
- **Files:**
  - `code/frontend/lib/constants.ts`
  - `code/frontend/lib/skills.ts`
  - `code/frontend/lib/moves.ts`
- **Issue:** Cooldowns/energy/effects differ across files and from backend combat engine.
- **Impact:** UI/tooltips/recommendations can be misleading.
- **Fix:** Generate UI skill metadata from backend/shared schema only.

### 5) Plugin sanitizer status enum does not match backend effects
- **File:** `code/plugin/src/sanitizer.ts`
- **Lines:** 29-39
- **Issue:** Allows statuses like `poisoned/slowed/shielded/infected` while backend emits `sleep/confused/virus/memory_bombed/...`.
- **Impact:** Important effects are dropped from AI context.
- **Fix:** Sync allowed statuses with backend `resolveRound`/effect model.

### 6) API response consistency issues
- **File:** `code/backend/src/routes/gauntlet.ts`
- **Lines:** 183-189
- **Issue:** Criteria failure returns HTTP 200 with `{ success: false }`, while similar failures elsewhere use 4xx.
- **Impact:** Inconsistent client handling and error semantics.
- **Fix:** Standardize on explicit 4xx codes for user-actionable failures.

### 7) No automated tests for critical logic
- **Files:** codebase-wide (not present for combat/ws/elo/auth)
- **Issue:** Core systems lack unit/integration tests.
- **Impact:** Regressions likely in combat balance, matchmaking, payouts, auth security.
- **Fix:** Add test suites for `combat.ts`, `elo.ts`, `matchmaking.ts`, and auth routes.

---

## 🟢 LOW

### 1) Unused/dead frontend modules
- **Files:**
  - `code/frontend/lib/mock-api.ts` (no imports)
  - `code/frontend/lib/stat-damage-calculator.ts` (no imports)
- **Issue:** Dead code increases maintenance cost and confusion.
- **Fix:** Remove or integrate with active flows.

### 2) Hardcoded CORS origins and public IP in code
- **File:** `code/backend/src/index.ts`
- **Lines:** 27, 82-88
- **Issue:** Environment-specific values embedded in source.
- **Fix:** Move to env-driven allowlist.

### 3) Unused variables/constants in backend WS/combat
- **Files:**
  - `code/backend/src/ws/matchmaking.ts` line 61 (`queue` map unused)
  - `code/backend/src/utils/combat.ts` lines 95, 98 (`ENERGY_START`, `BASE_DAMAGE` unused)
- **Fix:** Remove or wire properly.

### 4) Frontend hard refresh on skill unequip
- **File:** `code/frontend/app/dashboard/page.tsx`
- **Line:** 48
- **Issue:** Uses `window.location.reload()` instead of state update.
- **Fix:** Update store/state and re-fetch minimally.

---

## 📋 RECOMMENDATIONS

1. **Create a single shared protocol package** for REST + WS schemas (Zod/TypeBox) used by backend, frontend, and plugin at compile and runtime.
2. **Enforce strict security baseline:** mandatory `JWT_SECRET`, remove legacy username-only login, add auth/ws rate limits, and require signature verification for all signed action paths.
3. **Transaction-first economy model:** all credit-impacting flows (`match entry`, `shop`, `gauntlet`) should be atomic and idempotent.
4. **Combat authorization layer:** validate actions (enum, target, equipped skill, unlock, cooldown, energy) before entering resolver.
5. **Plugin contract hardening:** versioned WS events + runtime validation + backward compatibility tests against backend fixtures.
6. **Type consolidation:** delete duplicated `frontend/shared/types.ts`; consume `code/shared/types.ts` only.
7. **Testing roadmap:**
   - Unit: `elo`, combat formulas/effects, sanitizer.
   - Integration: auth, shop purchase atomicity, matchmaking lifecycle.
   - E2E: frontend queue→match flow, plugin connect/register/battle flow.
8. **Secrets/token storage:** migrate web auth to httpOnly cookies; avoid storing private keys in `localStorage`.

---

## Notes
- This audit reviewed the full file set under `code/` (backend, frontend, plugin, shared, configs/assets).
- Findings prioritize exploitability, integrity of match economy, and protocol correctness across federated components.
