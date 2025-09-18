import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

/**
 * Optimized Redis Cache Implementation
 * Provides intelligent caching for database queries
 */

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
  staleWhileRevalidate?: number // Stale while revalidate in seconds
}

export class OptimizedRedisCache {
  private static instance: OptimizedRedisCache
  private defaultTTL = 300 // 5 minutes
  private staleWhileRevalidate = 600 // 10 minutes

  static getInstance(): OptimizedRedisCache {
    if (!OptimizedRedisCache.instance) {
      OptimizedRedisCache.instance = new OptimizedRedisCache()
    }
    return OptimizedRedisCache.instance
  }

  /**
   * Get cached data with stale-while-revalidate pattern
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key)
      if (cached) {
        return JSON.parse(cached as string)
      }
      return null
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  /**
   * Set cached data with TTL and tags
   */
  async set<T>(
    key: string, 
    data: T, 
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const ttl = options.ttl || this.defaultTTL
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl,
        tags: options.tags || []
      }
      
      await redis.setex(key, ttl, JSON.stringify(cacheData))
      
      // Store tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.addTagsToKey(key, options.tags)
      }
    } catch (error) {
      console.error('Redis set error:', error)
    }
  }

  /**
   * Get or set pattern with stale-while-revalidate
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    try {
      // Try to get cached data
      const cached = await this.get<{data: T, timestamp: number, ttl: number}>(key)
      
      if (cached) {
        const age = Date.now() - cached.timestamp
        const staleThreshold = (cached.ttl * 1000) + (options.staleWhileRevalidate || this.staleWhileRevalidate) * 1000
        
        // If data is fresh, return it
        if (age < cached.ttl * 1000) {
          return cached.data
        }
        
        // If data is stale but within revalidate window, return stale data and refresh in background
        if (age < staleThreshold) {
          // Return stale data immediately
          const staleData = cached.data
          
          // Refresh in background (don't await)
          this.refreshInBackground(key, fetcher, options)
          
          return staleData
        }
      }
      
      // No cached data or data is too stale, fetch fresh data
      const freshData = await fetcher()
      await this.set(key, freshData, options)
      
      return freshData
    } catch (error) {
      console.error('Redis getOrSet error:', error)
      // Fallback to direct fetch if Redis fails
      return await fetcher()
    }
  }

  /**
   * Refresh data in background
   */
  private async refreshInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const freshData = await fetcher()
      await this.set(key, freshData, options)
    } catch (error) {
      console.error('Background refresh error:', error)
    }
  }

  /**
   * Invalidate cache by key
   */
  async invalidate(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error('Redis invalidate error:', error)
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const keys = await redis.smembers(`tag:${tag}`)
        if (keys.length > 0) {
          await redis.del(...keys)
        }
        await redis.del(`tag:${tag}`)
      }
    } catch (error) {
      console.error('Redis invalidateByTags error:', error)
    }
  }

  /**
   * Add tags to a key for invalidation
   */
  private async addTagsToKey(key: string, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        await redis.sadd(`tag:${tag}`, key)
      }
    } catch (error) {
      console.error('Redis addTagsToKey error:', error)
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memory_usage: string
    connected_clients: number
    total_commands_processed: number
  }> {
    try {
      const info = await redis.info('memory')
      const stats = await redis.info('stats')
      
      return {
        memory_usage: this.extractInfoValue(info, 'used_memory_human') || 'Unknown',
        connected_clients: parseInt(this.extractInfoValue(stats, 'connected_clients') || '0'),
        total_commands_processed: parseInt(this.extractInfoValue(stats, 'total_commands_processed') || '0')
      }
    } catch (error) {
      console.error('Redis stats error:', error)
      return {
        memory_usage: 'Unknown',
        connected_clients: 0,
        total_commands_processed: 0
      }
    }
  }

  /**
   * Extract value from Redis INFO output
   */
  private extractInfoValue(info: string, key: string): string | null {
    const match = info.match(new RegExp(`${key}:(.+)`))
    return match ? match[1].trim() : null
  }

  /**
   * Clear all cache (use with caution)
   */
  async clearAll(): Promise<void> {
    try {
      await redis.flushdb()
    } catch (error) {
      console.error('Redis clearAll error:', error)
    }
  }
}

// Export singleton instance
export const cache = OptimizedRedisCache.getInstance()

// Cache key generators
export const CacheKeys = {
  dashboardMetrics: () => 'dashboard:metrics',
  quotationsSearch: (search: string, status: string, userEmail: string, offset: number, limit: number) => 
    `quotations:search:${search}:${status}:${userEmail}:${offset}:${limit}`,
  quotationsAnalytics: (fromDate: string, toDate: string) => 
    `quotations:analytics:${fromDate}:${toDate}`,
  bookingsAnalytics: (fromDate: string, toDate: string) => 
    `bookings:analytics:${fromDate}:${toDate}`,
  vehicleUtilization: () => 'vehicles:utilization',
  driverPerformance: () => 'drivers:performance',
  userProfile: (userId: string) => `user:profile:${userId}`,
  vehicleDetails: (vehicleId: string) => `vehicle:details:${vehicleId}`,
  driverDetails: (driverId: string) => `driver:details:${driverId}`
}

// Cache tags for invalidation
export const CacheTags = {
  quotations: 'quotations',
  bookings: 'bookings',
  vehicles: 'vehicles',
  drivers: 'drivers',
  inspections: 'inspections',
  maintenance: 'maintenance',
  dashboard: 'dashboard',
  user: 'user'
}
