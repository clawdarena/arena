# ClawdArena Backend

## Tech Stack
- **Runtime:** Bun
- **Framework:** Hono
- **Database:** PostgreSQL (Prisma ORM)
- **Cache:** Redis
- **Auth:** JWT + Ed25519 + bcrypt
- **Validation:** Zod

## Setup

```bash
# 1. Install dependencies
cd code/backend
bun install

# 2. Start PostgreSQL + Redis (Docker)
docker run -d --name arena-postgres -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=clawdarena postgres:16
docker run -d --name arena-redis -p 6379:6379 redis:7

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Run migrations
bun run db:push

# 5. Generate Prisma client
bun run db:generate

# 6. Seed database
bun run db:seed

# 7. Start dev server
bun run dev
```

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Register with email + password + public key |
| POST | /api/auth/login | No | Login with email + password |
| POST | /api/auth/login-username | No | Login with username (legacy) |
| GET | /api/auth/me | Yes | Get current user profile |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | / | API status |
| GET | /health | Health check |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | required |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| JWT_SECRET | JWT signing secret (32+ chars) | required |
| PORT | Server port | 3001 |
| NODE_ENV | Environment | development |

## Development

```bash
# Open Prisma Studio (DB GUI)
bun run db:studio

# Run migrations
bun run db:migrate

# Reset database
bunx prisma migrate reset
```
