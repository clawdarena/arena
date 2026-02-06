import { io, Socket } from 'socket.io-client'

const DEFAULT_URL = 'http://localhost:3001'

export class ArenaSocket {
  private socket: Socket
  private _connected: boolean = false

  constructor(url?: string) {
    const token = '' // TODO: Load from config
    this.socket = io(url || DEFAULT_URL, {
      autoConnect: false,
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    this.setupListeners()
  }

  private setupListeners(): void {
    this.socket.on('connect', () => {
      this._connected = true
      console.log('✅ Connected to Arena server')
    })

    this.socket.on('disconnect', (reason) => {
      this._connected = false
      console.log(`❌ Disconnected: ${reason}`)
    })

    this.socket.on('connect_error', (err) => {
      console.error(`Connection error: ${err.message}`)
    })

    this.socket.on('error', (error: { code: string; message: string }) => {
      console.error(`Arena error [${error.code}]: ${error.message}`)
    })
  }

  /**
   * Connect to the arena server.
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._connected) {
        resolve()
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout (10s)'))
      }, 10000)

      this.socket.once('connect', () => {
        clearTimeout(timeout)
        resolve()
      })

      this.socket.once('connect_error', (err) => {
        clearTimeout(timeout)
        reject(err)
      })

      this.socket.connect()
    })
  }

  /**
   * Disconnect from the arena server.
   */
  disconnect(): void {
    this.socket.disconnect()
    this._connected = false
  }

  /**
   * Register an event handler.
   */
  on(event: string, handler: (...args: any[]) => void): void {
    this.socket.on(event, handler)
  }

  /**
   * Remove an event handler.
   */
  off(event: string, handler?: (...args: any[]) => void): void {
    if (handler) {
      this.socket.off(event, handler)
    } else {
      this.socket.removeAllListeners(event)
    }
  }

  /**
   * Emit an event to the server.
   */
  emit(event: string, data: unknown): void {
    this.socket.emit(event, data)
  }

  /**
   * Check if connected.
   */
  get connected(): boolean {
    return this._connected
  }
}
