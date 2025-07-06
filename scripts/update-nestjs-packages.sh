#!/bin/bash

echo "🔧 Updating NestJS packages to v11 compatible versions"
echo "====================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo ""
echo "Current package versions:"
echo "------------------------"
npm list @nestjs/common @nestjs/core @nestjs/bullmq @nestjs/schedule @nestjs/throttler @nestjs/cache-manager 2>/dev/null || true

echo ""
echo "Removing old Bull packages..."
npm uninstall @nestjs/bull bull 2>/dev/null || print_warning "Bull packages might already be removed"

echo ""
echo "Installing BullMQ packages..."
npm install @nestjs/bullmq@^11.0.2 bullmq@^5.0.0

echo ""
echo "Updating other NestJS packages for v11 compatibility..."
npm install @nestjs/schedule@^6.0.0 @nestjs/throttler@^6.4.0

echo ""
echo "Running npm install to resolve dependencies..."
npm install

echo ""
echo "Checking for peer dependency warnings..."
npm ls 2>&1 | grep -i "peer" | grep -i "@nestjs" || print_status "No NestJS peer dependency issues found"

echo ""
echo "✅ Update complete! Next steps:"
echo "1. Review the BULL_TO_BULLMQ_MIGRATION.md file"
echo "2. Update any Bull-related code to use BullMQ"
echo "3. Run 'npm run build' to check for TypeScript errors"
echo "4. Run 'npm test' to ensure all tests pass"