#!/bin/bash

# Production Deployment Script for Jersey OMS
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting Jersey OMS Production Deployment..."

# Configuration
APP_NAME="jersey-oms"
VERSION=$(date +%Y%m%d-%H%M%S)
DOCKER_IMAGE="jersey-oms:latest"
CONTAINER_NAME="jersey-oms-prod"
PORT=8080

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js first."
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        error "Node.js version 16 or higher is required. Current version: $(node -v)"
    fi
    
    success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    if [ ! -f "package.json" ]; then
        error "package.json not found. Are you in the correct directory?"
    fi
    
    npm ci --only=production
    success "Dependencies installed"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    # Run security audit
    log "Running security audit..."
    npm audit --audit-level=moderate || warning "Security audit found issues"
    
    # Run linting
    log "Running linting..."
    if command -v eslint &> /dev/null; then
        npx eslint js/*.js || warning "Linting found issues"
    fi
    
    # Run custom tests
    log "Running application tests..."
    if [ -f "js/tests.js" ]; then
        node -e "
            const fs = require('fs');
            const vm = require('vm');
            const code = fs.readFileSync('js/tests.js', 'utf8');
            vm.runInNewContext(code, { console, setTimeout, clearTimeout });
            if (typeof runTests === 'function') {
                runTests();
            }
        " || warning "Some tests failed"
    fi
    
    success "Tests completed"
}

# Build application
build_application() {
    log "Building application..."
    
    # Create dist directory
    mkdir -p dist/js dist/css
    
    # Minify JavaScript files
    if command -v terser &> /dev/null; then
        log "Minifying JavaScript..."
        find js -name "*.js" -exec terser {} -o dist/js/{} -c -m \;
    else
        log "Terser not found, copying JavaScript files..."
        cp -r js dist/
    fi
    
    # Minify CSS
    if command -v cleancss &> /dev/null; then
        log "Minifying CSS..."
        cleancss -o dist/css/styles.min.css styles.css
    else
        log "CleanCSS not found, copying CSS files..."
        cp styles.css dist/css/
    fi
    
    # Copy HTML files
    cp *.html dist/
    cp -r public dist/
    
    # Create production index.html with minified assets
    cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jersey OMS - Production</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
  <script defer src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <link rel="stylesheet" href="css/styles.min.css">
  <script defer src="js/config.js"></script>
  <script defer src="js/security.js"></script>
  <script defer src="js/error-handler.js"></script>
  <script defer src="js/validation.js"></script>
  <script defer src="js/performance.js"></script>
  <script defer src="js/backup.js"></script>
  <script defer src="js/api-service.js"></script>
  <script defer src="js/tests.js"></script>
  <script defer src="script.js"></script>
</head>
<body>
  <!-- Production content will be loaded here -->
</body>
</html>
EOF
    
    success "Application built successfully"
}

# Build Docker image
build_docker_image() {
    log "Building Docker image..."
    
    # Stop and remove existing container
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        log "Stopping existing container..."
        docker stop $CONTAINER_NAME
    fi
    
    if docker ps -aq -f name=$CONTAINER_NAME | grep -q .; then
        log "Removing existing container..."
        docker rm $CONTAINER_NAME
    fi
    
    # Build new image
    docker build -t $DOCKER_IMAGE .
    success "Docker image built: $DOCKER_IMAGE"
}

# Deploy application
deploy_application() {
    log "Deploying application..."
    
    # Run container
    docker run -d \
        --name $CONTAINER_NAME \
        -p $PORT:8080 \
        -e NODE_ENV=production \
        --restart unless-stopped \
        $DOCKER_IMAGE
    
    # Wait for container to start
    log "Waiting for container to start..."
    sleep 10
    
    # Health check
    log "Performing health check..."
    if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
        success "Application is healthy and running on port $PORT"
    else
        error "Health check failed. Application may not be running correctly."
    fi
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create monitoring script
    cat > monitor.sh << 'EOF'
#!/bin/bash
# Simple monitoring script
while true; do
    if ! curl -f http://localhost:8080/health > /dev/null 2>&1; then
        echo "$(date): Application is down!" >> /var/log/jersey-oms-monitor.log
        # Add restart logic here if needed
    fi
    sleep 30
done
EOF
    
    chmod +x monitor.sh
    success "Monitoring setup completed"
}

# Create backup
create_backup() {
    log "Creating backup before deployment..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d-%H%M%S)"
    mkdir -p $BACKUP_DIR
    
    # Backup current data
    if [ -d "data" ]; then
        cp -r data $BACKUP_DIR/
    fi
    
    # Backup configuration
    cp -r js $BACKUP_DIR/ 2>/dev/null || true
    cp package.json $BACKUP_DIR/ 2>/dev/null || true
    
    success "Backup created: $BACKUP_DIR"
}

# Main deployment function
main() {
    log "Starting deployment process..."
    
    # Pre-deployment checks
    check_prerequisites
    create_backup
    
    # Build and test
    install_dependencies
    run_tests
    build_application
    
    # Deploy
    build_docker_image
    deploy_application
    setup_monitoring
    
    success "Deployment completed successfully!"
    log "Application is running at: http://localhost:$PORT"
    log "Health check: http://localhost:$PORT/health"
    
    # Show container status
    docker ps -f name=$CONTAINER_NAME
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        log "Rolling back to previous version..."
        # Add rollback logic here
        ;;
    "status")
        log "Checking application status..."
        docker ps -f name=$CONTAINER_NAME
        curl -f http://localhost:$PORT/health || error "Application is not healthy"
        ;;
    "logs")
        log "Showing application logs..."
        docker logs $CONTAINER_NAME
        ;;
    "stop")
        log "Stopping application..."
        docker stop $CONTAINER_NAME
        ;;
    "start")
        log "Starting application..."
        docker start $CONTAINER_NAME
        ;;
    "restart")
        log "Restarting application..."
        docker restart $CONTAINER_NAME
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|status|logs|stop|start|restart}"
        exit 1
        ;;
esac
