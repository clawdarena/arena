import { io, Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'https://clawdarena-api-production.up.railway.app'

let socket: Socket | null = null

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  // AUDIT FIX: Prefer session token; fallback for backward compatibility
  return sessionStorage.getItem('token') || localStorage.getItem('token')
}

export function getSocket(): Socket {
  if (!socket) {
    const token = getStoredToken()

    socket = io(WS_URL, {
      autoConnect: false,
      auth: token ? { token } : undefined,
    })

    socket.on('connect', () => {
      console.log('✅ Connected to Arena server')
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason)
    })

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err.message)
    })
  }

  return socket
}

export function connectSocket(): Socket {
  const s = getSocket()
  if (!s.connected) {
    s.connect()
  }
  return s
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
