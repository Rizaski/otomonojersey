/**
 * Production-ready API service
 */

class ApiService {
  constructor() {
    this.baseURL = window.location.origin + '/api';
    this.timeout = 30000; // 30 seconds
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
    this.cache = new Map();
    this.requestQueue = [];
    this.isOnline = navigator.onLine;
    this.init();
  }

  init() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Setup request interceptors
    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors
   */
  setupInterceptors() {
    // Add authentication token to requests
    this.addRequestInterceptor((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle response errors
    this.addResponseInterceptor(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Make HTTP request with retry logic
   */
  async request(config) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      // Add to queue if offline
      if (!this.isOnline && config.method !== 'GET') {
        return this.addToQueue(config);
      }

      const response = await this.executeRequest(config, requestId);
      
      // Log performance
      const duration = Date.now() - startTime;
      window.ErrorHandler.logInfo('API Request', {
        method: config.method,
        url: config.url,
        duration,
        status: response.status
      });

      return response;
    } catch (error) {
      window.ErrorHandler.logError('API Request Failed', {
        method: config.method,
        url: config.url,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute request with retry logic
   */
  async executeRequest(config, requestId) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(this.baseURL + config.url, {
          method: config.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...config.headers
          },
          body: config.data ? JSON.stringify(config.data) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { data, status: response.status, headers: response.headers };
      } catch (error) {
        lastError = error;
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw lastError;
  }

  /**
   * Add request to offline queue
   */
  addToQueue(config) {
    const queuedRequest = {
      id: this.generateRequestId(),
      config,
      timestamp: Date.now()
    };
    
    this.requestQueue.push(queuedRequest);
    localStorage.setItem('requestQueue', JSON.stringify(this.requestQueue));
    
    return Promise.resolve({
      data: { message: 'Request queued for when online' },
      status: 202,
      queued: true
    });
  }

  /**
   * Process queued requests when online
   */
  async processQueue() {
    const queuedRequests = JSON.parse(localStorage.getItem('requestQueue') || '[]');
    
    for (const queuedRequest of queuedRequests) {
      try {
        await this.executeRequest(queuedRequest.config, queuedRequest.id);
        this.removeFromQueue(queuedRequest.id);
      } catch (error) {
        window.ErrorHandler.logError('Failed to process queued request', {
          requestId: queuedRequest.id,
          error: error.message
        });
      }
    }
  }

  /**
   * Remove request from queue
   */
  removeFromQueue(requestId) {
    this.requestQueue = this.requestQueue.filter(req => req.id !== requestId);
    localStorage.setItem('requestQueue', JSON.stringify(this.requestQueue));
  }

  /**
   * CRUD operations for orders
   */
  async getOrders() {
    const response = await this.request({ url: '/orders', method: 'GET' });
    return response.data;
  }

  async createOrder(orderData) {
    // Validate data
    const validation = window.DataValidator.validateOrder(orderData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const response = await this.request({
      url: '/orders',
      method: 'POST',
      data: validation.data
    });
    return response.data;
  }

  async updateOrder(orderId, orderData) {
    const validation = window.DataValidator.validateOrder(orderData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const response = await this.request({
      url: `/orders/${orderId}`,
      method: 'PUT',
      data: validation.data
    });
    return response.data;
  }

  async deleteOrder(orderId) {
    const response = await this.request({
      url: `/orders/${orderId}`,
      method: 'DELETE'
    });
    return response.data;
  }

  /**
   * CRUD operations for invoices
   */
  async getInvoices() {
    const response = await this.request({ url: '/invoices', method: 'GET' });
    return response.data;
  }

  async createInvoice(invoiceData) {
    const response = await this.request({
      url: '/invoices',
      method: 'POST',
      data: invoiceData
    });
    return response.data;
  }

  async updateInvoice(invoiceId, invoiceData) {
    const response = await this.request({
      url: `/invoices/${invoiceId}`,
      method: 'PUT',
      data: invoiceData
    });
    return response.data;
  }

  /**
   * Authentication
   */
  async login(credentials) {
    const response = await this.request({
      url: '/auth/login',
      method: 'POST',
      data: credentials
    });
    
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    
    return response.data;
  }

  async logout() {
    try {
      await this.request({
        url: '/auth/logout',
        method: 'POST'
      });
    } finally {
      localStorage.removeItem('authToken');
    }
  }

  async changePassword(passwordData) {
    const response = await this.request({
      url: '/auth/change-password',
      method: 'POST',
      data: passwordData
    });
    return response.data;
  }

  /**
   * File upload
   */
  async uploadFile(file, endpoint = '/upload') {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(this.baseURL + endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Utility methods
   */
  generateRequestId() {
    return 'req_' + Math.random().toString(36).substr(2, 9);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  handleUnauthorized() {
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
  }

  addRequestInterceptor(interceptor) {
    this.requestInterceptors = this.requestInterceptors || [];
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(successInterceptor, errorInterceptor) {
    this.responseInterceptors = this.responseInterceptors || [];
    this.responseInterceptors.push({ success: successInterceptor, error: errorInterceptor });
  }
}

// Global API service
window.ApiService = new ApiService();
