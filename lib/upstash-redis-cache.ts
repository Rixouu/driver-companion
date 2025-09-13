/**
 * Upstash Redis REST API Cache System
 * Optimized for Upstash Redis REST API instead of ioredis
 */

interface CacheEntry {
  hash: string;
  createdAt: number;
  expiresAt: number;
  size: number;
}

class UpstashRedisCache {
  private baseUrl: string;
  private token: string;
  private keyPrefix = 'pdf_cache:';
  private metaPrefix = 'pdf_meta:';
  private cacheExpiry = 24 * 60 * 60; // 24 hours in seconds
  private useLocalCache = false;

  constructor() {
    this.initializeUpstash();
  }

  private initializeUpstash() {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!redisUrl || !redisToken) {
      console.log('⚠️  Upstash Redis credentials not found - using local cache only');
      this.useLocalCache = true;
      return;
    }

    this.baseUrl = redisUrl;
    this.token = redisToken;
    console.log('✅ Upstash Redis REST API initialized');
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
      selected_package: selectedPackage,
      selected_promotion: selectedPromotion,
      language
    };
    
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(JSON.stringify(cacheData)).digest('hex');
  }

  /**
   * Get cached PDF from Upstash Redis
   */
  async getCachedPDF(hash: string): Promise<Buffer | null> {
    try {
      if (this.useLocalCache) {
        console.log('📄 Using local cache for hash:', hash.substring(0, 8));
        return null;
      }

      // Get PDF data using GET command
      const pdfResponse = await fetch(`${this.baseUrl}/get/${this.keyPrefix}${hash}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
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
      const metaResponse = await fetch(`${this.baseUrl}/get/${this.metaPrefix}${hash}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
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
      console.warn('⚠️  Failed to read cached PDF from Upstash Redis:', error);
      return null;
    }
  }

  /**
   * Store PDF in Upstash Redis cache
   */
  async cachePDF(hash: string, buffer: Buffer): Promise<void> {
    try {
      if (this.useLocalCache) {
        console.log('📄 Using local cache, skipping Upstash Redis cache for hash:', hash.substring(0, 8));
        return;
      }

      const now = Date.now();
      const expiresAt = now + (this.cacheExpiry * 1000);

      // Convert Buffer to base64 string for storage
      const base64Data = buffer.toString('base64');

      // Store PDF data using SET command with expiration
      const pdfResponse = await fetch(`${this.baseUrl}/set/${this.keyPrefix}${hash}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
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

      const metaResponse = await fetch(`${this.baseUrl}/set/${this.metaPrefix}${hash}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
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
      console.warn('⚠️  Failed to cache PDF in Upstash Redis:', error);
    }
  }

  /**
   * Remove PDF from cache
   */
  private async removeFromCache(hash: string): Promise<void> {
    try {
      if (this.useLocalCache) {
        return;
      }
      
      // Delete PDF data
      await fetch(`${this.baseUrl}/del/${this.keyPrefix}${hash}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      // Delete metadata
      await fetch(`${this.baseUrl}/del/${this.metaPrefix}${hash}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
    } catch (error) {
      console.warn('⚠️  Failed to remove from Upstash Redis cache:', error);
    }
  }

  /**
   * Clear all cached PDFs
   */
  async clearCache(): Promise<void> {
    try {
      if (this.useLocalCache) {
        console.log('📄 Using local cache, skipping Upstash Redis cache clear');
        return;
      }
      
      // Get all keys with our prefix
      const keysResponse = await fetch(`${this.baseUrl}/keys/${this.keyPrefix}*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (keysResponse.ok) {
        const keysResult = await keysResponse.json();
        if (keysResult.result && keysResult.result.length > 0) {
          // Delete all PDF cache keys
          for (const key of keysResult.result) {
            await fetch(`${this.baseUrl}/del/${key}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${this.token}`
              }
            });
          }
        }
      }

      // Get all metadata keys
      const metaKeysResponse = await fetch(`${this.baseUrl}/keys/${this.metaPrefix}*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (metaKeysResponse.ok) {
        const metaKeysResult = await metaKeysResponse.json();
        if (metaKeysResult.result && metaKeysResult.result.length > 0) {
          // Delete all metadata keys
          for (const key of metaKeysResult.result) {
            await fetch(`${this.baseUrl}/del/${key}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${this.token}`
              }
            });
          }
        }
      }
      
      console.log('🧹 Upstash Redis PDF cache cleared');
    } catch (error) {
      console.warn('⚠️  Failed to clear Upstash Redis cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      if (this.useLocalCache) {
        return {
          size: 0,
          totalSizeKB: 0,
          redisConnected: false,
          entries: []
        };
      }
      
      // Get all PDF cache keys
      const keysResponse = await fetch(`${this.baseUrl}/keys/${this.keyPrefix}*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!keysResponse.ok) {
        return {
          size: 0,
          totalSizeKB: 0,
          redisConnected: false,
          entries: []
        };
      }

      const keysResult = await keysResponse.json();
      const keys = keysResult.result || [];
      
      let totalSize = 0;
      const entries = [];
      
      // Get metadata for first 10 entries
      for (const key of keys.slice(0, 10)) {
        try {
          const metaKey = key.replace(this.keyPrefix, this.metaPrefix);
          const metaResponse = await fetch(`${this.baseUrl}/get/${metaKey}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.token}`
            }
          });
          
          if (metaResponse.ok) {
            const metaResult = await metaResponse.json();
            if (metaResult.result) {
              const meta: CacheEntry = JSON.parse(metaResult.result);
              totalSize += meta.size;
              entries.push({
                hash: meta.hash.substring(0, 8),
                size: meta.size,
                createdAt: new Date(meta.createdAt).toISOString(),
                expiresAt: new Date(meta.expiresAt).toISOString()
              });
            }
          }
        } catch (error) {
          // Skip corrupted entries
        }
      }

      return {
        size: keys.length,
        totalSizeKB: Math.round(totalSize / 1024),
        redisConnected: true,
        entries
      };
    } catch (error) {
      console.warn('Failed to get Upstash Redis cache stats:', error);
      return {
        size: 0,
        totalSizeKB: 0,
        redisConnected: false,
        entries: []
      };
    }
  }

  /**
   * Clean up expired entries
   */
  async cleanupExpired(): Promise<void> {
    try {
      if (this.useLocalCache) {
        return;
      }
      
      // Get all metadata keys
      const metaKeysResponse = await fetch(`${this.baseUrl}/keys/${this.metaPrefix}*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!metaKeysResponse.ok) {
        return;
      }

      const metaKeysResult = await metaKeysResponse.json();
      const metaKeys = metaKeysResult.result || [];
      let cleanedCount = 0;

      for (const metaKey of metaKeys) {
        try {
          const metaResponse = await fetch(`${this.baseUrl}/get/${metaKey}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.token}`
            }
          });
          
          if (metaResponse.ok) {
            const metaResult = await metaResponse.json();
            if (metaResult.result) {
              const meta: CacheEntry = JSON.parse(metaResult.result);
              if (Date.now() > meta.expiresAt) {
                const pdfKey = metaKey.replace(this.metaPrefix, this.keyPrefix);
                await fetch(`${this.baseUrl}/del/${pdfKey}`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${this.token}`
                  }
                });
                await fetch(`${this.baseUrl}/del/${metaKey}`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${this.token}`
                  }
                });
                cleanedCount++;
              }
            }
          }
        } catch (error) {
          // Remove corrupted metadata
          await fetch(`${this.baseUrl}/del/${metaKey}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`
            }
          });
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired Upstash Redis cache entries`);
      }
    } catch (error) {
      console.warn('⚠️  Failed to cleanup Upstash Redis cache:', error);
    }
  }

  /**
   * Close connection (no-op for REST API)
   */
  async disconnect(): Promise<void> {
    // No connection to close for REST API
  }
}

// Export singleton instance
let upstashCache: UpstashRedisCache | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    upstashCache = new UpstashRedisCache();
  }
} catch (error) {
  console.warn('Upstash Redis not available, falling back to in-memory cache:', error);
}

export const pdfCache = upstashCache;
