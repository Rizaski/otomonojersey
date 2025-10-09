/**
 * Production-ready testing framework
 */

class TestRunner {
  constructor() {
    this.tests = [];
    this.results = [];
    this.isRunning = false;
  }

  /**
   * Add test to suite
   */
  test(name, testFunction) {
    this.tests.push({ name, testFunction });
  }

  /**
   * Run all tests
   */
  async runAll() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.results = [];
    
    console.log('🧪 Starting test suite...');
    
    for (const test of this.tests) {
      try {
        await test.testFunction();
        this.results.push({ name: test.name, status: 'PASS', error: null });
        console.log(`✅ ${test.name}`);
      } catch (error) {
        this.results.push({ name: test.name, status: 'FAIL', error: error.message });
        console.error(`❌ ${test.name}: ${error.message}`);
      }
    }
    
    this.isRunning = false;
    this.printSummary();
  }

  /**
   * Print test summary
   */
  printSummary() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    
    console.log(`\n📊 Test Summary:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${this.results.length}`);
    console.log(`🎯 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
  }

  /**
   * Assert helper
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  /**
   * Assert equality
   */
  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  /**
   * Assert not null
   */
  assertNotNull(value, message) {
    if (value === null || value === undefined) {
      throw new Error(message || 'Value is null or undefined');
    }
  }
}

// Global test runner
window.TestRunner = new TestRunner();

/**
 * Security tests
 */
window.TestRunner.test('Security: Password hashing', async () => {
  const password = 'testPassword123!';
  const hash1 = await window.SecurityManager.hashPassword(password);
  const hash2 = await window.SecurityManager.hashPassword(password);
  
  window.TestRunner.assertNotNull(hash1, 'Hash should not be null');
  window.TestRunner.assertEqual(hash1, hash2, 'Same password should produce same hash');
  
  const differentPassword = 'differentPassword123!';
  const differentHash = await window.SecurityManager.hashPassword(differentPassword);
  window.TestRunner.assert(hash1 !== differentHash, 'Different passwords should produce different hashes');
});

window.TestRunner.test('Security: Password verification', async () => {
  const password = 'testPassword123!';
  const hash = await window.SecurityManager.hashPassword(password);
  
  const isValid = await window.SecurityManager.verifyPassword(password, hash);
  window.TestRunner.assert(isValid, 'Correct password should verify');
  
  const isInvalid = await window.SecurityManager.verifyPassword('wrongPassword', hash);
  window.TestRunner.assert(!isInvalid, 'Wrong password should not verify');
});

window.TestRunner.test('Security: Input sanitization', () => {
  const maliciousInput = '<script>alert("xss")</script>';
  const sanitized = window.SecurityManager.sanitizeInput(maliciousInput);
  
  window.TestRunner.assert(!sanitized.includes('<script>'), 'Script tags should be removed');
  window.TestRunner.assert(sanitized.includes('alert("xss")'), 'Content should be preserved');
});

window.TestRunner.test('Security: Rate limiting', () => {
  const identifier = 'test_user';
  
  // Clear any existing attempts
  localStorage.removeItem(`loginAttempts_${identifier}`);
  
  // First few attempts should be allowed
  for (let i = 0; i < 3; i++) {
    const result = window.SecurityManager.checkRateLimit(identifier);
    window.TestRunner.assert(result.allowed, 'Initial attempts should be allowed');
    window.SecurityManager.recordLoginAttempt(identifier, false);
  }
});

/**
 * Validation tests
 */
window.TestRunner.test('Validation: Email validation', () => {
  const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'user+tag@example.org'];
  const invalidEmails = ['invalid-email', '@example.com', 'test@', 'test.example.com'];
  
  validEmails.forEach(email => {
    window.TestRunner.assert(window.DataValidator.validateInput(email, 'email').isValid, `Valid email should pass: ${email}`);
  });
  
  invalidEmails.forEach(email => {
    window.TestRunner.assert(!window.DataValidator.validateInput(email, 'email').isValid, `Invalid email should fail: ${email}`);
  });
});

window.TestRunner.test('Validation: Phone validation', () => {
  const validPhones = ['1234567890', '+1234567890', '123-456-7890'];
  const invalidPhones = ['abc123', '123', '123-abc-7890'];
  
  validPhones.forEach(phone => {
    window.TestRunner.assert(window.DataValidator.validateInput(phone, 'phone').isValid, `Valid phone should pass: ${phone}`);
  });
  
  invalidPhones.forEach(phone => {
    window.TestRunner.assert(!window.DataValidator.validateInput(phone, 'phone').isValid, `Invalid phone should fail: ${phone}`);
  });
});

window.TestRunner.test('Validation: Password strength', () => {
  const weakPasswords = ['123', 'password', 'Password', 'Password1'];
  const strongPasswords = ['Password123!', 'MyStr0ng#Pass', 'ComplexP@ssw0rd'];
  
  weakPasswords.forEach(password => {
    const validation = window.DataValidator.validatePassword(password);
    window.TestRunner.assert(!validation.isValid, `Weak password should fail: ${password}`);
  });
  
  strongPasswords.forEach(password => {
    const validation = window.DataValidator.validatePassword(password);
    window.TestRunner.assert(validation.isValid, `Strong password should pass: ${password}`);
  });
});

/**
 * Performance tests
 */
window.TestRunner.test('Performance: Debounce function', (done) => {
  let callCount = 0;
  const debouncedFunction = window.PerformanceManager.debounce(() => {
    callCount++;
  }, 100, 'test_debounce');
  
  // Call function multiple times quickly
  debouncedFunction();
  debouncedFunction();
  debouncedFunction();
  
  // Should only be called once after delay
  setTimeout(() => {
    window.TestRunner.assertEqual(callCount, 1, 'Debounced function should only be called once');
    done();
  }, 150);
});

window.TestRunner.test('Performance: Cache functionality', () => {
  const key = 'test_cache_key';
  const value = { test: 'data' };
  
  // Test cache set and get
  window.PerformanceManager.cacheWithTTL(key, value, 1000);
  const cachedValue = window.PerformanceManager.getFromCache(key);
  
  window.TestRunner.assertNotNull(cachedValue, 'Cached value should not be null');
  window.TestRunner.assertEqual(cachedValue.test, value.test, 'Cached value should match original');
});

/**
 * Error handling tests
 */
window.TestRunner.test('Error Handling: Error logging', () => {
  const originalConsoleError = console.error;
  let errorLogged = false;
  
  // Mock console.error
  console.error = () => { errorLogged = true; };
  
  try {
    window.ErrorHandler.logError('Test error', { context: 'test' });
    window.TestRunner.assert(errorLogged, 'Error should be logged');
  } finally {
    console.error = originalConsoleError;
  }
});

/**
 * Backup tests
 */
window.TestRunner.test('Backup: Create backup', () => {
  // Set up test data
  localStorage.setItem('orders', JSON.stringify([{ id: 'test_order', customerName: 'Test Customer' }]));
  
  const backup = window.BackupManager.createBackup();
  
  window.TestRunner.assertNotNull(backup, 'Backup should be created');
  window.TestRunner.assertNotNull(backup.data, 'Backup should contain data');
  window.TestRunner.assertNotNull(backup.timestamp, 'Backup should have timestamp');
});

window.TestRunner.test('Backup: Get backups', () => {
  const backups = window.BackupManager.getBackups();
  
  window.TestRunner.assert(Array.isArray(backups), 'Backups should be an array');
});

/**
 * Utility function to run tests
 */
window.runTests = () => {
  window.TestRunner.runAll();
};

// Auto-run tests in development
if (window.AppConfig && window.AppConfig.app.debug) {
  console.log('🔧 Development mode detected. Tests available via runTests()');
}
