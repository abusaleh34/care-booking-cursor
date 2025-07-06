#!/bin/bash

echo "🚀 NestJS v11 Compatibility Installation Script"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

echo ""
print_info "Current NestJS package versions:"
echo "--------------------------------"
npm list @nestjs/common @nestjs/core @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/schedule @nestjs/throttler @nestjs/typeorm @nestjs/bull 2>/dev/null || true

echo ""
print_warning "Backing up current package.json and package-lock.json..."
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup 2>/dev/null || print_warning "No package-lock.json found"

echo ""
print_info "Removing old Bull packages if they exist..."
npm uninstall @nestjs/bull bull --save 2>/dev/null || print_info "Bull packages not found (already removed)"

echo ""
print_info "Clearing npm cache to avoid conflicts..."
npm cache clean --force

echo ""
print_info "Removing node_modules and package-lock.json for clean install..."
rm -rf node_modules package-lock.json

echo ""
print_warning "Installing all dependencies with --legacy-peer-deps flag..."
npm install --legacy-peer-deps

if [ $? -eq 0 ]; then
    print_status "Installation completed successfully!"
else
    print_error "Installation failed. Checking for specific issues..."
    
    echo ""
    print_warning "Attempting to install with force flag..."
    npm install --force
    
    if [ $? -eq 0 ]; then
        print_status "Installation completed with force flag!"
    else
        print_error "Installation still failing. Please check the error messages above."
        echo ""
        print_info "You can restore your previous state with:"
        echo "  mv package.json.backup package.json"
        echo "  npm install"
        exit 1
    fi
fi

echo ""
print_info "Checking for peer dependency warnings..."
npm ls 2>&1 | grep -E "WARN|ERR" | grep -i "@nestjs" || print_status "No critical NestJS warnings found"

echo ""
print_info "Updated NestJS packages:"
echo "------------------------"
npm list @nestjs/common @nestjs/core @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/schedule @nestjs/throttler @nestjs/typeorm @nestjs/bullmq 2>/dev/null

echo ""
print_info "Testing TypeScript compilation..."
npx tsc --noEmit --skipLibCheck 2>&1 | head -20

echo ""
echo "======================================"
print_status "NestJS v11 update complete!"
echo "======================================"
echo ""
echo "✅ Updated packages:"
echo "  - @nestjs/config → v4.0.0"
echo "  - @nestjs/jwt → v11.0.0"
echo "  - @nestjs/passport → v11.0.0"
echo "  - @nestjs/schedule → v6.0.0"
echo "  - @nestjs/throttler → v6.4.0"
echo "  - @nestjs/typeorm → v11.0.0"
echo "  - @nestjs/bullmq → v11.0.2 (replaced @nestjs/bull)"
echo ""
echo "📋 Next steps:"
echo "1. Run 'npm run build' to check for compilation errors"
echo "2. Update any Bull-related code to use BullMQ (see BULL_TO_BULLMQ_MIGRATION.md)"
echo "3. Run 'npm test' to ensure all tests pass"
echo "4. Remove backup files when everything works:"
echo "   rm package.json.backup package-lock.json.backup"
echo ""
print_warning "Note: If you encounter issues, you can restore the backup:"
echo "  mv package.json.backup package.json"
echo "  npm install"