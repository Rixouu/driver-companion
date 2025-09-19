import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
}

/**
 * Set a value in the cache with optional TTL and tags
 */
export async function setCache(
  key: string, 
  value: any, 
  ttl: number = 300,
  options: CacheOptions = {}
): Promise<void> {
  try {
    const serializedValue = JSON.stringify({
      data: value,
      timestamp: Date.now(),
      tags: options.tags || []
    })

    if (ttl > 0) {
      await redis.setex(key, ttl, serializedValue)
    } else {
      await redis.set(key, serializedValue)
    }

    // Store tags for invalidation
    if (options.tags && options.tags.length > 0) {
      for (const tag of options.tags) {
        await redis.sadd(`tag:${tag}`, key)
        await redis.expire(`tag:${tag}`, ttl)
      }
    }
  } catch (error) {
    console.error('Redis set error:', error)
    // Don't throw - caching should be non-blocking
  }
}

/**
 * Get a value from the cache
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key)
    if (!cached) return null

    const parsed = JSON.parse(cached as string)
    return parsed.data
  } catch (error) {
    console.error('Redis get error:', error)
    return null
  }
}

/**
 * Delete a specific key from the cache
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Redis delete error:', error)
  }
}

/**
 * Invalidate cache by key
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Redis invalidate error:', error)
  }
}

/**
 * Invalidate cache by tag
 */
export async function invalidateCacheByTag(tag: string): Promise<void> {
  try {
    const keys = await redis.smembers(`tag:${tag}`)
    if (keys.length > 0) {
      await redis.del(...keys)
      await redis.del(`tag:${tag}`)
    }
  } catch (error) {
    console.error('Redis tag invalidation error:', error)
  }
}

/**
 * Invalidate multiple tags at once
 */
export async function invalidateCacheByTags(tags: string[]): Promise<void> {
  try {
    for (const tag of tags) {
      await invalidateCacheByTag(tag)
    }
  } catch (error) {
    console.error('Redis multi-tag invalidation error:', error)
  }
}

/**
 * Clear all cache (use with caution)
 */
export async function clearAllCache(): Promise<void> {
  try {
    await redis.flushdb()
  } catch (error) {
    console.error('Redis clear all error:', error)
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  keys: number
  memory: string
  info: any
}> {
  try {
    const info = await redis.info('memory')
    const keys = await redis.dbsize()
    
    return {
      keys,
      memory: info,
      info: { keys, memory: info }
    }
  } catch (error) {
    console.error('Redis stats error:', error)
    return { keys: 0, memory: '0', info: {} }
  }
}

/**
 * Cache with automatic key generation
 */
export async function cacheWithKey(
  keyGenerator: () => string,
  dataFetcher: () => Promise<any>,
  ttl: number = 300,
  options: CacheOptions = {}
): Promise<any> {
  const key = keyGenerator()
  
  // Try to get from cache first
  const cached = await getCache(key)
  if (cached) {
    return cached
  }

  // Fetch data and cache it
  const data = await dataFetcher()
  await setCache(key, data, ttl, options)
  
  return data
}

/**
 * Cache for API responses with automatic invalidation
 */
export class APICache {
  private prefix: string
  private defaultTTL: number

  constructor(prefix: string = 'api', defaultTTL: number = 300) {
    this.prefix = prefix
    this.defaultTTL = defaultTTL
  }

  private getKey(endpoint: string, params: Record<string, any> = {}): string {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    
    return `${this.prefix}:${endpoint}:${paramString}`
  }

  async get<T = any>(
    endpoint: string, 
    params: Record<string, any> = {}
  ): Promise<T | null> {
    const key = this.getKey(endpoint, params)
    return await getCache<T>(key)
  }

  async set(
    endpoint: string,
    data: any,
    params: Record<string, any> = {},
    ttl: number = this.defaultTTL,
    options: CacheOptions = {}
  ): Promise<void> {
    const key = this.getKey(endpoint, params)
    await setCache(key, data, ttl, options)
  }

  async invalidate(endpoint: string, params: Record<string, any> = {}): Promise<void> {
    const key = this.getKey(endpoint, params)
    await invalidateCache(key)
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(`${this.prefix}:${pattern}`)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Redis pattern invalidation error:', error)
    }
  }
}

// Export a default API cache instance
export const apiCache = new APICache()