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

  // Lightweight FirebaseData shim used by some pages
  if (!window.FirebaseData) window.FirebaseData = {};
  if (!window.FirebaseData.subscribe) {
    window.FirebaseData.subscribe = function(opts){
      const key = opts.path || opts.key;
      const coll = db.collection(key).orderBy(opts.orderBy || 'createdAt', opts.orderDir || 'desc');
      const limitApi = opts.limit ? coll.limit(opts.limit) : coll;
      return limitApi.onSnapshot(function(snap){
        const data = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
        if (opts.callback) opts.callback(data);
        if (opts.onChange) opts.onChange(data);
      });
    };
  }
  if (!window.FirebaseData.load) {
    window.FirebaseData.load = async function(key){
      const list = readCollection(key);
      return list;
    };
  }
  if (!window.FirebaseData.save) {
    window.FirebaseData.save = async function(key, data){
      if (Array.isArray(data)) { writeCollection(key, data); return true; }
      const list = readCollection(key);
      const idx = list.findIndex(x => x && x.id === data.id);
      if (idx >= 0) list[idx] = data; else list.push(data);
      writeCollection(key, list);
      return true;
    };
  }
})();
