# Task 002: Frontend Setup & Foundation

**Owner:** Agent B (Frontend)  
**Priority:** 🟡 High  
**Estimated:** 1 day  
**Depends on:** Task 000 (Contracts)  
**Blocks:** Task 005 (Dashboard UI)

## Objective

Set up the Next.js frontend application with all necessary dependencies and project structure.

## Deliverables

- [ ] `code/frontend/` directory initialized
- [ ] Next.js 14 app running
- [ ] Tailwind CSS configured
- [ ] TypeScript strict mode enabled
- [ ] Shared types imported from `code/shared/`
- [ ] Auth layout ready
- [ ] Socket.io client configured

## Technical Stack

```javascript
{
  framework: 'Next.js 14 (App Router)',
  styling: 'Tailwind CSS + shadcn/ui',
  state: 'Zustand',
  forms: 'React Hook Form + Zod',
  realtime: 'Socket.io-client',
  3d: 'Three.js + React Three Fiber (later)',
  auth: 'JWT in httpOnly cookies'
}
```

## Setup Steps

### 1. Initialize Frontend

```bash
cd code/frontend
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
bun install
```

### 2. Install Dependencies

```bash
bun add socket.io-client
bun add zustand
bun add react-hook-form zod @hookform/resolvers
bun add @radix-ui/react-dialog @radix-ui/react-dropdown-menu
bun add lucide-react
bun add clsx tailwind-merge
```

### 3. Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx        # Main dashboard (TODO: Task 005)
│   ├── shop/
│   │   └── page.tsx
│   └── arena/
│       └── page.tsx        # Live match view
├── components/
│   ├── ui/                 # shadcn components
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   └── Leaderboard.tsx
│   └── arena/
│       ├── MatchView.tsx
│       └── HPBar.tsx
├── lib/
│   ├── api.ts              # Fetch wrapper
│   ├── socket.ts           # Socket.io client
│   ├── store.ts            # Zustand store
│   └── utils.ts            # Helpers
└── types/
    └── index.ts            # Import from code/shared/types.ts
```

### 4. Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#ec4899',
        }
      }
    }
  },
  plugins: []
}
```

### 5. API Client

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function api<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    credentials: 'include' // For JWT cookies
  })
  
  if (!res.ok) {
    throw new Error(`API error: ${res.statusText}`)
  }
  
  return res.json()
}

// Usage:
// const user = await api<User>('/api/users/me')
```

### 6. Socket.io Client

```typescript
// lib/socket.ts
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket() {
  if (!socket) {
    socket = io('http://localhost:3001', {
      autoConnect: false
    })
  }
  return socket
}

export function connectSocket() {
  const socket = getSocket()
  socket.connect()
  
  socket.on('connect', () => {
    console.log('✅ Connected to arena server')
  })
  
  socket.on('disconnect', () => {
    console.log('❌ Disconnected from arena server')
  })
  
  return socket
}
```

### 7. Zustand Store

```typescript
// lib/store.ts
import { create } from 'zustand'

interface User {
  id: string
  username: string
  credits: number
  elo: number
}

interface Store {
  user: User | null
  setUser: (user: User | null) => void
  
  currentMatch: any | null
  setCurrentMatch: (match: any) => void
}

export const useStore = create<Store>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  currentMatch: null,
  setCurrentMatch: (match) => set({ currentMatch: match })
}))
```

### 8. Import Shared Types

```typescript
// types/index.ts
// Import types from shared contracts
export * from '../../shared/types'

// Or if using pnpm workspace:
// export * from '@arena/shared'
```

## Acceptance Criteria

- [ ] `bun run dev` starts Next.js on port 3000
- [ ] Landing page loads at http://localhost:3000
- [ ] Tailwind CSS working (styles applied)
- [ ] TypeScript compiles with no errors
- [ ] Can import types from `code/shared/types.ts`
- [ ] Socket.io client can connect (test with mock server)
- [ ] ESLint configured and passing

## Testing

```bash
# Start dev server
bun run dev

# Open browser
open http://localhost:3000

# Should see landing page with no errors
```

## Handoff

When done:
1. Create `handoffs/to-backend.md`:
   ```
   Frontend structure ready
   API client configured for http://localhost:3000
   Socket client ready for ws://localhost:3001
   Need auth endpoints to build login UI next
   ```
2. Move task to `tasks/done/002-frontend-setup.md`

## Notes

💡 **Mock API for development:**
Use MSW (Mock Service Worker) if backend isn't ready:
```bash
bun add -d msw
```

⚠️ **Environment variables:**
Create `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

🎨 **Install shadcn/ui components as needed:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button dialog card
```
