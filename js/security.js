/**
 * Security utilities for production-ready application
 */

class SecurityManager {
  constructor() {
    this.saltRounds = 12;
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Hash password using Web Crypto API (production-ready)
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password, hash) {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  /**
   * Sanitize input to prevent XSS attacks
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number
   */
  validatePhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      requirements: {
        minLength: password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  }

  /**
   * Rate limiting for login attempts
   */
  checkRateLimit(identifier) {
    const attempts = JSON.parse(localStorage.getItem(`loginAttempts_${identifier}`) || '[]');
    const now = Date.now();
    const recentAttempts = attempts.filter(time => now - time < this.lockoutDuration);
    
    if (recentAttempts.length >= this.maxLoginAttempts) {
      return {
        allowed: false,
        remainingTime: this.lockoutDuration - (now - recentAttempts[0])
      };
    }
    
    return { allowed: true };
  }

  /**
   * Record login attempt
   */
  recordLoginAttempt(identifier, success) {
    const attempts = JSON.parse(localStorage.getItem(`loginAttempts_${identifier}`) || '[]');
    const now = Date.now();
    
    if (success) {
      // Clear attempts on successful login
      localStorage.removeItem(`loginAttempts_${identifier}`);
    } else {
      // Add failed attempt
      attempts.push(now);
      localStorage.setItem(`loginAttempts_${identifier}`, JSON.stringify(attempts));
    }
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(data, key) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const keyBuffer = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      keyBuffer,
      dataBuffer
    );
    
    return {
      encrypted: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv)
    };
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedData, key) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const keyBuffer = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
      keyBuffer,
      new Uint8Array(encryptedData.encrypted)
    );
    
    return JSON.parse(decoder.decode(decrypted));
  }
}

// Global security manager instance
window.SecurityManager = new SecurityManager();
