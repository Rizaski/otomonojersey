/**
 * Production configuration
 */

// In browser environments, process.env is undefined. Detect environment safely.
var __isLocalhost = (function(){ try { return /^(localhost|127\.|\[::1\])/.test(window.location.hostname); } catch(_) { return false; }})();
var __NODE_ENV = (function(){ try { return __isLocalhost ? 'development' : 'production'; } catch(_) { return 'production'; }})();
var __API_BASE_URL = (function(){ try { return window.__API_BASE_URL || '/api'; } catch(_) { return '/api'; }})();
var __LOG_LEVEL = (function(){ try { return window.__LOG_LEVEL || 'info'; } catch(_) { return 'info'; }})();

const AppConfig = {
  // Application settings
  app: {
    name: 'Jersey OMS',
    version: '1.0.0',
    environment: __NODE_ENV,
    debug: __NODE_ENV !== 'production'
  },

  // API configuration
  api: {
    baseURL: __API_BASE_URL,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },

  // Security settings
  security: {
    passwordMinLength: 8,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    enableRateLimiting: true,
    enableXSSProtection: true,
    enableCSRFProtection: true
  },

  // Performance settings
  performance: {
    enableCaching: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    enableLazyLoading: true,
    enableImageOptimization: true,
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    enableVirtualScrolling: true,
    virtualScrollThreshold: 100
  },

  // Backup settings
  backup: {
    autoBackupInterval: 5 * 60 * 1000, // 5 minutes
    maxBackups: 10,
    enableAutoBackup: true,
    backupRetentionDays: 30
  },

  // Logging settings
  logging: {
    level: __LOG_LEVEL,
    maxLogEntries: 1000,
    enableConsoleLogging: __NODE_ENV !== 'production',
    enableServerLogging: __NODE_ENV === 'production',
    logRetentionDays: 7
  },

  // Feature flags
  features: {
    enableOfflineMode: true,
    enablePushNotifications: true,
    enableRealTimeUpdates: true,
    enableAdvancedSearch: true,
    enableBulkOperations: true,
    enableExport: true,
    enableImport: true
  },

  // UI settings
  ui: {
    theme: 'light',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    itemsPerPage: 25,
    enableAnimations: true,
    enableTooltips: true
  },

  // Validation rules
  validation: {
    orderId: {
      pattern: /^[a-zA-Z0-9_\-]+$/,
      minLength: 3,
      maxLength: 50
    },
    customerName: {
      pattern: /^[a-zA-Z\s\-'\.]+$/,
      minLength: 2,
      maxLength: 100
    },
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      maxLength: 255
    },
    phone: {
      pattern: /^[\+]?[1-9][\d]{0,15}$/,
      minLength: 10,
      maxLength: 15
    },
    quantity: {
      min: 1,
      max: 1000
    },
    jerseyNumber: {
      min: 0,
      max: 999
    }
  },

  // Error messages
  messages: {
    errors: {
      required: 'This field is required',
      invalidEmail: 'Please enter a valid email address',
      invalidPhone: 'Please enter a valid phone number',
      passwordTooWeak: 'Password does not meet security requirements',
      passwordsDoNotMatch: 'Passwords do not match',
      networkError: 'Network error. Please check your connection.',
      serverError: 'Server error. Please try again later.',
      unauthorized: 'You are not authorized to perform this action.',
      notFound: 'The requested resource was not found.',
      validationFailed: 'Please check your input and try again.'
    },
    success: {
      saved: 'Changes saved successfully',
      created: 'Item created successfully',
      updated: 'Item updated successfully',
      deleted: 'Item deleted successfully',
      passwordChanged: 'Password changed successfully',
      backupCreated: 'Backup created successfully',
      dataExported: 'Data exported successfully',
      dataImported: 'Data imported successfully'
    },
    warnings: {
      unsavedChanges: 'You have unsaved changes. Are you sure you want to leave?',
      deleteConfirm: 'Are you sure you want to delete this item?',
      logoutConfirm: 'Are you sure you want to logout?',
      backupRestore: 'This will restore data from backup. Current data will be lost.'
    }
  },

  // Development settings
  development: {
    enableMockData: __NODE_ENV === 'development',
    enableDebugMode: __NODE_ENV === 'development',
    enableHotReload: __NODE_ENV === 'development',
    mockDelay: 1000 // Simulate network delay
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppConfig;
} else {
  window.AppConfig = AppConfig;
}
