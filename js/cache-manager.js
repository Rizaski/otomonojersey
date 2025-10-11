/**
 * Cache Manager - Handles data caching with memory and localStorage
 * Provides intelligent caching with TTL, invalidation, and fallback strategies
 */

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.maxMemorySize = 50; // Max items in memory cache
    this.storagePrefix = 'jersey_cache_';
    this.isInitialized = false;
  }

  /**
   * Initialize cache manager
   */
  async init() {
    if (this.isInitialized) return;
    
    console.log('[CacheManager] Initializing...');
    
    // Clean expired entries from localStorage on startup
    this.cleanExpiredEntries();
    
    // Setup periodic cleanup
    setInterval(() => this.cleanExpiredEntries(), 60000); // Every minute
    
    this.isInitialized = true;
    console.log('[CacheManager] Initialized successfully');
  }

  /**
   * Generate cache key
   */
  generateKey(collection, options = {}) {
    const params = Object.keys(options)
      .sort()
      .map(key => `${key}=${options[key]}`)
      .join('&');
    return `${collection}${params ? `?${params}` : ''}`;
  }

  /**
   * Get data from cache (memory first, then localStorage)
   */
  async get(key) {
    // Check memory cache first
    if (this.memoryCache.has(key)) {
      const item = this.memoryCache.get(key);
      if (this.isValid(item)) {
        console.log(`[CacheManager] Memory hit for key: ${key}`);
        return item.data;
      } else {
        this.memoryCache.delete(key);
      }
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(this.storagePrefix + key);
      if (stored) {
        const item = JSON.parse(stored);
        if (this.isValid(item)) {
          // Move to memory cache for faster access
          this.setMemoryCache(key, item);
          console.log(`[CacheManager] Storage hit for key: ${key}`);
          return item.data;
        } else {
          localStorage.removeItem(this.storagePrefix + key);
        }
      }
    } catch (error) {
      console.warn('[CacheManager] Error reading from localStorage:', error);
    }

    console.log(`[CacheManager] Cache miss for key: ${key}`);
    return null;
  }

  /**
   * Set data in cache (both memory and localStorage)
   */
  async set(key, data, ttl = this.defaultTTL) {
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };

    // Set in memory cache
    this.setMemoryCache(key, item);

    // Set in localStorage
    try {
      localStorage.setItem(this.storagePrefix + key, JSON.stringify(item));
      console.log(`[CacheManager] Cached data for key: ${key}`);
    } catch (error) {
      console.warn('[CacheManager] Error writing to localStorage:', error);
    }
  }

  /**
   * Set item in memory cache with size management
   */
  setMemoryCache(key, item) {
    // Remove oldest items if cache is full
    if (this.memoryCache.size >= this.maxMemorySize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(key, item);
  }

  /**
   * Check if cache item is valid (not expired)
   */
  isValid(item) {
    return Date.now() - item.timestamp < item.ttl;
  }

  /**
   * Invalidate cache entry
   */
  async invalidate(key) {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(this.storagePrefix + key);
      console.log(`[CacheManager] Invalidated cache for key: ${key}`);
    } catch (error) {
      console.warn('[CacheManager] Error removing from localStorage:', error);
    }
  }

  /**
   * Invalidate all cache entries for a collection
   */
  async invalidateCollection(collection) {
    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(collection)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.storagePrefix + collection)) {
          localStorage.removeItem(key);
        }
      });
      console.log(`[CacheManager] Invalidated all cache for collection: ${collection}`);
    } catch (error) {
      console.warn('[CacheManager] Error clearing collection from localStorage:', error);
    }
  }

  /**
   * Clean expired entries from localStorage
   */
  cleanExpiredEntries() {
    try {
      const keys = Object.keys(localStorage);
      let cleaned = 0;
      
      keys.forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (!this.isValid(item)) {
              localStorage.removeItem(key);
              cleaned++;
            }
          } catch (error) {
            // Remove corrupted entries
            localStorage.removeItem(key);
            cleaned++;
          }
        }
      });

      if (cleaned > 0) {
        console.log(`[CacheManager] Cleaned ${cleaned} expired cache entries`);
      }
    } catch (error) {
      console.warn('[CacheManager] Error cleaning expired entries:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    this.memoryCache.clear();
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          localStorage.removeItem(key);
        }
      });
      console.log('[CacheManager] Cleared all cache');
    } catch (error) {
      console.warn('[CacheManager] Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const memorySize = this.memoryCache.size;
    let storageSize = 0;
    
    try {
      const keys = Object.keys(localStorage);
      storageSize = keys.filter(key => key.startsWith(this.storagePrefix)).length;
    } catch (error) {
      console.warn('[CacheManager] Error getting storage stats:', error);
    }

    return {
      memorySize,
      storageSize,
      totalSize: memorySize + storageSize
    };
  }
}

// Create global instance
window.CacheManager = new CacheManager();

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  window.CacheManager.init();
});

console.log('[CacheManager] Module loaded');
