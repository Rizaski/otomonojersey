/**
 * Production-ready error handling and logging system
 */

class ErrorHandler {
  constructor() {
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    this.currentLogLevel = this.logLevels.INFO;
    this.maxLogEntries = 1000;
    this.init();
  }

  init() {
    // Global error handlers
    window.addEventListener('error', (event) => {
      this.logError('Global Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });
  }

  /**
   * Log error with context
   */
  logError(message, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.addToLog(errorEntry);
    this.sendToServer(errorEntry);
  }

  /**
   * Log warning
   */
  logWarning(message, context = {}) {
    if (this.currentLogLevel >= this.logLevels.WARN) {
      const warningEntry = {
        timestamp: new Date().toISOString(),
        level: 'WARN',
        message,
        context,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      this.addToLog(warningEntry);
    }
  }

  /**
   * Log info
   */
  logInfo(message, context = {}) {
    if (this.currentLogLevel >= this.logLevels.INFO) {
      const infoEntry = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message,
        context,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      this.addToLog(infoEntry);
    }
  }

  /**
   * Add entry to local log
   */
  addToLog(entry) {
    try {
      const logs = JSON.parse(localStorage.getItem('appLogs') || '[]');
      logs.push(entry);
      
      // Keep only recent logs
      if (logs.length > this.maxLogEntries) {
        logs.splice(0, logs.length - this.maxLogEntries);
      }
      
      localStorage.setItem('appLogs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to add log entry:', error);
    }
  }

  /**
   * Send error to server (in production)
   */
  async sendToServer(entry) {
    try {
      // In production, this would send to your logging service
      if (window.location.hostname !== 'localhost') {
        await fetch('/api/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry)
        });
      }
    } catch (error) {
      console.error('Failed to send log to server:', error);
    }
  }

  /**
   * Get recent logs
   */
  getLogs(level = null, limit = 100) {
    try {
      const logs = JSON.parse(localStorage.getItem('appLogs') || '[]');
      let filteredLogs = logs;
      
      if (level) {
        filteredLogs = logs.filter(log => log.level === level);
      }
      
      return filteredLogs.slice(-limit);
    } catch (error) {
      console.error('Failed to get logs:', error);
      return [];
    }
  }

  /**
   * Clear logs
   */
  clearLogs() {
    localStorage.removeItem('appLogs');
  }

  /**
   * Export logs
   */
  exportLogs() {
    const logs = this.getLogs();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * User-friendly error messages
 */
class UserErrorHandler {
  constructor() {
    this.errorContainer = null;
    this.init();
  }

  init() {
    // Create error container
    this.errorContainer = document.createElement('div');
    this.errorContainer.id = 'error-container';
    this.errorContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
    `;
    document.body.appendChild(this.errorContainer);
  }

  /**
   * Show user-friendly error message
   */
  showError(message, type = 'error', duration = 5000) {
    const errorDiv = document.createElement('div');
    errorDiv.className = `alert alert-${type}`;
    errorDiv.style.cssText = `
      background: ${type === 'error' ? '#f8d7da' : type === 'warning' ? '#fff3cd' : '#d1edff'};
      color: ${type === 'error' ? '#721c24' : type === 'warning' ? '#856404' : '#0c5460'};
      border: 1px solid ${type === 'error' ? '#f5c6cb' : type === 'warning' ? '#ffeaa7' : '#bee5eb'};
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      animation: slideIn 0.3s ease;
    `;

    errorDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 18px; cursor: pointer; margin-left: 10px;">&times;</button>
      </div>
    `;

    this.errorContainer.appendChild(errorDiv);

    // Auto-remove after duration
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, duration);
  }

  /**
   * Show success message
   */
  showSuccess(message, duration = 3000) {
    this.showError(message, 'success', duration);
  }

  /**
   * Show warning message
   */
  showWarning(message, duration = 4000) {
    this.showError(message, 'warning', duration);
  }
}

// Global instances
window.ErrorHandler = new ErrorHandler();
window.UserErrorHandler = new UserErrorHandler();

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);
