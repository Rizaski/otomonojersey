/**
 * Zoho Books API Integration
 * Handles OAuth authentication and invoice generation
 */

class ZohoBooksAPI {
  constructor() {
    this.clientId = '1000.4W5C4WODM7XAQTY152UG1H4RQWY0AW';
    this.clientSecret = 'c01c3c7d126d34c8bfb44459a156ad4dfeb749d5a3';
    this.redirectUri = window.location.origin + '/zoho-callback.html';
    this.scope = 'ZohoBooks.invoices.CREATE,ZohoBooks.invoices.READ,ZohoBooks.contacts.READ';
    this.baseUrl = 'https://books.zoho.com/api/v3';
    this.authUrl = 'https://accounts.zoho.com/oauth/v2/auth';
    this.tokenUrl = 'https://accounts.zoho.com/oauth/v2/token';
    
    // Load stored tokens
    this.loadTokens();
  }

  loadTokens() {
    try {
      const tokens = localStorage.getItem('zoho_tokens');
      if (tokens) {
        const parsed = JSON.parse(tokens);
        this.accessToken = parsed.access_token;
        this.refreshToken = parsed.refresh_token;
        this.tokenExpiry = parsed.expires_at;
      }
    } catch (e) {
      console.warn('Failed to load Zoho tokens:', e);
    }
  }

  saveTokens(tokens) {
    try {
      const tokenData = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + (tokens.expires_in * 1000)
      };
      localStorage.setItem('zoho_tokens', JSON.stringify(tokenData));
      this.accessToken = tokenData.access_token;
      this.refreshToken = tokenData.refresh_token;
      this.tokenExpiry = tokenData.expires_at;
    } catch (e) {
      console.error('Failed to save Zoho tokens:', e);
    }
  }

  isTokenValid() {
    return this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry;
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const params = new URLSearchParams({
      refresh_token: this.refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token'
    });

    try {
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const tokens = await response.json();
      this.saveTokens(tokens);
      return tokens.access_token;
    } catch (e) {
      console.error('Token refresh error:', e);
      throw e;
    }
  }

  async getValidToken() {
    if (this.isTokenValid()) {
      return this.accessToken;
    }

    if (this.refreshToken) {
      return await this.refreshAccessToken();
    }

    throw new Error('No valid token available. Please re-authenticate.');
  }

  getAuthUrl() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code) {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code: code
    });

    try {
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const tokens = await response.json();
      this.saveTokens(tokens);
      return tokens;
    } catch (e) {
      console.error('Token exchange error:', e);
      throw e;
    }
  }

  async makeRequest(endpoint, options = {}) {
    const token = await this.getValidToken();
    
    const defaultOptions = {
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, finalOptions);
      
      if (response.status === 401) {
        // Token expired, try to refresh
        await this.refreshAccessToken();
        finalOptions.headers['Authorization'] = `Zoho-oauthtoken ${this.accessToken}`;
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, finalOptions);
        
        if (!retryResponse.ok) {
          throw new Error(`API request failed: ${retryResponse.status}`);
        }
        
        return await retryResponse.json();
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (e) {
      console.error('Zoho Books API request error:', e);
      throw e;
    }
  }

  async getContacts() {
    try {
      const response = await this.makeRequest('/contacts');
      return response.contacts || [];
    } catch (e) {
      console.error('Failed to fetch contacts:', e);
      return [];
    }
  }

  async findOrCreateContact(customerName, email, mobile) {
    try {
      // First, try to find existing contact
      const contacts = await this.getContacts();
      const existingContact = contacts.find(contact => 
        contact.contact_name === customerName || 
        contact.email === email ||
        contact.phone === mobile
      );

      if (existingContact) {
        return existingContact;
      }

      // Create new contact
      const contactData = {
        contact_name: customerName,
        email: email || '',
        phone: mobile || '',
        contact_type: 'customer'
      };

      const response = await this.makeRequest('/contacts', {
        method: 'POST',
        body: JSON.stringify(contactData)
      });

      return response.contact;
    } catch (e) {
      console.error('Failed to find/create contact:', e);
      throw e;
    }
  }

  async createInvoice(invoiceData) {
    try {
      const { customerName, email, mobile, total, orderId, invoiceId } = invoiceData;

      // Find or create contact
      const contact = await this.findOrCreateContact(customerName, email, mobile);

      // Prepare invoice data
      const zohoInvoice = {
        customer_id: contact.contact_id,
        invoice_number: invoiceId,
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        line_items: [
          {
            item_id: '1', // You may need to create items in Zoho Books first
            name: `Jersey Order - ${orderId}`,
            description: `Custom jersey order for ${customerName}`,
            rate: total || 0,
            quantity: 1
          }
        ],
        notes: `Order ID: ${orderId}\nGenerated from Jersey OMS`,
        terms: 'Payment due within 30 days'
      };

      const response = await this.makeRequest('/invoices', {
        method: 'POST',
        body: JSON.stringify(zohoInvoice)
      });

      return response.invoice;
    } catch (e) {
      console.error('Failed to create Zoho invoice:', e);
      throw e;
    }
  }

  async getInvoiceStatus(zohoInvoiceId) {
    try {
      const response = await this.makeRequest(`/invoices/${zohoInvoiceId}`);
      return response.invoice;
    } catch (e) {
      console.error('Failed to get invoice status:', e);
      throw e;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.isTokenValid() || !!this.refreshToken;
  }

  // Logout and clear tokens
  logout() {
    localStorage.removeItem('zoho_tokens');
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }
}

// Global instance
window.zohoBooks = new ZohoBooksAPI();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ZohoBooksAPI;
}
