#!/bin/bash

echo "🔧 Removing temporary dropSchema configuration"
echo "============================================="

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

# Step 1: Remove the temporary config file
echo "Removing temporary configuration file..."
if [ -f "src/config/database-temp-fix.config.ts" ]; then
    rm src/config/database-temp-fix.config.ts
    print_status "Removed src/config/database-temp-fix.config.ts"
else
    print_warning "Temporary config file not found"
fi

# Step 2: Revert app.module.ts
echo ""
echo "Reverting app.module.ts..."

# Remove the import
sed -i '' '/\/\/ ⚠️ TEMPORARY IMPORT - REMOVE AFTER FIX ⚠️/d' src/app.module.ts
sed -i '' '/import { TEMP_DATABASE_CONFIG }/d' src/app.module.ts

# Remove the warning block and dropSchema
sed -i '' '/\/\/ ⚠️ TEMPORARY WARNING ⚠️/,/dropSchema: configService.get.*TEMP_DATABASE_CONFIG.dropSchema,/d' src/app.module.ts

# Fix the return statement formatting
sed -i '' 's/useFactory: (configService: ConfigService) => {/useFactory: (configService: ConfigService) => ({/' src/app.module.ts
sed -i '' 's/return {//' src/app.module.ts
sed -i '' 's/};/})/' src/app.module.ts

print_status "Reverted app.module.ts"

# Step 3: Revert data-source.ts
echo ""
echo "Reverting data-source.ts..."

# Remove the import
sed -i '' '/\/\/ ⚠️ TEMPORARY IMPORT - REMOVE AFTER FIX ⚠️/d' src/database/data-source.ts
sed -i '' '/import { TEMP_DATABASE_CONFIG }/d' src/database/data-source.ts

print_status "Reverted data-source.ts"

echo ""
print_status "dropSchema configuration has been removed!"
echo ""
echo "Next steps:"
echo "1. Run the application: npm run start:dev"
echo "2. Seed the database: npm run seed:full"
echo "3. Commit the reverted changes"