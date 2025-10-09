/**
 * Performance optimization utilities
 */

class PerformanceManager {
  constructor() {
    this.cache = new Map();
    this.debounceTimers = new Map();
    this.throttleTimers = new Map();
    this.observers = new Map();
    this.init();
  }

  init() {
    // Monitor performance metrics
    this.monitorPerformance();
    
    // Setup lazy loading
    this.setupLazyLoading();
    
    // Setup image optimization
    this.setupImageOptimization();
  }

  /**
   * Debounce function calls
   */
  debounce(func, delay, key = 'default') {
    return (...args) => {
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key));
      }
      
      const timer = setTimeout(() => {
        func.apply(this, args);
        this.debounceTimers.delete(key);
      }, delay);
      
      this.debounceTimers.set(key, timer);
    };
  }

  /**
   * Throttle function calls
   */
  throttle(func, delay, key = 'default') {
    return (...args) => {
      if (this.throttleTimers.has(key)) {
        return;
      }
      
      func.apply(this, args);
      
      const timer = setTimeout(() => {
        this.throttleTimers.delete(key);
      }, delay);
      
      this.throttleTimers.set(key, timer);
    };
  }

  /**
   * Cache with TTL
   */
  cacheWithTTL(key, value, ttl = 300000) { // 5 minutes default
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  /**
   * Get from cache
   */
  getFromCache(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Lazy load images
   */
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Optimize images
   */
  setupImageOptimization() {
    // Add loading="lazy" to images
    document.querySelectorAll('img:not([loading])').forEach(img => {
      img.loading = 'lazy';
    });
  }

  /**
   * Monitor performance metrics
   */
  monitorPerformance() {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        window.ErrorHandler.logInfo('LCP', { value: lastEntry.startTime });
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          window.ErrorHandler.logInfo('FID', { value: entry.processingStart - entry.startTime });
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        window.ErrorHandler.logInfo('CLS', { value: clsValue });
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }

  /**
   * Preload critical resources
   */
  preloadResource(href, as = 'script') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  }

  /**
   * Bundle and minify CSS
   */
  bundleCSS() {
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
    const cssContent = styles.map(style => {
      if (style.tagName === 'STYLE') {
        return style.textContent;
      } else {
        // For external stylesheets, you'd need to fetch them
        return '';
      }
    }).join('\n');
    
    return cssContent;
  }

  /**
   * Compress data
   */
  async compressData(data) {
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    writer.write(new TextEncoder().encode(JSON.stringify(data)));
    writer.close();
    
    const chunks = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) chunks.push(value);
    }
    
    return new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
  }

  /**
   * Decompress data
   */
  async decompressData(compressedData) {
    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    writer.write(compressedData);
    writer.close();
    
    const chunks = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) chunks.push(value);
    }
    
    return JSON.parse(new TextDecoder().decode(new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []))));
  }

  /**
   * Virtual scrolling for large lists
   */
  setupVirtualScrolling(container, items, itemHeight, renderItem) {
    const containerHeight = container.clientHeight;
    const visibleItems = Math.ceil(containerHeight / itemHeight) + 2; // Buffer
    let scrollTop = 0;
    let startIndex = 0;
    let endIndex = Math.min(startIndex + visibleItems, items.length);

    const updateScroll = () => {
      const newStartIndex = Math.floor(scrollTop / itemHeight);
      const newEndIndex = Math.min(newStartIndex + visibleItems, items.length);
      
      if (newStartIndex !== startIndex || newEndIndex !== endIndex) {
        startIndex = newStartIndex;
        endIndex = newEndIndex;
        
        const visibleItemsSlice = items.slice(startIndex, endIndex);
        container.innerHTML = '';
        
        visibleItemsSlice.forEach((item, index) => {
          const element = renderItem(item, startIndex + index);
          element.style.position = 'absolute';
          element.style.top = `${(startIndex + index) * itemHeight}px`;
          element.style.height = `${itemHeight}px`;
          container.appendChild(element);
        });
        
        container.style.height = `${items.length * itemHeight}px`;
      }
    };

    container.addEventListener('scroll', () => {
      scrollTop = container.scrollTop;
      updateScroll();
    });

    updateScroll();
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Clear all timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.throttleTimers.clear();
    
    // Clear cache
    this.cache.clear();
    
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Global performance manager
window.PerformanceManager = new PerformanceManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  window.PerformanceManager.cleanup();
});
