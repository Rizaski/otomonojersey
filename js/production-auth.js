/**
 * Production Authentication Configuration
 * Optimized for deployed environments
 */

// Production authentication settings
const PRODUCTION_AUTH_CONFIG = {
  // Timeout settings
  AUTH_TIMEOUT: 15000, // 15 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Firebase settings
  PERSISTENCE_TYPE: 'LOCAL', // LOCAL, SESSION, or NONE
  ENABLE_OFFLINE_PERSISTENCE: true,
  
  // Error handling
  ENABLE_DETAILED_ERRORS: false, // Set to true for debugging
  LOG_AUTH_EVENTS: true,
  
  // Security settings
  ENABLE_RATE_LIMITING: true,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 300000, // 5 minutes
};

// Enhanced authentication manager for production
class ProductionAuthManager {
  constructor() {
    this.config = PRODUCTION_AUTH_CONFIG;
    this.loginAttempts = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Wait for Firebase to be ready
      await this.waitForFirebase();
      
      // Configure Firebase for production
      await this.configureFirebase();
      
      this.isInitialized = true;
      console.log('[AuthManager] Production authentication initialized');
      return true;
    } catch (error) {
      console.error('[AuthManager] Initialization failed:', error);
      return false;
    }
  }

  async waitForFirebase(timeout = 10000) {
    const startTime = Date.now();
    
    while (!window.firebaseServices?.auth) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Firebase initialization timeout');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async configureFirebase() {
    const auth = window.firebaseServices.auth;
    
    // Set persistence
    try {
      const persistenceType = this.config.PERSISTENCE_TYPE === 'LOCAL' 
        ? firebase.auth.Auth.Persistence.LOCAL
        : firebase.auth.Auth.Persistence.SESSION;
      
      await auth.setPersistence(persistenceType);
      console.log('[AuthManager] Auth persistence set to', this.config.PERSISTENCE_TYPE);
    } catch (error) {
      console.warn('[AuthManager] Failed to set persistence:', error);
    }

    // Configure auth settings
    auth.settings.appVerificationDisabledForTesting = false;
    
    // Set up auth state listener
    auth.onAuthStateChanged((user) => {
      if (this.config.LOG_AUTH_EVENTS) {
        console.log('[AuthManager] Auth state changed:', user ? 'authenticated' : 'not authenticated');
      }
      
      if (user) {
        this.updateUserSession(user);
      } else {
        this.clearUserSession();
      }
    });
  }

  async authenticate(email, password) {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Authentication service not available');
      }
    }

    // Check rate limiting
    if (this.isRateLimited(email)) {
      throw new Error('Too many login attempts. Please try again later.');
    }

    const auth = window.firebaseServices.auth;
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Authentication timeout')), this.config.AUTH_TIMEOUT)
      );

      // Authentication promise
      const authPromise = auth.signInWithEmailAndPassword(email, password);

      // Race between auth and timeout
      const result = await Promise.race([authPromise, timeoutPromise]);
      
      if (!result?.user) {
        throw new Error('Authentication failed');
      }

      // Clear failed attempts on success
      this.loginAttempts.delete(email);
      
      // Update user session
      this.updateUserSession(result.user);
      
      return {
        success: true,
        user: {
          uid: result.user.uid,
          email: result.user.email,
          username: result.user.email,
          role: 'User'
        }
      };

    } catch (error) {
      // Record failed attempt
      this.recordFailedAttempt(email);
      
      // Handle specific errors
      const errorMessage = this.getErrorMessage(error);
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  updateUserSession(user) {
    const session = {
      username: user.email,
      uid: user.uid,
      role: 'User',
      loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('userSession', JSON.stringify(session));
  }

  clearUserSession() {
    localStorage.removeItem('userSession');
  }

  recordFailedAttempt(email) {
    const attempts = this.loginAttempts.get(email) || 0;
    this.loginAttempts.set(email, attempts + 1);
    
    if (attempts + 1 >= this.config.MAX_LOGIN_ATTEMPTS) {
      // Set lockout
      setTimeout(() => {
        this.loginAttempts.delete(email);
      }, this.config.LOCKOUT_DURATION);
    }
  }

  isRateLimited(email) {
    const attempts = this.loginAttempts.get(email) || 0;
    return attempts >= this.config.MAX_LOGIN_ATTEMPTS;
  }

  getErrorMessage(error) {
    if (!this.config.ENABLE_DETAILED_ERRORS) {
      return 'Authentication failed. Please check your credentials and try again.';
    }

    const errorMessages = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-email': 'Invalid email address format.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
      'Authentication timeout': 'Authentication timed out. Please check your connection.'
    };

    return errorMessages[error.code] || errorMessages[error.message] || 'Authentication failed. Please try again.';
  }

  async resetPassword(email) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await window.firebaseServices.auth.sendPasswordResetEmail(email);
      return { success: true, message: 'Password reset email sent.' };
    } catch (error) {
      return { success: false, message: this.getErrorMessage(error) };
    }
  }
}

// Initialize production auth manager
window.ProductionAuthManager = ProductionAuthManager;
