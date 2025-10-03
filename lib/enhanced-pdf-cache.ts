/**
 * Enhanced PDF Cache System
 * Combines Redis cache with local fallback and CDN integration
 */

import { pdfCache as redisCache } from './redis-cache.js';
import { pdfCache as localCache } from './pdf-cache';
import { cdnAssets } from './cdn-assets';

export class EnhancedPDFCache {
  private useRedis: boolean;
  
  constructor() {
    // Check if Redis is available
    this.useRedis = !!(redisCache && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
    console.log(`📄 Enhanced PDF Cache initialized (Redis: ${this.useRedis ? 'enabled' : 'disabled - using local cache only'})`);
  }

  /**
   * Generate cache hash using the best available method
   */
  generateHash(quotation: any, selectedPackage?: any, selectedPromotion?: any, language = 'en'): string {
    if (this.useRedis && redisCache) {
      return redisCache.generateHash(quotation, selectedPackage, selectedPromotion, language);
    }
    return localCache.generateHash(quotation, selectedPackage, selectedPromotion, language);
  }

  /**
   * Get cached PDF with fallback strategy
   */
  async getCachedPDF(hash: string): Promise<Buffer | null> {
    try {
      // Try Redis first if available
      if (this.useRedis && redisCache) {
        const redisPdf = await redisCache.getCachedPDF(hash);
        if (redisPdf) {
          console.log('⚡ PDF served from Redis cache');
          return redisPdf;
        }
      }

      // Fallback to local cache
      const localPdf = await localCache.getCachedPDF(hash);
      if (localPdf) {
        console.log('⚡ PDF served from local cache');
        
        // If we have Redis, store in Redis for next time
        if (this.useRedis && redisCache) {
          await redisCache.cachePDF(hash, localPdf).catch(error => 
            console.warn('Failed to cache PDF in Redis:', error)
          );
        }
        
        return localPdf;
      }

      console.log('📄 PDF Cache miss');
      return null;
    } catch (error) {
      console.error('Error getting cached PDF:', error);
      return null;
    }
  }

  /**
   * Cache PDF in all available systems
   */
  async cachePDF(hash: string, buffer: Buffer): Promise<void> {
    try {
      // Cache in Redis first (primary)
      if (this.useRedis && redisCache) {
        await redisCache.cachePDF(hash, buffer);
      }

      // Cache locally (backup)
      await localCache.cachePDF(hash, buffer);

      console.log(`💾 PDF cached successfully (Redis: ${this.useRedis}, Local: true)`);
    } catch (error) {
      console.error('Error caching PDF:', error);
    }
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    try {
      const promises = [localCache.clearCache()];
      
      if (this.useRedis && redisCache) {
        promises.push(redisCache.clearCache());
      }

      await Promise.all(promises);
      console.log('🧹 All PDF caches cleared');
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  async getStats() {
    try {
      const localStats = localCache.getStats();
      let redisStats = null;

      if (this.useRedis && redisCache) {
        try {
          redisStats = await redisCache.getStats();
        } catch (error) {
          console.warn('Failed to get Redis cache stats:', error);
        }
      }

      return {
        local: localStats,
        redis: redisStats,
        total: {
          entries: (localStats.size || 0) + (redisStats?.size || 0),
          redisAvailable: this.useRedis,
          cacheHitRate: this.calculateHitRate()
        }
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        local: { size: 0, maxSize: 0, entries: [] },
        redis: null,
        total: { entries: 0, redisAvailable: false, cacheHitRate: 0 }
      };
    }
  }

  /**
   * Calculate cache hit rate (simplified)
   */
  private calculateHitRate(): number {
    // This would require tracking hits/misses over time
    // For now, return a placeholder
    return 0;
  }

  /**
   * Warm up cache with commonly used quotations
   */
  async warmCache(quotations: any[]): Promise<void> {
    console.log(`🔥 Warming PDF cache with ${quotations.length} quotations`);
    
    let warmed = 0;
    for (const quotation of quotations.slice(0, 10)) { // Limit to 10 for performance
      try {
        const hash = this.generateHash(quotation);
        const cached = await this.getCachedPDF(hash);
        
        if (!cached) {
          // Generate and cache PDF (you'd need to implement this)
          // This is just a placeholder showing the concept
          console.log(`📄 Generating PDF for quotation ${quotation.id} for cache warmup`);
        } else {
          warmed++;
        }
      } catch (error) {
        console.warn('Error warming cache for quotation:', quotation.id, error);
      }
    }
    
    console.log(`🔥 Cache warmup completed: ${warmed}/${quotations.length} already cached`);
  }

  /**
   * Cleanup expired entries in all caches
   */
  async cleanup(): Promise<void> {
    try {
      if (this.useRedis && redisCache) {
        await redisCache.cleanupExpired();
      }
      
      // Local cache cleanup is handled automatically
      console.log('🧹 Cache cleanup completed');
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  }

  /**
   * Health check for cache systems
   */
  async healthCheck(): Promise<{
    redis: { available: boolean; latency?: number };
    local: { available: boolean };
    overall: 'healthy' | 'degraded' | 'unhealthy';
  }> {
    const health = {
      redis: { available: false, latency: undefined as number | undefined },
      local: { available: true },
      overall: 'healthy' as 'healthy' | 'degraded' | 'unhealthy'
    };

    // Check Redis health
    if (this.useRedis && redisCache) {
      try {
        const startTime = Date.now();
        await redisCache.getStats(); // Simple operation to test connection
        health.redis.available = true;
        health.redis.latency = Date.now() - startTime;
        
        if (health.redis.latency > 1000) {
          health.overall = 'degraded';
        }
      } catch (error) {
        health.redis.available = false;
        health.overall = 'degraded';
        console.warn('Redis cache health check failed:', error);
      }
    }

    // If neither cache is working, mark as unhealthy
    if (!health.redis.available && !health.local.available) {
      health.overall = 'unhealthy';
    }

    return health;
  }
}

// Export singleton instance
export const enhancedPdfCache = new EnhancedPDFCache();
