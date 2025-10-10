// Firebase initialization for client portal (no authentication required)
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
      // Load Firestore service only (no auth needed for client portal)
      // eslint-disable-next-line no-undef
      const db = firebase.firestore ? firebase.firestore() : null;
      window.firebaseServices = { app: window.firebaseApp, auth: null, db: db };
      
      console.log('Firebase initialized for client portal (no auth required)');
    } catch (e) {
      console.error('Firebase initialization failed:', e);
    }
  }

  // Load Firebase SDK from CDN
  Promise.all([
    loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js'),
    loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js')
  ]).then(init).catch(function(e){
    console.error('Failed to load Firebase SDK:', e);
  });
})();
