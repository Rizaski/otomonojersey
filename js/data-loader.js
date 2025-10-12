/**
 * Data Loader - Standardized data loading with caching and skeleton loading
 * Provides consistent data loading patterns across all pages
 */

(function() {
  'use strict';

  const log = (...a) => console.log('[DataLoader]', ...a);
  const warn = (...a) => console.warn('[DataLoader]', ...a);
  const err = (...a) => console.error('[DataLoader]', ...a);

class DataLoader {
  constructor() {
    this.subscriptions = new Map();
  }

  /**
   * Subscribe to Firebase collection with caching and skeleton loading
   * @param {Object} options - Configuration options
   * @param {string} options.path - Firebase collection path
   * @param {string} options.containerId - DOM element ID for skeleton loading
   * @param {string} options.skeletonType - Type of skeleton (table, list, cards, form)
   * @param {Object} options.skeletonOptions - Skeleton configuration
   * @param {string} options.orderBy - Field to order by
   * @param {string} options.orderDir - Order direction (asc/desc)
   * @param {number} options.limit - Maximum number of documents
   * @param {Function} options.callback - Callback function to handle data
   * @param {Function} options.onChange - Alternative callback function
   * @param {boolean} options.showSkeleton - Whether to show skeleton loader
   * @param {number} options.cacheTTL - Cache time-to-live in milliseconds
   */
  subscribe(options = {}) {
    const {
      path,
      containerId = 'data-container',
      skeletonType = 'table',
      skeletonOptions = {},
      orderBy = 'createdAt',
      orderDir = 'desc',
      limit = null,
      callback = null,
      onChange = null,
      showSkeleton = true,
      cacheTTL = 300000 // 5 minutes
    } = options;

    if (!path) {
      console.error('[DataLoader] Path is required');
      return null;
    }

    // Wait for Firebase to be ready
    if (!window.firebaseServices || !window.firebaseServices.db) {
      setTimeout(() => this.subscribe(options), 100);
      return null;
    }

    // Use FirebaseData.subscribe for caching and skeleton loading
    if (window.FirebaseData && window.FirebaseData.subscribe) {
      log(`Using FirebaseData.subscribe for ${path}`);
      const subscriptionOptions = {
        path,
        containerId,
        skeletonType,
        skeletonOptions,
        orderBy,
        orderDir,
        limit,
        cacheTTL,
        showSkeleton,
        callback: callback || onChange
      };

      const unsubscribe = window.FirebaseData.subscribe(subscriptionOptions);
      
      // Store subscription for cleanup
      this.subscriptions.set(path, unsubscribe);
      
      return unsubscribe;
    }

    // Fallback to direct Firebase approach
    warn(`FirebaseData.subscribe not available for ${path}. Using fallback.`);
    return this._fallbackSubscribe(options);
  }

  /**
   * Fallback subscription method for direct Firebase access
   * @private
   */
  _fallbackSubscribe(options) {
    const {
      path,
      containerId = 'data-container',
      skeletonType = 'table',
      skeletonOptions = {},
      orderBy = 'createdAt',
      orderDir = 'desc',
      limit = null,
      callback = null,
      onChange = null
    } = options;

    log(`Using fallback subscription for ${path}`);

    const db = window.firebaseServices.db;
    const globalKey = `__${path}Data`;
    const subscriptionKey = `__${path}Sub`;

    // Show skeleton loader
    if (window.SkeletonLoader && containerId) {
      window.SkeletonLoader.show(containerId, skeletonType, skeletonOptions);
    }

    if (!window[subscriptionKey]) {
      let query = db.collection(path).orderBy(orderBy, orderDir);
      if (limit) query = query.limit(limit);

      window[subscriptionKey] = query.onSnapshot(
        (snap) => {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          window[globalKey] = data;
          
          log(`Fallback subscription data received for ${path}:`, data.length, 'items');
          
          // Hide skeleton loader
          if (window.SkeletonLoader && containerId) {
            window.SkeletonLoader.hide(containerId);
          }
          
          // Call callback
          if (callback) callback(data);
          if (onChange) onChange(data);
        },
        (error) => {
          console.warn(`[DataLoader] Subscription error for ${path}:`, error);
          
          // Hide skeleton loader on error
          if (window.SkeletonLoader && containerId) {
            window.SkeletonLoader.hide(containerId);
          }
          
          // Call callback with empty data
          if (callback) callback([]);
          if (onChange) onChange([]);
        }
      );
    } else {
      // Use existing data
      const data = window[globalKey] || [];
      
      // Hide skeleton loader
      if (window.SkeletonLoader && containerId) {
        window.SkeletonLoader.hide(containerId);
      }
      
      // Call callback
      if (callback) callback(data);
      if (onChange) onChange(data);
    }

    return () => {
      if (window[subscriptionKey]) {
        window[subscriptionKey]();
        window[subscriptionKey] = null;
      }
    };
  }

  /**
   * Unsubscribe from a specific collection
   * @param {string} path - Collection path
   */
  unsubscribe(path) {
    const unsubscribe = this.subscriptions.get(path);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(path);
    }
  }

  /**
   * Unsubscribe from all collections
   */
  unsubscribeAll() {
    this.subscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.subscriptions.clear();
  }

  /**
   * Get cached data for a collection
   * @param {string} path - Collection path
   * @returns {Array} Cached data
   */
  getCachedData(path) {
    const globalKey = `__${path}Data`;
    return window[globalKey] || [];
  }

  /**
   * Clear cached data for a collection
   * @param {string} path - Collection path
   */
  clearCache(path) {
    const globalKey = `__${path}Data`;
    const subscriptionKey = `__${path}Sub`;
    
    if (window[subscriptionKey]) {
      window[subscriptionKey]();
      window[subscriptionKey] = null;
    }
    
    window[globalKey] = null;
  }
}

// Create global instance
  window.DataLoader = new DataLoader();
  log('DataLoader module loaded');
})();
