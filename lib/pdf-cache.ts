import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * PDF Cache System
 * Caches generated PDFs based on content hash to avoid regeneration
 */

interface CacheEntry {
  hash: string;
  filename: string;
  createdAt: number;
  expiresAt: number;
}

class PDFCache {
  private cacheDir: string;
  private cacheIndex: Map<string, CacheEntry> = new Map();
  private maxCacheSize = 100; // Maximum number of cached PDFs
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor() {
    // Use system temp directory for cache
    this.cacheDir = path.join(os.tmpdir(), 'pdf-cache');
    this.initCache();
  }

  private async initCache() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      console.log('📁 PDF Cache initialized at:', this.cacheDir);
    } catch (error) {
      console.warn('⚠️  Failed to initialize PDF cache directory:', error);
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
      const entry = this.cacheIndex.get(hash);
      if (!entry) {
        console.log('📄 PDF Cache miss - no entry found for hash:', hash.substring(0, 8));
        return null;
      }

      // Check if cache entry is expired
      if (Date.now() > entry.expiresAt) {
        console.log('📄 PDF Cache expired for hash:', hash.substring(0, 8));
        await this.removeFromCache(hash);
        return null;
      }

      const filePath = path.join(this.cacheDir, entry.filename);
      const buffer = await fs.readFile(filePath);
      console.log('✅ PDF Cache hit for hash:', hash.substring(0, 8));
      return buffer;
    } catch (error) {
      console.warn('⚠️  Failed to read cached PDF:', error);
      // Clean up invalid cache entry
      await this.removeFromCache(hash);
      return null;
    }
  }

  /**
   * Store PDF in cache
   */
  async cachePDF(hash: string, buffer: Buffer): Promise<void> {
    try {
      // Clean up old entries if cache is full
      if (this.cacheIndex.size >= this.maxCacheSize) {
        await this.cleanupOldEntries();
      }

      const filename = `${hash}.pdf`;
      const filePath = path.join(this.cacheDir, filename);
      
      await fs.writeFile(filePath, buffer);
      
      const entry: CacheEntry = {
        hash,
        filename,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.cacheExpiry
      };

      this.cacheIndex.set(hash, entry);
      console.log('💾 PDF cached with hash:', hash.substring(0, 8));
    } catch (error) {
      console.warn('⚠️  Failed to cache PDF:', error);
    }
  }

  /**
   * Remove entry from cache
   */
  private async removeFromCache(hash: string): Promise<void> {
    try {
      const entry = this.cacheIndex.get(hash);
      if (entry) {
        const filePath = path.join(this.cacheDir, entry.filename);
        await fs.unlink(filePath).catch(() => {}); // Ignore if file doesn't exist
        this.cacheIndex.delete(hash);
      }
    } catch (error) {
      console.warn('⚠️  Failed to remove from cache:', error);
    }
  }

  /**
   * Clean up oldest entries when cache is full
   */
  private async cleanupOldEntries(): Promise<void> {
    const entries = Array.from(this.cacheIndex.entries());
    entries.sort((a, b) => a[1].createdAt - b[1].createdAt);

    // Remove oldest 25% of entries
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      const [hash] = entries[i];
      await this.removeFromCache(hash);
    }

    console.log(`🧹 Cleaned up ${toRemove} old PDF cache entries`);
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map(file => 
          fs.unlink(path.join(this.cacheDir, file)).catch(() => {})
        )
      );
      this.cacheIndex.clear();
      console.log('🧹 PDF cache cleared');
    } catch (error) {
      console.warn('⚠️  Failed to clear cache:', error);
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cacheIndex.size,
      maxSize: this.maxCacheSize,
      cacheDir: this.cacheDir,
      entries: Array.from(this.cacheIndex.values()).map(entry => ({
        hash: entry.hash.substring(0, 8),
        createdAt: new Date(entry.createdAt).toISOString(),
        expiresAt: new Date(entry.expiresAt).toISOString()
      }))
    };
  }
}

// Export singleton instance
export const pdfCache = new PDFCache();
