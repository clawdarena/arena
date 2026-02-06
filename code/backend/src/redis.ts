import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
})

export async function connectRedis() {
  try {
    await redis.connect()
    console.log('✅ Redis connected')
  } catch (error) {
    console.warn('⚠️ Redis connection failed (non-fatal for dev):', error)
  }
}
