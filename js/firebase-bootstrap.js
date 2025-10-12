(function(){
  'use strict';

  const log = (...a) => console.log('[Firebase]', ...a);
  const warn = (...a) => console.warn('[Firebase]', ...a);
  const err = (...a) => console.error('[Firebase]', ...a);

  // Guard: SDK presence
  if (typeof firebase === 'undefined') {
    warn('SDK not detected; bootstrap will no-op (localstorage shim may be used).');
    return;
  }

  if (window.firebaseServices && window.firebaseServices.db && window.firebaseServices.auth) {
    log('Already initialized; skipping re-init.');
    return;
  }

  // Firebase configuration with deployment-specific settings
  const firebaseConfig = {
    apiKey: 'AIzaSyDrLm4hxslT2H_jaT6eQrAEK8swP55h6_c',
    authDomain: 'jeysey-39fb6.firebaseapp.com',
    projectId: 'jeysey-39fb6',
    storageBucket: 'jeysey-39fb6.firebasestorage.app',
    messagingSenderId: '71940333413',
    appId: '1:71940333413:web:c9986db4e5e314d8124b8c'
  };

  try {
    log('Initializing app...');
    const app = firebase.initializeApp(firebaseConfig);

    log('Initializing services...');
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Configure auth settings for production
    auth.settings.appVerificationDisabledForTesting = false;
    
    // Set persistence for better user experience
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(err => {
      warn('Failed to set auth persistence:', err);
    });

    // Expose globally (compat with existing code)
    window.firebaseApp = app;
    window.firebaseServices = { app, auth, db };
    
    log('Firebase services exposed globally:', {
      app: !!window.firebaseApp,
      auth: !!window.firebaseServices.auth,
      db: !!window.firebaseServices.db
    });

    // Enhanced auth state monitoring
    auth.onAuthStateChanged((user) => {
      if (user) {
        log('User authenticated:', { uid: user.uid, email: user.email });
        
        // Update user session in localStorage
        localStorage.setItem('userSession', JSON.stringify({
          username: user.email,
          uid: user.uid,
          role: 'User',
          loginTime: new Date().toISOString()
        }));
      } else {
        log('User not authenticated');
        localStorage.removeItem('userSession');
      }
    }, (error) => {
      err('Auth state change error:', error);
    });

    // Auth helpers with enhanced error handling
    const Auth = {
      onAuth(cb){
        try { return auth.onAuthStateChanged(cb); } catch(e){ err('onAuth error:', e); return function(){} }
      },
      async register(email, password){
        try { 
          log('register', email); 
          const { user } = await auth.createUserWithEmailAndPassword(email, password); 
          return user; 
        }
        catch(e){ 
          err('register error:', e); 
          throw e; 
        }
      },
      async login(email, password){
        try { 
          log('login', email); 
          const { user } = await auth.signInWithEmailAndPassword(email, password); 
          return user; 
        }
        catch(e){ 
          err('login error:', e); 
          throw e; 
        }
      },
      async logout(){ 
        try { 
          await auth.signOut(); 
          log('logout ok'); 
        } catch(e){ 
          err('logout error:', e); 
          throw e; 
        } 
      },
      async resetPassword(email) {
        try {
          await auth.sendPasswordResetEmail(email);
          log('Password reset email sent to:', email);
          return true;
        } catch(e) {
          err('Password reset error:', e);
          throw e;
        }
      }
    };

    // DB helpers with enhanced error handling
    const DB = {
      async add(collection, data){
        try { log('add', collection, data); const ref = await db.collection(collection).add(data); return ref.id; }
        catch(e){ err('add error:', e); throw e; }
      },
      async set(collection, id, data, merge){
        try { log('set', collection, id, data); await db.collection(collection).doc(id).set(data, { merge: !!merge }); return true; }
        catch(e){ err('set error:', e); throw e; }
      },
      async getAll(collection){
        try { log('getAll', collection); const snap = await db.collection(collection).get();
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch(e){ err('getAll error:', e); throw e; }
      },
      on(collection, cb){
        try { log('onSnapshot', collection); return db.collection(collection).onSnapshot(snap => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          cb(list);
        }, e => err('onSnapshot error:', e)); } catch(e){ err('on error:', e); return function(){} }
      }
    };

    // Minimal page demo hooks (optional usage in pages)
    window.FirebaseHelpers = { Auth, DB };

    // Add connection monitoring
    db.enableNetwork().then(() => {
      log('Firestore network enabled');
    }).catch(err => {
      warn('Failed to enable Firestore network:', err);
    });

    log('Bootstrap complete.');
  } catch(e){
    err('Initialization failed:', e);
    
    // Fallback: try to initialize with minimal config
    try {
      log('Attempting fallback initialization...');
      const app = firebase.initializeApp(firebaseConfig);
      const auth = firebase.auth();
      const db = firebase.firestore();
      
      window.firebaseApp = app;
      window.firebaseServices = { app, auth, db };
      
      log('Fallback initialization successful');
    } catch(fallbackError) {
      err('Fallback initialization also failed:', fallbackError);
    }
  }
})();
