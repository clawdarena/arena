# Task 001: Backend Setup & Foundation

**Owner:** Agent A (Backend)  
**Priority:** 🟡 High  
**Estimated:** 1 day  
**Depends on:** Task 000 (Contracts)  
**Blocks:** Task 003 (Auth API)

## Objective

Set up the backend infrastructure: database, server, dependencies, and project structure.

## Deliverables

- [ ] `code/backend/` directory initialized
- [ ] Database running (PostgreSQL + Redis)
- [ ] Prisma migrations applied
- [ ] Basic Express/Hono server running
- [ ] Environment variables configured
- [ ] Seed data script

## Technical Stack

```javascript
{
  runtime: 'Bun',
  framework: 'Hono',
  database: 'PostgreSQL (Prisma ORM)',
  cache: 'Redis',
  validation: 'Zod',
  auth: 'JWT + Ed25519 signatures'
}
```

## Setup Steps

### 1. Initialize Backend

```bash
cd code/backend
bun init
bun add hono @hono/node-server
bun add @prisma/client
bun add ioredis
bun add zod
bun add jsonwebtoken
bun add @noble/ed25519
bun add -d @types/node prisma
```

### 2. Database Setup

```bash
# Initialize Prisma
npx prisma init

# Copy schema from code/shared/prisma/schema.prisma
# (created in Task 000)

# Run migrations
npx prisma migrate dev --name init

# Generate client
npx prisma generate
```

### 3. Server Structure

```
backend/
├── src/
│   ├── index.ts          # Main server
│   ├── db.ts             # Prisma client
│   ├── redis.ts          # Redis client
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── shop.ts
│   │   ├── bots.ts
│   │   └── matchmaking.ts
│   ├── middleware/
│   │   ├── auth.ts       # JWT verification
│   │   └── validate.ts   # Zod validation
│   └── utils/
│       ├── crypto.ts     # Signature verification
│       └── elo.ts        # ELO calculation
├── prisma/
│   └── schema.prisma
├── seeds/
│   └── shop-items.ts     # Seed initial shop data
└── package.json
```

### 4. Basic Server

```typescript
// src/index.ts
import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

app.get('/', (c) => c.json({ status: 'ok' }))

// TODO: Add routes in next tasks

serve({
  fetch: app.fetch,
  port: 3000
})

console.log('🚀 Server running on http://localhost:3000')
```

### 5. Seed Data

```typescript
// seeds/shop-items.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const shopItems = [
  {
    name: 'Neon Blue Skin',
    description: 'Electric blue robot skin',
    category: 'skin',
    price: 500,
    rarity: 'common'
  },
  {
    name: 'Laser Eyes',
    description: 'Red laser eye accessory',
    category: 'accessory',
    price: 300,
    rarity: 'common'
  },
  // ... more items
]

async function seed() {
  for (const item of shopItems) {
    await prisma.shopItem.create({ data: item })
  }
  console.log('✅ Seeded shop items')
}

seed()
```

## Environment Variables

Create `.env`:

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/arena"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key-here"
NODE_ENV="development"
```

## Acceptance Criteria

- [ ] `bun run dev` starts server on port 3000
- [ ] GET http://localhost:3000 returns `{"status": "ok"}`
- [ ] Database connected (Prisma migrations applied)
- [ ] Redis connected (can set/get keys)
- [ ] Shop items seeded (at least 10 items)
- [ ] No TypeScript errors
- [ ] README with setup instructions

## Testing

```bash
# Test database connection
npx prisma studio  # Should open GUI

# Test Redis
redis-cli ping     # Should return PONG

# Test server
curl http://localhost:3000  # Should return JSON
```

## Handoff

When done:
1. Create `handoffs/to-frontend.md`:
   ```
   Backend server is running on http://localhost:3000
   Database seeded with shop items
   Ready for API endpoints next
   ```
2. Move task to `tasks/done/001-backend-setup.md`

## Notes

💡 Use Docker for database if needed:
```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres
docker run -d -p 6379:6379 redis
```

⚠️ Don't commit `.env` file! Add to `.gitignore`
