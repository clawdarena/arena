import { io, Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

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
