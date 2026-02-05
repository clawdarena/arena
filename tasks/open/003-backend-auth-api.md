# Task 003: Backend Authentication API

**Owner:** Agent A (Backend)  
**Priority:** 🔴 Critical  
**Estimated:** 1.5 days  
**Depends on:** Task 001 (Backend Setup)  
**Blocks:** Task 004 (Frontend Auth UI)

## Objective

Implement user authentication system with JWT tokens and Ed25519 signature verification for bot actions.

## Deliverables

- [ ] `POST /api/auth/register` endpoint
- [ ] `POST /api/auth/login` endpoint
- [ ] `GET /api/auth/me` endpoint
- [ ] JWT middleware for protected routes
- [ ] Ed25519 signature verification utility
- [ ] Tests for auth flows

## Technical Requirements

### 1. Registration

```typescript
// POST /api/auth/register
{
  username: string,      // 3-20 chars, alphanumeric + underscore
  public_key: string     // Ed25519 public key (hex string)
}

// Response:
{
  user: {
    id: string,
    username: string,
    credits: 200,         // Welcome bonus
    elo: 1200,            // Starting ELO
    created_at: string
  },
  token: string           // JWT token
}

// Errors:
// - 400: Invalid username format
// - 409: Username already taken
// - 400: Invalid public key format
```

### 2. Login

```typescript
// POST /api/auth/login
{
  username: string
}

// Response:
{
  user: {
    id: string,
    username: string,
    credits: number,
    elo: number
  },
  token: string
}

// Note: No password! Auth is via signature verification
// during bot actions (combat, purchases, etc.)
```

### 3. Get Current User

```typescript
// GET /api/auth/me
// Headers: Authorization: Bearer <token>

// Response:
{
  id: string,
  username: string,
  credits: number,
  current_elo: number,
  peak_elo: number,
  total_matches: number,
  wins: number,
  losses: number,
  created_at: string
}

// Errors:
// - 401: Invalid or expired token
```

## Implementation

### JWT Middleware

```typescript
// src/middleware/auth.ts
import { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const token = authHeader.slice(7)
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!)
    c.set('user', payload)
    await next()
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401)
  }
}
```

### Signature Verification Utility

```typescript
// src/utils/crypto.ts
import * as ed25519 from '@noble/ed25519'

export async function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    const messageBytes = Buffer.from(message)
    const signatureBytes = Buffer.from(signature, 'hex')
    const publicKeyBytes = Buffer.from(publicKey, 'hex')
    
    return await ed25519.verify(signatureBytes, messageBytes, publicKeyBytes)
  } catch (err) {
    return false
  }
}

// Usage in combat action handler:
const valid = await verifySignature(
  JSON.stringify(event),
  signature,
  user.public_key
)
```

### Register Endpoint

```typescript
// src/routes/auth.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../db'
import jwt from 'jsonwebtoken'

const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  public_key: z.string().regex(/^[0-9a-f]{64}$/)
})

export const authRoutes = new Hono()

authRoutes.post('/register', async (c) => {
  const body = await c.req.json()
  
  // Validate
  const result = registerSchema.safeParse(body)
  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error }, 400)
  }
  
  const { username, public_key } = result.data
  
  // Check if username taken
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return c.json({ error: 'Username already taken' }, 409)
  }
  
  // Create user
  const user = await prisma.user.create({
    data: {
      username,
      public_key,
      credits: 200,        // Welcome bonus
      current_elo: 1200,   // Starting ELO
      peak_elo: 1200
    }
  })
  
  // Create default bot
  await prisma.bot.create({
    data: {
      user_id: user.id,
      name: `${username}Bot`,
      model_type: 'mech_01',
      base_hp: 100,
      base_attack: 15,
      base_defense: 10,
      base_speed: 10
    }
  })
  
  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )
  
  return c.json({
    user: {
      id: user.id,
      username: user.username,
      credits: user.credits,
      elo: user.current_elo,
      created_at: user.created_at
    },
    token
  })
})
```

### Login Endpoint

```typescript
authRoutes.post('/login', async (c) => {
  const { username } = await c.req.json()
  
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }
  
  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )
  
  return c.json({
    user: {
      id: user.id,
      username: user.username,
      credits: user.credits,
      elo: user.current_elo
    },
    token
  })
})
```

### Get Current User

```typescript
import { authMiddleware } from '../middleware/auth'

authRoutes.get('/me', authMiddleware, async (c) => {
  const userId = c.get('user').userId
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      bots: true
    }
  })
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }
  
  return c.json({
    id: user.id,
    username: user.username,
    credits: user.credits,
    current_elo: user.current_elo,
    peak_elo: user.peak_elo,
    total_matches: user.total_matches,
    wins: user.wins,
    losses: user.losses,
    created_at: user.created_at,
    bots: user.bots
  })
})
```

## Acceptance Criteria

- [ ] Can register new user: `POST /api/auth/register`
- [ ] Username validation works (3-20 chars, alphanumeric)
- [ ] Public key validation works (64 hex chars)
- [ ] Returns 409 if username taken
- [ ] Welcome bonus (200 credits) awarded
- [ ] Default bot created automatically
- [ ] Can login: `POST /api/auth/login`
- [ ] JWT token generated and valid
- [ ] Can get current user with token: `GET /api/auth/me`
- [ ] Protected routes return 401 without valid token
- [ ] Signature verification utility works (test with mock signature)

## Testing

```bash
# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "public_key": "abcd...1234"}'

# Should return user + token

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser"}'

# Test protected route
TOKEN="<from above>"
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## Handoff

When done:
1. Create `handoffs/to-frontend.md`:
   ```
   Auth API ready:
   - POST /api/auth/register (username, public_key)
   - POST /api/auth/login (username)
   - GET /api/auth/me (requires Bearer token)
   
   Token expires in 7 days.
   Store in httpOnly cookie or localStorage.
   
   Frontend can now build login/register forms.
   ```
2. Update `docs/API_CONTRACT.md` with actual implementations
3. Move task to `tasks/done/003-backend-auth-api.md`

## Notes

⚠️ **Security:**
- Use HTTPS in production
- JWT_SECRET must be strong (32+ chars)
- Consider refresh tokens for long sessions

💡 **Future enhancement:**
- Email verification
- Password recovery (for now, just username)
- Rate limiting on register/login (prevent spam)
