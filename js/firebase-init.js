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


