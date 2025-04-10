"use client"

import { cache } from 'react'
import ms from 'ms'

type CacheEntry<T> = {
  data: T
  expiresAt: number
}

/**
 * Simple in-memory LRU cache with TTL support
 */
class MemoryCache<T = any> {
  private maxSize: number
  private defaultTTL: number
  private cache: Map<string, CacheEntry<T>>
  
  constructor(maxSize = 100, defaultTTL = 60 * 1000) {  // Default 1 minute TTL
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
    this.cache = new Map()
  }
  
  /**
   * Get an item from the cache
   * @param key Cache key
   * @returns The cached value or undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    
    if (!entry) return undefined
    
    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }
    
    // Move the accessed entry to the end to maintain LRU order
    this.cache.delete(key)
    this.cache.set(key, entry)
    
    return entry.data
  }
  
  /**
   * Set an item in the cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (overrides the default)
   */
  set(key: string, data: T, ttl?: number): void {
    // If the cache is at max size, remove the oldest entry (first in the Map)
    if (this.cache.size >= this.maxSize) {
      const iterator = this.cache.keys()
      const first = iterator.next()
      
      if (!first.done && first.value) {
        this.cache.delete(first.value)
      }
    }
    
    // Calculate expiration time
    const expiresAt = Date.now() + (ttl || this.defaultTTL)
    
    // Add the new entry
    this.cache.set(key, { data, expiresAt })
  }
  
  /**
   * Delete an item from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key)
  }
  
  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear()
  }
  
  /**
   * Get the number of entries in the cache
   */
  size(): number {
    return this.cache.size
  }
  
  /**
   * Get all keys in the cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }
}

// Create a singleton instance for the server
const globalCache = new MemoryCache(1000, 5 * 60 * 1000) // 1000 items, 5 minutes TTL

// Type definition for ms string format
type TimeString = `${number}${'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'y'}`

/**
 * Helper function to cache expensive data fetching operations
 * @param key The cache key
 * @param fetcher Function that fetches the data
 * @param ttl Optional TTL in milliseconds or as a string (e.g., '5m', '1h')
 * @returns The cached or freshly fetched data
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number | TimeString
): Promise<T> {
  // Try to get from cache
  const cachedData = globalCache.get(key)
  if (cachedData !== undefined) {
    return cachedData as T
  }
  
  // If not in cache, fetch the data
  const data = await fetcher()
  
  // Convert string TTL to milliseconds if provided
  let ttlMs: number | undefined
  if (typeof ttl === 'string') {
    ttlMs = ms(ttl as string)
  } else if (typeof ttl === 'number') {
    ttlMs = ttl
  }
  
  // Cache the result
  globalCache.set(key, data, ttlMs)
  
  return data
}

/**
 * Helper function to clear the cache for a specific key or pattern
 * @param keyOrPattern A specific key or a pattern (substring) to match
 * @param isPattern Whether to treat the key as a pattern
 */
export function clearCache(keyOrPattern: string, isPattern = false): void {
  if (!isPattern) {
    globalCache.delete(keyOrPattern)
    return
  }
  
  // If it's a pattern, remove all matching keys
  const keys = globalCache.keys()
  for (const key of keys) {
    if (key.includes(keyOrPattern)) {
      globalCache.delete(key)
    }
  }
}

/**
 * React Server Component safe cache with Next.js's cache function
 * Use this for RSC data fetching that doesn't need invalidation within a request
 */
export const fetchCached = cache(async <T>(key: string, fetcher: () => Promise<T>): Promise<T> => {
  return await getCachedData(key, fetcher)
})

// Export the cache instances for direct usage
export { globalCache } 