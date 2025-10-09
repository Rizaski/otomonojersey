# Jersey OMS - Production Deployment Guide

This guide covers the complete deployment process for the Jersey OMS application in a production environment.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm 8+
- Docker (optional)
- SSL certificates
- Domain name

### 1. Environment Setup

```bash
# Clone repository
git clone https://github.com/your-org/jersey-oms.git
cd jersey-oms

# Install dependencies
npm install

# Set environment variables
export NODE_ENV=production
export API_BASE_URL=https://api.yourdomain.com
export PORT=8080
```

### 2. Security Configuration

```bash
# Generate secure JWT secret
openssl rand -base64 32

# Set security environment variables
export JWT_SECRET=your-generated-secret
export PASSWORD_SALT_ROUNDS=12
export MAX_LOGIN_ATTEMPTS=5
export LOCKOUT_DURATION=900000
```

### 3. Build and Deploy

```bash
# Run tests
npm test

# Build for production
npm run build

# Deploy with Docker
docker build -t jersey-oms:latest .
docker run -d -p 8080:8080 --name jersey-oms-prod jersey-oms:latest

# Or deploy with deployment script
chmod +x deploy.sh
./deploy.sh
```

## 🔧 Configuration Options

### Application Settings
```javascript
// js/config.js
app: {
  name: 'Jersey OMS',
  version: '1.0.0',
  environment: 'production',
  debug: false
}
```

### Security Settings
```javascript
security: {
  passwordMinLength: 8,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000,
  enableRateLimiting: true,
  enableXSSProtection: true,
  enableCSRFProtection: true
}
```

### Performance Settings
```javascript
performance: {
  enableCaching: true,
  cacheTTL: 5 * 60 * 1000,
  enableLazyLoading: true,
  enableImageOptimization: true,
  maxCacheSize: 50 * 1024 * 1024
}
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  jersey-oms:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - API_BASE_URL=https://api.yourdomain.com
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 🔒 Security Checklist

### Pre-Deployment Security
- [ ] SSL certificates installed
- [ ] HTTPS redirect configured
- [ ] Security headers set
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Password hashing configured
- [ ] Session management secure
- [ ] Error handling secure

### Security Headers
```nginx
# nginx.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self';" always;
```

## 📊 Monitoring Setup

### Health Checks
```bash
# Application health
curl -f http://localhost:8080/health

# Database health (if applicable)
curl -f http://localhost:8080/health/db

# Cache health
curl -f http://localhost:8080/health/cache
```

### Logging Configuration
```javascript
// Enable production logging
window.ErrorHandler.currentLogLevel = window.ErrorHandler.logLevels.INFO;

// Export logs for analysis
window.ErrorHandler.exportLogs();
```

### Performance Monitoring
```javascript
// Monitor Core Web Vitals
window.PerformanceManager.monitorPerformance();

// Check cache performance
const cacheStats = window.PerformanceManager.getCacheStats();
console.log('Cache performance:', cacheStats);
```

## 🔄 Backup Strategy

### Automatic Backups
```javascript
// Configure backup settings
window.BackupManager.backupInterval = 5 * 60 * 1000; // 5 minutes
window.BackupManager.maxBackups = 10;
window.BackupManager.startAutoBackup();
```

### Manual Backup
```bash
# Create backup
npm run backup

# Export data
curl -X POST http://localhost:8080/api/backup/export

# Import data
curl -X POST http://localhost:8080/api/backup/import -F file=@backup.json
```

## 🚀 CI/CD Pipeline

### GitHub Actions
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build application
        run: npm run build
      - name: Deploy to production
        run: ./deploy.sh
```

## 🔧 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
docker logs jersey-oms-prod

# Check port availability
netstat -tulpn | grep :8080

# Check environment variables
docker exec jersey-oms-prod env
```

#### Performance Issues
```bash
# Check resource usage
docker stats jersey-oms-prod

# Check cache performance
curl http://localhost:8080/api/cache/stats

# Monitor network requests
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8080/
```

#### Security Issues
```bash
# Check security headers
curl -I http://localhost:8080/

# Run security audit
npm audit

# Check SSL configuration
openssl s_client -connect yourdomain.com:443
```

### Debug Mode
```javascript
// Enable debug mode
localStorage.setItem('debug', 'true');

// View application logs
console.log(window.ErrorHandler.getLogs());

// Check service worker status
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

## 📈 Performance Optimization

### Frontend Optimizations
- Enable gzip compression
- Use CDN for static assets
- Implement lazy loading
- Optimize images
- Minify CSS/JS

### Backend Optimizations
- Database query optimization
- Caching strategies
- Load balancing
- Connection pooling

### Monitoring Metrics
- Page load times
- API response times
- Error rates
- User engagement
- Conversion rates

## 🔄 Maintenance

### Regular Tasks
- [ ] Security updates
- [ ] Performance monitoring
- [ ] Backup verification
- [ ] Log rotation
- [ ] Cache cleanup
- [ ] SSL certificate renewal

### Update Process
```bash
# Pull latest changes
git pull origin main

# Run tests
npm test

# Build and deploy
npm run build
./deploy.sh restart
```

## 📞 Support

### Documentation
- [User Guide](docs/user-guide.md)
- [API Reference](docs/api-reference.md)
- [Security Guide](docs/security.md)
- [Troubleshooting Guide](docs/troubleshooting.md)

### Contact
- Email: support@jerseyoms.com
- Issues: GitHub Issues
- Documentation: Wiki

---

**⚠️ Important**: Always test deployments in a staging environment before deploying to production.
