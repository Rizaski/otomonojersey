/**
 * Firebase Authentication Debug Tool
 * Helps diagnose authentication issues in deployed environments
 */

class AuthDebugger {
  constructor() {
    this.debugMode = localStorage.getItem('authDebug') === 'true';
    this.logs = [];
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, data };
    this.logs.push(logEntry);
    
    if (this.debugMode) {
      console.log(`[AuthDebug ${timestamp}]`, message, data);
    }
  }

  async diagnoseAuthIssues() {
    this.log('Starting authentication diagnosis...');
    
    const issues = [];
    
    // Check Firebase SDK availability
    if (typeof firebase === 'undefined') {
      issues.push({
        type: 'critical',
        message: 'Firebase SDK not loaded',
        solution: 'Check Firebase CDN links in HTML'
      });
    } else {
      this.log('Firebase SDK loaded successfully');
    }

    // Check Firebase configuration
    if (window.firebaseServices) {
      this.log('Firebase services available', {
        app: !!window.firebaseServices.app,
        auth: !!window.firebaseServices.auth,
        db: !!window.firebaseServices.db
      });
    } else {
      issues.push({
        type: 'critical',
        message: 'Firebase services not initialized',
        solution: 'Check firebase-bootstrap.js loading'
      });
    }

    // Check authentication state
    if (window.firebaseServices && window.firebaseServices.auth) {
      try {
        const currentUser = window.firebaseServices.auth.currentUser;
        this.log('Current user state', { 
          authenticated: !!currentUser,
          uid: currentUser?.uid,
          email: currentUser?.email
        });
      } catch (error) {
        issues.push({
          type: 'error',
          message: 'Error checking auth state',
          error: error.message
        });
      }
    }

    // Check network connectivity
    try {
      const response = await fetch('https://www.google.com', { mode: 'no-cors' });
      this.log('Network connectivity: OK');
    } catch (error) {
      issues.push({
        type: 'warning',
        message: 'Network connectivity issues detected',
        solution: 'Check internet connection'
      });
    }

    // Check Firebase project configuration
    if (window.firebaseServices && window.firebaseServices.app) {
      const config = window.firebaseServices.app.options;
      this.log('Firebase config', {
        projectId: config.projectId,
        authDomain: config.authDomain,
        apiKey: config.apiKey ? 'Present' : 'Missing'
      });

      // Validate configuration
      if (!config.apiKey) {
        issues.push({
          type: 'critical',
          message: 'Firebase API key missing',
          solution: 'Check Firebase configuration'
        });
      }

      if (!config.authDomain) {
        issues.push({
          type: 'critical',
          message: 'Firebase auth domain missing',
          solution: 'Check Firebase configuration'
        });
      }
    }

    // Check browser compatibility
    const browserInfo = {
      userAgent: navigator.userAgent,
      cookiesEnabled: navigator.cookieEnabled,
      localStorage: typeof Storage !== 'undefined',
      serviceWorker: 'serviceWorker' in navigator
    };
    
    this.log('Browser compatibility', browserInfo);

    if (!navigator.cookieEnabled) {
      issues.push({
        type: 'warning',
        message: 'Cookies disabled',
        solution: 'Enable cookies for authentication'
      });
    }

    if (typeof Storage === 'undefined') {
      issues.push({
        type: 'critical',
        message: 'LocalStorage not supported',
        solution: 'Use a modern browser'
      });
    }

    // Check CORS issues
    try {
      const testUrl = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test';
      const response = await fetch(testUrl, { method: 'POST' });
      this.log('Firebase API accessibility: OK');
    } catch (error) {
      if (error.message.includes('CORS')) {
        issues.push({
          type: 'error',
          message: 'CORS policy blocking Firebase requests',
          solution: 'Check domain configuration in Firebase Console'
        });
      }
    }

    return {
      issues,
      logs: this.logs,
      summary: this.generateSummary(issues)
    };
  }

  generateSummary(issues) {
    const critical = issues.filter(i => i.type === 'critical').length;
    const errors = issues.filter(i => i.type === 'error').length;
    const warnings = issues.filter(i => i.type === 'warning').length;

    return {
      total: issues.length,
      critical,
      errors,
      warnings,
      status: critical > 0 ? 'critical' : errors > 0 ? 'error' : warnings > 0 ? 'warning' : 'healthy'
    };
  }

  async testLogin(email, password) {
    this.log('Testing login with provided credentials...');
    
    if (!window.firebaseServices || !window.firebaseServices.auth) {
      throw new Error('Firebase authentication not available');
    }

    try {
      const result = await window.firebaseServices.auth.signInWithEmailAndPassword(email, password);
      this.log('Login test successful', {
        uid: result.user?.uid,
        email: result.user?.email
      });
      return { success: true, user: result.user };
    } catch (error) {
      this.log('Login test failed', {
        code: error.code,
        message: error.message
      });
      return { success: false, error: error.message };
    }
  }

  enableDebugMode() {
    localStorage.setItem('authDebug', 'true');
    this.debugMode = true;
    console.log('Auth debug mode enabled');
  }

  disableDebugMode() {
    localStorage.setItem('authDebug', 'false');
    this.debugMode = false;
    console.log('Auth debug mode disabled');
  }

  exportLogs() {
    const logsData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs: this.logs
    };
    
    const blob = new Blob([JSON.stringify(logsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auth-debug-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Make available globally
window.AuthDebugger = AuthDebugger;

// Auto-run diagnosis if debug mode is enabled
if (localStorage.getItem('authDebug') === 'true') {
  const debugger = new AuthDebugger();
  debugger.diagnoseAuthIssues().then(result => {
    console.log('Authentication Diagnosis Results:', result);
  });
}
