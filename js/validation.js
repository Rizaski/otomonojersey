/**
 * Comprehensive data validation and sanitization
 */

class DataValidator {
  constructor() {
    this.rules = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^[\+]?[1-9][\d]{0,15}$/,
      alphanumeric: /^[a-zA-Z0-9]+$/,
      name: /^[a-zA-Z\s\-'\.]+$/,
      orderId: /^[a-zA-Z0-9_\-]+$/,
      invoiceId: /^INV-\d{4}-\d{3}$/
    };
  }

  /**
   * Validate and sanitize input
   */
  validateInput(value, type, options = {}) {
    const result = {
      isValid: true,
      value: value,
      errors: []
    };

    // Trim whitespace
    if (typeof value === 'string') {
      result.value = value.trim();
    }

    // Check required
    if (options.required && (!result.value || result.value === '')) {
      result.isValid = false;
      result.errors.push(`${type} is required`);
      return result;
    }

    // Skip validation if empty and not required
    if (!result.value && !options.required) {
      return result;
    }

    // Type-specific validation
    switch (type) {
      case 'email':
        if (!this.rules.email.test(result.value)) {
          result.isValid = false;
          result.errors.push('Invalid email format');
        }
        break;

      case 'phone':
        const cleanPhone = result.value.replace(/[\s\-\(\)]/g, '');
        if (!this.rules.phone.test(cleanPhone)) {
          result.isValid = false;
          result.errors.push('Invalid phone number format');
        }
        result.value = cleanPhone;
        break;

      case 'name':
        if (!this.rules.name.test(result.value)) {
          result.isValid = false;
          result.errors.push('Name contains invalid characters');
        }
        break;

      case 'orderId':
        if (!this.rules.orderId.test(result.value)) {
          result.isValid = false;
          result.errors.push('Invalid order ID format');
        }
        break;

      case 'invoiceId':
        if (!this.rules.invoiceId.test(result.value)) {
          result.isValid = false;
          result.errors.push('Invalid invoice ID format');
        }
        break;

      case 'number':
        const numValue = Number(result.value);
        if (isNaN(numValue)) {
          result.isValid = false;
          result.errors.push('Must be a valid number');
        } else {
          result.value = numValue;
          if (options.min !== undefined && numValue < options.min) {
            result.isValid = false;
            result.errors.push(`Must be at least ${options.min}`);
          }
          if (options.max !== undefined && numValue > options.max) {
            result.isValid = false;
            result.errors.push(`Must be at most ${options.max}`);
          }
        }
        break;

      case 'string':
        if (options.minLength && result.value.length < options.minLength) {
          result.isValid = false;
          result.errors.push(`Must be at least ${options.minLength} characters`);
        }
        if (options.maxLength && result.value.length > options.maxLength) {
          result.isValid = false;
          result.errors.push(`Must be at most ${options.maxLength} characters`);
        }
        break;
    }

    return result;
  }

  /**
   * Validate order data
   */
  validateOrder(orderData) {
    const errors = [];
    const validatedData = {};

    // Customer name
    const nameResult = this.validateInput(orderData.customerName, 'name', { required: true, minLength: 2, maxLength: 100 });
    if (!nameResult.isValid) {
      errors.push(...nameResult.errors.map(e => `Customer Name: ${e}`));
    } else {
      validatedData.customerName = nameResult.value;
    }

    // Email
    if (orderData.email) {
      const emailResult = this.validateInput(orderData.email, 'email', { maxLength: 255 });
      if (!emailResult.isValid) {
        errors.push(...emailResult.errors.map(e => `Email: ${e}`));
      } else {
        validatedData.email = emailResult.value;
      }
    }

    // Mobile
    if (orderData.mobile) {
      const phoneResult = this.validateInput(orderData.mobile, 'phone');
      if (!phoneResult.isValid) {
        errors.push(...phoneResult.errors.map(e => `Mobile: ${e}`));
      } else {
        validatedData.mobile = phoneResult.value;
      }
    }

    // Quantity
    const qtyResult = this.validateInput(orderData.quantity, 'number', { required: true, min: 1, max: 1000 });
    if (!qtyResult.isValid) {
      errors.push(...qtyResult.errors.map(e => `Quantity: ${e}`));
    } else {
      validatedData.quantity = qtyResult.value;
    }

    // Jersey details
    if (orderData.jtype) {
      const jtypeResult = this.validateInput(orderData.jtype, 'string', { required: true, maxLength: 50 });
      if (!jtypeResult.isValid) {
        errors.push(...jtypeResult.errors.map(e => `Jersey Type: ${e}`));
      } else {
        validatedData.jtype = jtypeResult.value;
      }
    }

    if (orderData.jname) {
      const jnameResult = this.validateInput(orderData.jname, 'string', { required: true, maxLength: 100 });
      if (!jnameResult.isValid) {
        errors.push(...jnameResult.errors.map(e => `Jersey Name: ${e}`));
      } else {
        validatedData.jname = jnameResult.value;
      }
    }

    if (orderData.jnum) {
      const jnumResult = this.validateInput(orderData.jnum, 'number', { required: true, min: 0, max: 999 });
      if (!jnumResult.isValid) {
        errors.push(...jnumResult.errors.map(e => `Jersey Number: ${e}`));
      } else {
        validatedData.jnum = jnumResult.value;
      }
    }

    return {
      isValid: errors.length === 0,
      data: validatedData,
      errors
    };
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Validate password
   */
  validatePassword(password) {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate file upload
   */
  validateFile(file, options = {}) {
    const errors = [];
    const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default
    const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif'];

    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Global validator instance
window.DataValidator = new DataValidator();
