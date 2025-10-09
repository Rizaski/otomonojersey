/**
 * Data backup and recovery system
 */

class BackupManager {
  constructor() {
    this.backupInterval = 5 * 60 * 1000; // 5 minutes
    this.maxBackups = 10;
    this.autoBackupTimer = null;
    this.init();
  }

  init() {
    // Start auto-backup
    this.startAutoBackup();
    
    // Backup before page unload
    window.addEventListener('beforeunload', () => {
      this.createBackup();
    });
  }

  /**
   * Create backup of all application data
   */
  createBackup() {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {
          orders: JSON.parse(localStorage.getItem('orders') || '[]'),
          invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
          customers: this.extractCustomers(),
          settings: JSON.parse(localStorage.getItem('appSettings') || '{}'),
          logs: JSON.parse(localStorage.getItem('appLogs') || '[]')
        },
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          dataSize: this.calculateDataSize()
        }
      };

      // Store backup
      const backupKey = `backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(backup));
      
      // Clean old backups
      this.cleanOldBackups();
      
      window.ErrorHandler.logInfo('Backup created', { backupKey, size: backup.metadata.dataSize });
      
      return backup;
    } catch (error) {
      window.ErrorHandler.logError('Failed to create backup', { error: error.message });
      throw error;
    }
  }

  /**
   * Extract customers from orders
   */
  extractCustomers() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const customerMap = new Map();
    
    orders.forEach(order => {
      const key = (order.customerName || '').trim().toLowerCase();
      if (key && !customerMap.has(key)) {
        customerMap.set(key, {
          name: order.customerName,
          contact: order.email || order.mobile || '',
          orders: []
        });
      }
      if (customerMap.has(key)) {
        customerMap.get(key).orders.push(order);
      }
    });
    
    return Array.from(customerMap.values());
  }

  /**
   * Calculate data size
   */
  calculateDataSize() {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length;
      }
    }
    return totalSize;
  }

  /**
   * Clean old backups
   */
  cleanOldBackups() {
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('backup_'))
      .sort((a, b) => {
        const timestampA = parseInt(a.split('_')[1]);
        const timestampB = parseInt(b.split('_')[1]);
        return timestampB - timestampA;
      });

    // Keep only the most recent backups
    if (backupKeys.length > this.maxBackups) {
      const keysToDelete = backupKeys.slice(this.maxBackups);
      keysToDelete.forEach(key => {
        localStorage.removeItem(key);
      });
    }
  }

  /**
   * Get all available backups
   */
  getBackups() {
    const backups = [];
    
    for (let key in localStorage) {
      if (key.startsWith('backup_')) {
        try {
          const backup = JSON.parse(localStorage.getItem(key));
          backups.push({
            key,
            timestamp: backup.timestamp,
            version: backup.version,
            dataSize: backup.metadata.dataSize
          });
        } catch (error) {
          window.ErrorHandler.logWarning('Corrupted backup found', { key, error: error.message });
        }
      }
    }
    
    return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Restore from backup
   */
  restoreFromBackup(backupKey) {
    try {
      const backup = JSON.parse(localStorage.getItem(backupKey));
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Create current backup before restore
      this.createBackup();

      // Restore data
      localStorage.setItem('orders', JSON.stringify(backup.data.orders));
      localStorage.setItem('invoices', JSON.stringify(backup.data.invoices));
      localStorage.setItem('appSettings', JSON.stringify(backup.data.settings));
      localStorage.setItem('appLogs', JSON.stringify(backup.data.logs));

      window.ErrorHandler.logInfo('Data restored from backup', { backupKey, timestamp: backup.timestamp });
      
      // Reload page to reflect changes
      window.location.reload();
      
    } catch (error) {
      window.ErrorHandler.logError('Failed to restore backup', { backupKey, error: error.message });
      throw error;
    }
  }

  /**
   * Export backup to file
   */
  exportBackup(backupKey = null) {
    try {
      const backup = backupKey ? 
        JSON.parse(localStorage.getItem(backupKey)) : 
        this.createBackup();

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jersey-oms-backup-${backup.timestamp.split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      window.ErrorHandler.logInfo('Backup exported', { timestamp: backup.timestamp });
      
    } catch (error) {
      window.ErrorHandler.logError('Failed to export backup', { error: error.message });
      throw error;
    }
  }

  /**
   * Import backup from file
   */
  importBackup(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target.result);
          
          // Validate backup structure
          if (!backup.data || !backup.timestamp) {
            throw new Error('Invalid backup file format');
          }

          // Create current backup before import
          this.createBackup();

          // Restore data
          localStorage.setItem('orders', JSON.stringify(backup.data.orders || []));
          localStorage.setItem('invoices', JSON.stringify(backup.data.invoices || []));
          localStorage.setItem('appSettings', JSON.stringify(backup.data.settings || {}));
          localStorage.setItem('appLogs', JSON.stringify(backup.data.logs || []));

          window.ErrorHandler.logInfo('Backup imported', { timestamp: backup.timestamp });
          
          // Reload page to reflect changes
          window.location.reload();
          
          resolve(backup);
        } catch (error) {
          window.ErrorHandler.logError('Failed to import backup', { error: error.message });
          reject(error);
        }
      };
      
      reader.onerror = () => {
        const error = new Error('Failed to read backup file');
        window.ErrorHandler.logError('Failed to read backup file', { error: error.message });
        reject(error);
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Start automatic backup
   */
  startAutoBackup() {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
    }
    
    this.autoBackupTimer = setInterval(() => {
      this.createBackup();
    }, this.backupInterval);
  }

  /**
   * Stop automatic backup
   */
  stopAutoBackup() {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
      this.autoBackupTimer = null;
    }
  }

  /**
   * Clear all backups
   */
  clearAllBackups() {
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('backup_'));
    
    backupKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    window.ErrorHandler.logInfo('All backups cleared', { count: backupKeys.length });
  }

  /**
   * Get backup statistics
   */
  getBackupStats() {
    const backups = this.getBackups();
    const totalSize = backups.reduce((sum, backup) => sum + backup.dataSize, 0);
    
    return {
      count: backups.length,
      totalSize,
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
      newestBackup: backups.length > 0 ? backups[0].timestamp : null
    };
  }
}

// Global backup manager
window.BackupManager = new BackupManager();
