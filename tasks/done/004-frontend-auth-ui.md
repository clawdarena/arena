# Task 004: Frontend Authentication UI

**Owner:** Agent B (Frontend)  
**Priority:** 🔴 Critical  
**Estimated:** 1 day  
**Depends on:** Task 002 (Frontend Setup), Task 003 (Backend Auth API)  
**Blocks:** Task 005 (Dashboard)

## Objective

Build login and registration forms that connect to the backend auth API.

## Deliverables

- [ ] Login page at `/login`
- [ ] Register page at `/register`
- [ ] Auth state management (Zustand)
- [ ] Protected route wrapper component
- [ ] Auto-redirect after login

## Pages

### 1. Register Page

**Route:** `/register`

```typescript
// app/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { api } from '@/lib/api'
import { generateKeypair } from '@/lib/crypto'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const setUser = useStore((s) => s.setUser)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Generate keypair locally
      const { publicKey, privateKey } = await generateKeypair()
      
      // Register with backend
      const data = await api<{ user: any; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username,
          public_key: publicKey
        })
      })
      
      // Store token
      localStorage.setItem('token', data.token)
      
      // Store private key securely (for signing combat actions)
      localStorage.setItem('private_key', privateKey)
      
      // Update global state
      setUser(data.user)
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Join the Arena</h1>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-purple-600 hover:underline">
            Login
          </a>
        </p>

        <div className="mt-6 bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
          <p className="font-semibold">🎁 Welcome Bonus</p>
          <p className="mt-1">
            New players receive 200 Arena Credits to start playing!
          </p>
        </div>
      </div>
    </div>
  )
}
```

### 2. Login Page

**Route:** `/login`

```typescript
// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { api } from '@/lib/api'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const setUser = useStore((s) => s.setUser)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = await api<{ user: any; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username })
      })
      
      localStorage.setItem('token', data.token)
      setUser(data.user)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Welcome Back</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          New to the Arena?{' '}
          <a href="/register" className="text-purple-600 hover:underline">
            Create Account
          </a>
        </p>
      </div>
    </div>
  )
}
```

## Crypto Utility

```typescript
// lib/crypto.ts
import * as ed25519 from '@noble/ed25519'

export async function generateKeypair() {
  const privateKey = ed25519.utils.randomPrivateKey()
  const publicKey = await ed25519.getPublicKey(privateKey)
  
  return {
    privateKey: Buffer.from(privateKey).toString('hex'),
    publicKey: Buffer.from(publicKey).toString('hex')
  }
}

export async function signMessage(message: string, privateKeyHex: string) {
  const messageBytes = Buffer.from(message)
  const privateKey = Buffer.from(privateKeyHex, 'hex')
  const signature = await ed25519.sign(messageBytes, privateKey)
  
  return Buffer.from(signature).toString('hex')
}
```

## Protected Route Wrapper

```typescript
// components/ProtectedRoute.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { api } from '@/lib/api'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, setUser } = useStore()

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.push('/login')
        return
      }

      try {
        // Verify token with backend
        const userData = await api('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        setUser(userData)
      } catch (err) {
        // Token invalid, redirect to login
        localStorage.removeItem('token')
        router.push('/login')
      }
    }

    if (!user) {
      checkAuth()
    }
  }, [user, router, setUser])

  if (!user) {
    return <div>Loading...</div>
  }

  return <>{children}</>
}

// Usage in dashboard:
// app/dashboard/page.tsx
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function Dashboard() {
  return (
    <ProtectedRoute>
      {/* Dashboard content */}
    </ProtectedRoute>
  )
}
```

## Update Zustand Store

```typescript
// lib/store.ts
import { create } from 'zustand'

interface User {
  id: string
  username: string
  credits: number
  current_elo: number
  peak_elo: number
  wins: number
  losses: number
}

interface Store {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

export const useStore = create<Store>((set) => ({
  user: null,
  
  setUser: (user) => set({ user }),
  
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('private_key')
    set({ user: null })
  }
}))
```

## Acceptance Criteria

- [ ] Can register new account at `/register`
- [ ] Keypair generated locally (private key never sent to server)
- [ ] Private key stored in localStorage
- [ ] Registration success → redirects to `/dashboard`
- [ ] Shows error if username taken or invalid
- [ ] Can login at `/login`
- [ ] Login success → redirects to `/dashboard`
- [ ] Protected routes check for valid token
- [ ] Invalid/expired token → redirects to `/login`
- [ ] Logout button clears token and redirects

## Testing

1. Register new user
2. Check localStorage has `token` and `private_key`
3. Refresh page (should stay logged in)
4. Delete token from localStorage
5. Try to access `/dashboard` (should redirect to login)
6. Login again (should work)

## Handoff

When done:
1. Create `handoffs/to-backend.md`:
   ```
   Auth UI complete!
   Users can register/login successfully.
   
   Next needed:
   - Shop API (GET /api/shop/items, POST /api/shop/purchase)
   - Dashboard will show credits/ELO from auth/me endpoint
   ```
2. Move task to `tasks/done/004-frontend-auth-ui.md`

## Notes

⚠️ **Security:**
- Private key in localStorage is not ideal for production
- Consider using IndexedDB or encrypted storage
- Add "Remember Me" checkbox for token expiry

💡 **UX improvements:**
- Add loading spinner during registration
- Show success toast after registration
- Add form validation before submit
- Show password strength (if adding passwords later)
