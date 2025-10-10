// Firebase initialization for Jersey OMS
// This file uses the Firebase v9+ modular SDK via CDN imports.

// IMPORTANT: Do not commit secrets in production apps. The keys below were
// provided by the user for this demo setup. In Firebase, client keys are
// considered public but you should still restrict them in the Firebase console.

// Load Firebase from CDN when used as a classic script (non-module)
// If you prefer ESM in the future, switch to type="module" and import from CDN.
(function(){
  if (window.firebaseApp) return; // prevent double init

  // Guard: if Firebase SDK not present, dynamically load it
  function loadScript(src){
    return new Promise(function(resolve, reject){
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function init(){
    // eslint-disable-next-line no-undef
    const { initializeApp } = firebase;
    const firebaseConfig = {
      apiKey: "AIzaSyDrLm4hxslT2H_jaT6eQrAEK8swP55h6_c",
      authDomain: "jeysey-39fb6.firebaseapp.com",
      projectId: "jeysey-39fb6",
      storageBucket: "jeysey-39fb6.firebasestorage.app",
      messagingSenderId: "71940333413",
      appId: "1:71940333413:web:c9986db4e5e314d8124b8c"
    };
    try {
      // eslint-disable-next-line no-undef
      window.firebaseApp = initializeApp(firebaseConfig);
      // Load Auth and Firestore services (compat)
      // eslint-disable-next-line no-undef
      const auth = firebase.auth ? firebase.auth() : null;
      // eslint-disable-next-line no-undef
      const db = firebase.firestore ? firebase.firestore() : null;
      window.firebaseServices = { app: window.firebaseApp, auth: auth, db: db };
      
      // Production-grade defaults
      if (auth && auth.setPersistence) {
        // Persist auth across tabs/sessions
        // eslint-disable-next-line no-undef
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function(){});
        // Track current user globally for app logic
        auth.onAuthStateChanged(function(user){ window.currentUser = user || null; });
      }
      
      if (db && db.enablePersistence) {
        // Offline persistence + multi-tab support
        db.enablePersistence({ synchronizeTabs: true }).catch(function(){ /* ignore */ });
      }
      
      // Shared real-time cache utilities for pages
      if (!window.FirebaseData) window.FirebaseData = {};
      if (!window.__rtCache) window.__rtCache = {}; // { key: data[] }
      if (!window.__rtSubs) window.__rtSubs = {};   // { key: unsubscribe }

      // Subscribe to a collection with stable cache key
      window.FirebaseData.subscribe = function(options){
        // options: { key, path, orderBy, limit, where, onChange }
        if (!window.firebaseServices || !window.firebaseServices.db) return;
        var dbRef = window.firebaseServices.db.collection(options.path);
        if (options.where && Array.isArray(options.where)) {
          options.where.forEach(function(w){ dbRef = dbRef.where(w[0], w[1], w[2]); });
        }
        if (options.orderBy) dbRef = dbRef.orderBy(options.orderBy, options.orderDir||'desc');
        if (options.limit) dbRef = dbRef.limit(options.limit);
        // Emit cached immediately if present
        if (window.__rtCache[options.key]) {
          try { options.onChange(window.__rtCache[options.key]); } catch(_){}
        }
        // Setup subscription once
        if (!window.__rtSubs[options.key]) {
          window.__rtSubs[options.key] = dbRef.onSnapshot(function(snap){
            var list = snap.docs.map(function(d){ return Object.assign({ id: d.id }, d.data()); });
            var prev = window.__rtCache[options.key];
            // shallow equality check (ids and sizes) to avoid redundant renders
            var changed = true;
            if (Array.isArray(prev) && prev.length === list.length) {
              changed = false;
              for (var i=0;i<list.length;i++) {
                if (prev[i].id !== list[i].id) { changed = true; break; }
              }
            }
            if (!changed) return; // skip duplicate emissions
            window.__rtCache[options.key] = list;
            try { requestAnimationFrame(function(){ options.onChange(list); }); } catch(_) { try { options.onChange(list); } catch(__){} }
          }, function(){
            try { options.onChange([]); } catch(_){}
          });
        }
      };

      // Clear real-time cache and unsubscribe all listeners
      window.FirebaseData.clear = function(){
        try { Object.values(window.__rtSubs||{}).forEach(function(unsub){ try { unsub(); } catch(_){} }); } catch(_){}
        window.__rtSubs = {};
        window.__rtCache = {};
      };
      if (window.ErrorHandler) window.ErrorHandler.logInfo('Firebase initialized');
    } catch (e) {
      // Already initialized safety or other error
      if (window.ErrorHandler) window.ErrorHandler.logError('Firebase init failed', { message: e && e.message });
    }
  }

  // If older namespaced CDN is not present, load it
  var hasFirebase = !!window.firebase;
  var urls = [
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'
  ];
  var chain = Promise.resolve();
  if (!hasFirebase) {
    urls.forEach(function(u){ chain = chain.then(function(){ return loadScript(u); }); });
  }
  (hasFirebase ? Promise.resolve() : chain)
    .then(init)
    .catch(function(){ /* swallow to avoid blocking app */ });
})();


