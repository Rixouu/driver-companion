// @ts-ignore - ioredis might not be installed yet
import Redis from 'ioredis';
import crypto from 'crypto';

/**
 * Redis-based PDF Cache System
 * Replaces in-memory cache for multi-instance deployments
 */

interface CacheEntry {
  hash: string;
  createdAt: number;
  expiresAt: number;
  size: number;
}

class RedisPDFCache {
  private redis: Redis | null = null;
  private keyPrefix = 'pdf_cache:';
  private metaPrefix = 'pdf_meta:';
  private cacheExpiry = 24 * 60 * 60; // 24 hours in seconds
  private useLocalCache = false;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    // Check if Upstash Redis credentials are available
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.log('✅ Upstash Redis credentials found - initializing connection...');
      try {
        // Test the connection first
        const testResponse = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
          }
        });
        
        if (testResponse.ok) {
          console.log('✅ Upstash Redis connection successful');
          this.redis = null; // We'll use REST API instead of ioredis
          this.useLocalCache = false;
          return;
        } else {
          throw new Error('Upstash Redis ping failed');
        }
      } catch (error) {
        console.warn('⚠️  Upstash Redis connection failed, falling back to local cache:', error);
        this.redis = null;
        this.useLocalCache = true;
      }
    } else {
      console.log('⚠️  Upstash Redis credentials not found - using local cache only');
      this.redis = null;
      this.useLocalCache = true;
    }
  }

  /**
   * Generate a hash for quotation data to use as cache key
   */
  generateHash(quotation: any, selectedPackage?: any, selectedPromotion?: any, language = 'en'): string {
    const cacheData = {
      id: quotation.id,
      updated_at: quotation.updated_at,
      status: quotation.status,
      amount: quotation.amount,
      discount_percentage: quotation.discount_percentage,
      tax_percentage: quotation.tax_percentage,
      customer_name: quotation.customer_name,
      customer_email: quotation.customer_email,
      service_type: quotation.service_type,
      vehicle_type: quotation.vehicle_type,
      quotation_items: quotation.quotation_items,
      approval_signature: quotation.approval_signature,
      rejection_signature: quotation.rejection_signature,
      approved_at: quotation.approved_at,
      rejected_at: quotation.rejected_at,
      approval_notes: quotation.approval_notes,
      rejection_reason: quotation.rejection_reason,
      language,
      selectedPackage: selectedPackage ? {
        id: selectedPackage.id,
        name: selectedPackage.name,
        base_price: selectedPackage.base_price,
        items: selectedPackage.items
      } : null,
      selectedPromotion: selectedPromotion ? {
        id: selectedPromotion.id,
        code: selectedPromotion.code,
        discount_value: selectedPromotion.discount_value,
        discount_type: selectedPromotion.discount_type
      } : null
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(cacheData))
      .digest('hex');
  }

  /**
   * Get cached PDF if exists and not expired
   */
  async getCachedPDF(hash: string): Promise<Buffer | null> {
    try {
      if (this.useLocalCache) {
        console.log('📄 Using local cache for hash:', hash.substring(0, 8));
        return null;
      }

      // Use Upstash REST API
      const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!baseUrl || !token) {
        console.log('📄 Upstash Redis not configured, using local cache for hash:', hash.substring(0, 8));
        return null;
      }

      // Get PDF data using GET command
      const pdfResponse = await fetch(`${baseUrl}/get/${this.keyPrefix}${hash}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!pdfResponse.ok) {
        console.log('📄 Redis Cache miss - no entry found for hash:', hash.substring(0, 8));
        return null;
      }

      const pdfResult = await pdfResponse.json();
      if (!pdfResult.result) {
        console.log('📄 Redis Cache miss - empty result for hash:', hash.substring(0, 8));
        return null;
      }

      // Get metadata
      const metaResponse = await fetch(`${baseUrl}/get/${this.metaPrefix}${hash}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (metaResponse.ok) {
        const metaResult = await metaResponse.json();
        if (metaResult.result) {
          const meta: CacheEntry = JSON.parse(metaResult.result);
          if (Date.now() > meta.expiresAt) {
            console.log('📄 Redis Cache expired for hash:', hash.substring(0, 8));
            await this.removeFromCache(hash);
            return null;
          }
        }
      }

      // Convert base64 string back to Buffer
      const pdfBuffer = Buffer.from(pdfResult.result, 'base64');
      console.log('✅ Upstash Redis PDF Cache hit for hash:', hash.substring(0, 8));
      return pdfBuffer;
    } catch (error) {
      console.warn('⚠️  Failed to read cached PDF from Redis:', error);
      return null;
    }
  }

  /**
   * Store PDF in Redis cache
   */
  async cachePDF(hash: string, buffer: Buffer): Promise<void> {
    try {
      if (this.useLocalCache) {
        console.log('📄 Using local cache, skipping Redis cache for hash:', hash.substring(0, 8));
        return;
      }

      const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!baseUrl || !token) {
        console.log('📄 Upstash Redis not configured, skipping Redis cache for hash:', hash.substring(0, 8));
        return;
      }

      const now = Date.now();
      const expiresAt = now + (this.cacheExpiry * 1000);

      // Convert Buffer to base64 string for storage
      const base64Data = buffer.toString('base64');

      // Store PDF data using SET command with expiration
      const pdfResponse = await fetch(`${baseUrl}/set/${this.keyPrefix}${hash}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value: base64Data,
          ex: this.cacheExpiry
        })
      });

      if (!pdfResponse.ok) {
        console.warn('⚠️  Failed to store PDF in Upstash Redis:', await pdfResponse.text());
        return;
      }

      // Store metadata
      const meta: CacheEntry = {
        hash,
        createdAt: now,
        expiresAt,
        size: buffer.length
      };

      const metaResponse = await fetch(`${baseUrl}/set/${this.metaPrefix}${hash}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value: JSON.stringify(meta),
          ex: this.cacheExpiry
        })
      });

      if (metaResponse.ok) {
        console.log('💾 PDF cached in Upstash Redis with hash:', hash.substring(0, 8), `(${(buffer.length / 1024).toFixed(1)}KB)`);
      } else {
        console.warn('⚠️  Failed to store PDF metadata in Upstash Redis:', await metaResponse.text());
      }
    } catch (error) {
      console.warn('⚠️  Failed to cache PDF in Redis:', error);
    }
  }

  /**
   * Remove entry from cache
   */
  private async removeFromCache(hash: string): Promise<void> {
    try {
      if (this.useLocalCache) {
        return;
      }
      
      const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!baseUrl || !token) {
        return;
      }
      
      // Delete PDF data
      await fetch(`${baseUrl}/del/${this.keyPrefix}${hash}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Delete metadata
      await fetch(`${baseUrl}/del/${this.metaPrefix}${hash}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.warn('⚠️  Failed to remove from Redis cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    try {
      if (!this.redis || this.useLocalCache) {
        console.log('📄 Redis not available, skipping Redis cache clear');
        return;
      }
      
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      const metaKeys = await this.redis.keys(`${this.metaPrefix}*`);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      if (metaKeys.length > 0) {
        await this.redis.del(...metaKeys);
      }
      
      console.log(`🧹 Redis PDF cache cleared (${keys.length} entries)`);
    } catch (error) {
      console.warn('⚠️  Failed to clear Redis cache:', error);
    }
  }

  /**
   * Get cache stats
   */
  async getStats() {
    try {
      if (!this.redis || this.useLocalCache) {
        return {
          size: 0,
          totalSizeKB: 0,
          redisConnected: false,
          entries: []
        };
      }
      
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      const metaKeys = await this.redis.keys(`${this.metaPrefix}*`);
      
      let totalSize = 0;
      const entries = [];
      
      for (const metaKey of metaKeys.slice(0, 10)) { // Limit to 10 for performance
        try {
          const metaData = await this.redis.get(metaKey);
          if (metaData) {
            const meta: CacheEntry = JSON.parse(metaData);
            totalSize += meta.size;
            entries.push({
              hash: meta.hash.substring(0, 8),
              createdAt: new Date(meta.createdAt).toISOString(),
              expiresAt: new Date(meta.expiresAt).toISOString(),
              size: `${(meta.size / 1024).toFixed(1)}KB`
            });
          }
        } catch (error) {
          console.warn('Error reading cache entry metadata:', error);
        }
      }

      return {
        size: keys.length,
        totalSizeKB: Math.round(totalSize / 1024),
        redisConnected: this.redis.status === 'ready',
        entries
      };
    } catch (error) {
      console.warn('Failed to get Redis cache stats:', error);
      return {
        size: 0,
        totalSizeKB: 0,
        redisConnected: false,
        entries: []
      };
    }
  }

  /**
   * Cleanup expired entries (run periodically)
   */
  async cleanupExpired(): Promise<void> {
    try {
      if (!this.redis || this.useLocalCache) {
        return;
      }
      
      const metaKeys = await this.redis.keys(`${this.metaPrefix}*`);
      let cleanedCount = 0;

      for (const metaKey of metaKeys) {
        try {
          const metaData = await this.redis.get(metaKey);
          if (metaData) {
            const meta: CacheEntry = JSON.parse(metaData);
            if (Date.now() > meta.expiresAt) {
              await this.removeFromCache(meta.hash);
              cleanedCount++;
            }
          }
        } catch (error) {
          // Remove corrupted metadata
          if (this.redis) {
            await this.redis.del(metaKey);
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired Redis cache entries`);
      }
    } catch (error) {
      console.warn('⚠️  Failed to cleanup Redis cache:', error);
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Export singleton instance - check if Redis is available
let redisCache: RedisPDFCache | null = null;

try {
  if (process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_HOST) {
    redisCache = new RedisPDFCache();
  }
} catch (error) {
  console.warn('Redis not available, falling back to in-memory cache:', error);
}

export const pdfCache = redisCache;
