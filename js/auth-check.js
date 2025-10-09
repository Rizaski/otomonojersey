/**
 * Authentication Check Module
 * Protects application pages and manages user sessions
 */

class AuthManager {
  constructor() {
    this.sessionKey = 'userSession';
    this.loginPage = 'login.html';
    this.redirectParam = 'redirect';
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    try {
      const session = localStorage.getItem(this.sessionKey);
      if (!session) return false;

      const userSession = JSON.parse(session);
      
      // Check if session is valid (not expired)
      const loginTime = new Date(userSession.loginTime);
      const now = new Date();
      const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (now - loginTime > sessionDuration) {
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Get current user session
   */
  getCurrentUser() {
    try {
      const session = localStorage.getItem(this.sessionKey);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Logout user and clear session
   */
  logout() {
    try {
      localStorage.removeItem(this.sessionKey);
      
      // Log logout event
      if (window.ErrorHandler) {
        window.ErrorHandler.logInfo('User logged out', {
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  /**
   * Redirect to login page with current page as redirect parameter
   */
  redirectToLogin() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const redirectUrl = `${this.loginPage}?${this.redirectParam}=${encodeURIComponent(currentPage)}`;
    window.location.href = redirectUrl;
  }

  /**
   * Handle successful login redirect
   */
  handleLoginRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectPage = urlParams.get(this.redirectParam);
    
    if (redirectPage && redirectPage !== this.loginPage) {
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.href = redirectPage;
    } else {
      window.location.href = 'index.html';
    }
  }

  /**
   * Initialize authentication check for protected pages
   */
  init() {
    // Skip auth check for login page
    if (window.location.pathname.includes(this.loginPage)) {
      return;
    }

    // Check authentication
    if (!this.isAuthenticated()) {
      this.redirectToLogin();
      return;
    }

    // Update user info in UI if elements exist
    this.updateUserInfo();
  }

  /**
   * Update user information in the UI
   */
  updateUserInfo() {
    const user = this.getCurrentUser();
    if (!user) return;

    // Update profile user name if element exists
    const profileUserName = document.getElementById('profileUserName');
    if (profileUserName) {
      profileUserName.textContent = user.username;
    }

    // Update any other user-specific UI elements
    const userRoleElements = document.querySelectorAll('.user-role');
    userRoleElements.forEach(element => {
      element.textContent = user.role;
    });
  }

  /**
   * Add logout functionality to logout links
   */
  bindLogoutHandlers() {
    const logoutLinks = document.querySelectorAll('#logoutLink, [data-logout]');
    logoutLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
        this.redirectToLogin();
      });
    });
  }

  /**
   * Check session validity periodically
   */
  startSessionMonitoring() {
    // Check session every 5 minutes
    setInterval(() => {
      if (!this.isAuthenticated()) {
        this.redirectToLogin();
      }
    }, 5 * 60 * 1000);
  }
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Create global auth manager instance
  window.AuthManager = new AuthManager();
  
  // Initialize authentication check
  window.AuthManager.init();
  
  // Bind logout handlers
  window.AuthManager.bindLogoutHandlers();
  
  // Start session monitoring
  window.AuthManager.startSessionMonitoring();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthManager;
}
