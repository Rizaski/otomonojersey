(function(){
  'use strict';
  if (window.firebaseServices && window.firebaseServices.db) return;

  function ensureCollection(name){
    if (!localStorage.getItem(name)) localStorage.setItem(name, JSON.stringify([]));
  }
  function readCollection(name){
    ensureCollection(name);
    try { return JSON.parse(localStorage.getItem(name) || '[]'); } catch(e){ return []; }
  }
  function writeCollection(name, items){
    localStorage.setItem(name, JSON.stringify(items || []));
  }

  // Enhanced caching functions
  function getCachedData(collection, options = {}) {
    if (!window.CacheManager) return null;
    const cacheKey = window.CacheManager.generateKey(collection, options);
    return window.CacheManager.get(cacheKey);
  }

  function setCachedData(collection, data, options = {}) {
    if (!window.CacheManager) return;
    const cacheKey = window.CacheManager.generateKey(collection, options);
    window.CacheManager.set(cacheKey, data, options.cacheTTL || 300000); // 5 minutes default
  }

  function invalidateCache(collection) {
    if (window.CacheManager) {
      window.CacheManager.invalidateCollection(collection);
    }
  }

  const db = {
    collection: function(name){
      ensureCollection(name);
      return {
        doc: function(id){
          return {
            get: async function(){
              const list = readCollection(name);
              const found = list.find(x => x && x.id === id);
              return { exists: !!found, data: () => (found || {}) };
            },
            set: async function(data, opts){
              const list = readCollection(name);
              const idx = list.findIndex(x => x && x.id === id);
              if (idx >= 0) list[idx] = Object.assign({ id }, data);
              else list.push(Object.assign({ id }, data));
              writeCollection(name, list);
            }
          };
        },
        orderBy: function(field, dir){
          const api = {
            limit: function(){ return api; },
            onSnapshot: function(next){
              const list = readCollection(name);
              const sorted = list.slice().sort((a,b)=>{
                const av=a && a[field]; const bv=b && b[field];
                if (dir === 'desc') return (bv>av?1:-1);
                return (av>bv?1:-1);
              });
              next({ docs: sorted.map(d => ({ id: d.id, data: () => d })) });
              return function unsubscribe(){};
            },
            get: async function(){
              const list = readCollection(name);
              const sorted = list.slice().sort((a,b)=>{
                const av=a && a[field]; const bv=b && b[field];
                if (dir === 'desc') return (bv>av?1:-1);
                return (av>bv?1:-1);
              });
              return { docs: sorted.map(d => ({ id: d.id, data: () => d })) };
            }
          };
          return api;
        }
      };
    }
  };

  window.firebaseServices = { db: db };

  // Enhanced FirebaseData shim with caching and skeleton loading
  if (!window.FirebaseData) window.FirebaseData = {};
  if (!window.FirebaseData.subscribe) {
    window.FirebaseData.subscribe = function(opts){
      const key = opts.path || opts.key;
      
      // Show skeleton loader if available
      if (window.SkeletonLoader && opts.showSkeleton !== false) {
        const containerId = opts.containerId || 'data-container';
        window.SkeletonLoader.show(containerId, opts.skeletonType || 'table', opts.skeletonOptions);
      }
      
      // Try to load cached data first
      getCachedData(key, opts).then(cachedData => {
        if (cachedData && cachedData.length > 0) {
          console.log(`[LocalStorage] Using cached data for ${key}`);
          if (opts.callback) opts.callback(cachedData);
          if (opts.onChange) opts.onChange(cachedData);
          
          // Hide skeleton loader
          if (window.SkeletonLoader && opts.showSkeleton !== false) {
            const containerId = opts.containerId || 'data-container';
            window.SkeletonLoader.hide(containerId);
          }
        }
      });
      
      const coll = db.collection(key).orderBy(opts.orderBy || 'createdAt', opts.orderDir || 'desc');
      const limitApi = opts.limit ? coll.limit(opts.limit) : coll;
      return limitApi.onSnapshot(function(snap){
        const data = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
        
        // Cache the data
        setCachedData(key, data, opts);
        
        if (opts.callback) opts.callback(data);
        if (opts.onChange) opts.onChange(data);
        
        // Hide skeleton loader after data loads
        if (window.SkeletonLoader && opts.showSkeleton !== false) {
          const containerId = opts.containerId || 'data-container';
          window.SkeletonLoader.hide(containerId);
        }
      });
    };
  }
  if (!window.FirebaseData.load) {
    window.FirebaseData.load = async function(key, options = {}){
      // Check cache first
      const cachedData = await getCachedData(key, options);
      if (cachedData && !options.forceRefresh) {
        console.log(`[LocalStorage] Cache hit for ${key}`);
        return cachedData;
      }
      
      // Load from localStorage
      const list = readCollection(key);
      
      // Cache the data
      setCachedData(key, list, options);
      
      return list;
    };
  }
  if (!window.FirebaseData.save) {
    window.FirebaseData.save = async function(key, data){
      if (Array.isArray(data)) { 
        writeCollection(key, data); 
        invalidateCache(key);
        return true; 
      }
      const list = readCollection(key);
      const idx = list.findIndex(x => x && x.id === data.id);
      if (idx >= 0) list[idx] = data; else list.push(data);
      writeCollection(key, list);
      invalidateCache(key);
      return true;
    };
  }
})();
