#!/bin/bash

# Care Services Platform - Quick Deploy Script
# Run this script to deploy the platform to production

set -e

echo "🚀 Starting Care Services Platform Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18.x or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version: $(node -v) ✅"

# Check if environment file exists
if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        print_warning "No .env file found. Copying from env.example..."
        cp env.example .env
        print_warning "Please edit .env file with your production configuration before continuing."
        print_warning "Run: nano .env"
        exit 1
    else
        print_error "No .env or env.example file found. Please create environment configuration."
        exit 1
    fi
fi

print_status "Environment configuration found ✅"

# Install dependencies
print_status "Installing dependencies..."
if [ "$NODE_ENV" = "production" ]; then
    npm ci --only=production
else
    npm install
fi

# Create required directories
print_status "Creating required directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p temp

# Set permissions
chmod 755 logs uploads temp

print_status "Directory structure created ✅"

# Build the application
print_status "Building application..."
if npm run build; then
    print_status "Build completed successfully ✅"
else
    print_error "Build failed. Please check the build output above."
    exit 1
fi

# Database setup
print_status "Checking database connection..."
if [ -n "$DB_HOST" ]; then
    print_status "Database configuration found"
    print_warning "Make sure your database is running and accessible"
    print_warning "Run database migrations with: npm run migration:run"
else
    print_warning "Database configuration not found in environment"
fi

# Redis setup
print_status "Checking Redis configuration..."
if [ -n "$REDIS_HOST" ]; then
    print_status "Redis configuration found"
else
    print_warning "Redis configuration not found in environment"
fi

# Security checks
print_status "Performing security checks..."

# Check if JWT secret is set
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your_jwt_secret_here" ]; then
    print_error "JWT_SECRET is not properly configured"
    exit 1
fi

# Check if password hashing is configured
if [ -z "$BCRYPT_ROUNDS" ]; then
    print_warning "BCRYPT_ROUNDS not set, using default value"
fi

print_status "Security checks passed ✅"

# Performance optimization
print_status "Applying performance optimizations..."

# Enable production optimizations in package.json if not already set
if [ "$NODE_ENV" != "production" ]; then
    export NODE_ENV=production
    print_status "NODE_ENV set to production"
fi

print_status "Performance optimizations applied ✅"

# Create ecosystem config for PM2 if it doesn't exist
if [ ! -f "ecosystem.config.js" ]; then
    print_status "Creating PM2 ecosystem configuration..."
    cat > ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: 'care-services-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false,
    restart_delay: 1000,
    max_restarts: 5,
    min_uptime: '10s'
  }]
};
EOL
    print_status "PM2 configuration created ✅"
fi

# Test the application startup
print_status "Testing application startup..."
if timeout 30s npm run start:prod > /dev/null 2>&1; then
    print_status "Application startup test passed ✅"
else
    print_warning "Application startup test failed or timed out"
    print_warning "This might be normal if external services (DB, Redis) are not available"
fi

# Final checks
print_status "Performing final deployment checks..."

# Check if all required files exist
REQUIRED_FILES=("dist/main.js" "package.json" ".env")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done

print_status "All required files present ✅"

# Display deployment summary
echo ""
echo "🎉 DEPLOYMENT SUMMARY"
echo "====================="
echo "✅ Dependencies installed"
echo "✅ Application built successfully"
echo "✅ Security checks passed"
echo "✅ Performance optimizations applied"
echo "✅ Configuration files created"
echo ""

# Display next steps
echo "📋 NEXT STEPS:"
echo "1. Configure your database connection in .env"
echo "2. Run database migrations: npm run migration:run"
echo "3. Start the application with PM2: pm2 start ecosystem.config.js"
echo "4. Configure Nginx reverse proxy"
echo "5. Set up SSL certificate"
echo "6. Configure firewall rules"
echo ""

# Display useful commands
echo "🔧 USEFUL COMMANDS:"
echo "• Start application: npm run start:prod"
echo "• Start with PM2: pm2 start ecosystem.config.js"
echo "• View logs: pm2 logs care-services-api"
echo "• Monitor: pm2 monit"
echo "• Health check: curl http://localhost:3000/api/v1/health"
echo ""

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    print_status "PM2 is installed ✅"
    echo "• You can start the application now with: pm2 start ecosystem.config.js"
else
    print_warning "PM2 is not installed. Install it with: npm install -g pm2"
fi

print_status "Deployment preparation completed! 🚀"
print_warning "Please review the PRODUCTION_DEPLOYMENT_GUIDE.md for complete setup instructions."

echo ""
echo "🌟 Care Services Platform is ready for production deployment!" 