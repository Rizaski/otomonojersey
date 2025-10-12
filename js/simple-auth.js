/**
 * Simple Authentication Helper
 * Provides basic authentication functions for deployment
 */

// Simple authentication helper
window.SimpleAuth = {
  // Test if Firebase is ready
  isReady() {
    return !!(window.firebaseServices && window.firebaseServices.auth);
  },

  // Wait for Firebase to be ready
  async waitForReady(timeout = 10000) {
    const startTime = Date.now();
    while (!this.isReady()) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Firebase initialization timeout');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return true;
  },

  // Create a test user (for development/testing)
  async createTestUser(email, password) {
    try {
      await this.waitForReady();
      const userCredential = await window.firebaseServices.auth.createUserWithEmailAndPassword(email, password);
      console.log('Test user created:', userCredential.user.email);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Failed to create test user:', error);
      return { success: false, error: error.message };
    }
  },

  // Test authentication
  async testAuth(email, password) {
    try {
      await this.waitForReady();
      const result = await window.firebaseServices.auth.signInWithEmailAndPassword(email, password);
      console.log('Authentication test successful:', result.user.email);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Authentication test failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser() {
    if (window.firebaseServices?.auth) {
      return window.firebaseServices.auth.currentUser;
    }
    return null;
  },

  // Sign out
  async signOut() {
    try {
      if (window.firebaseServices?.auth) {
        await window.firebaseServices.auth.signOut();
        localStorage.removeItem('userSession');
        console.log('User signed out successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Sign out error:', error);
      return false;
    }
  }
};

// Auto-test Firebase connection on load
document.addEventListener('DOMContentLoaded', async function() {
  try {
    await window.SimpleAuth.waitForReady(5000);
    console.log('[SimpleAuth] Firebase is ready');
  } catch (error) {
    console.error('[SimpleAuth] Firebase not ready:', error);
  }
});
