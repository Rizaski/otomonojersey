/**
 * Deployment-specific Firebase initialization
 * Handles common deployment issues with Firebase
 */

(function() {
  'use strict';

  console.log('[Deployment] Starting Firebase initialization...');

  // Track initialization state
  let isInitialized = false;
  let initAttempts = 0;
  const maxInitAttempts = 10;

  // Function to initialize Firebase with retry logic
  async function initializeFirebase() {
    if (isInitialized) {
      console.log('[Deployment] Firebase already initialized');
      return true;
    }

    try {
      initAttempts++;
      console.log(`[Deployment] Firebase initialization attempt ${initAttempts}/${maxInitAttempts}`);

      // Check if Firebase SDK is loaded
      if (typeof firebase === 'undefined') {
        console.error('[Deployment] Firebase SDK not loaded');
        return false;
      }

      // Firebase configuration
      const firebaseConfig = {
        apiKey: 'AIzaSyDrLm4hxslT2H_jaT6eQrAEK8swP55h6_c',
        authDomain: 'jeysey-39fb6.firebaseapp.com',
        projectId: 'jeysey-39fb6',
        storageBucket: 'jeysey-39fb6.firebasestorage.app',
        messagingSenderId: '71940333413',
        appId: '1:71940333413:web:c9986db4e5e314d8124b8c'
      };

      // Initialize Firebase app
      let app;
      try {
        app = firebase.app();
        console.log('[Deployment] Using existing Firebase app');
      } catch (e) {
        app = firebase.initializeApp(firebaseConfig);
        console.log('[Deployment] Created new Firebase app');
      }

      // Initialize services
      const auth = firebase.auth();
      const db = firebase.firestore();

      // Configure auth for deployment
      try {
        auth.settings.appVerificationDisabledForTesting = false;
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        console.log('[Deployment] Auth persistence set to LOCAL');
      } catch (persistenceError) {
        console.warn('[Deployment] Failed to set auth persistence:', persistenceError);
        try {
          await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
          console.log('[Deployment] Auth persistence set to SESSION');
        } catch (sessionError) {
          console.warn('[Deployment] Failed to set session persistence:', sessionError);
        }
      }

      // Configure Firestore for deployment
      try {
        db.settings({
          ignoreUndefinedProperties: true
        });
        console.log('[Deployment] Firestore configured');
      } catch (dbError) {
        console.warn('[Deployment] Failed to configure Firestore:', dbError);
      }

      // Expose services globally
      window.firebaseApp = app;
      window.firebaseServices = { app, auth, db };

      // Set up auth state listener
      auth.onAuthStateChanged((user) => {
        console.log('[Deployment] Auth state changed:', user ? 'authenticated' : 'not authenticated');
        
        if (user) {
          // Update session
          localStorage.setItem('userSession', JSON.stringify({
            username: user.email,
            uid: user.uid,
            role: 'User',
            loginTime: new Date().toISOString()
          }));
        } else {
          localStorage.removeItem('userSession');
        }
      });

      isInitialized = true;
      console.log('[Deployment] Firebase initialization successful');
      return true;

    } catch (error) {
      console.error('[Deployment] Firebase initialization failed:', error);
      
      if (initAttempts < maxInitAttempts) {
        console.log(`[Deployment] Retrying in 1 second... (${initAttempts}/${maxInitAttempts})`);
        setTimeout(initializeFirebase, 1000);
        return false;
      } else {
        console.error('[Deployment] Firebase initialization failed after all attempts');
        return false;
      }
    }
  }

  // Function to check if Firebase is ready
  function isFirebaseReady() {
    return !!(window.firebaseServices && window.firebaseServices.auth);
  }

  // Function to wait for Firebase to be ready
  async function waitForFirebase(timeout = 30000) {
    const startTime = Date.now();
    
    while (!isFirebaseReady()) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Firebase initialization timeout');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return true;
  }

  // Expose functions globally
  window.DeploymentFirebase = {
    initialize: initializeFirebase,
    isReady: isFirebaseReady,
    waitForReady: waitForFirebase
  };

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
  } else {
    initializeFirebase();
  }

  // Also try to initialize immediately
  initializeFirebase();

})();
