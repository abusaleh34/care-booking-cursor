#!/bin/bash

echo "🔧 Fixing Email Index Conflict"
echo "=============================="

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

# Step 1: Check current indexes
echo ""
echo "📋 Checking current database indexes..."
npx ts-node scripts/check-indexes.ts

echo ""
echo "🔄 Running migration to fix index conflict..."

# Step 2: Run the specific migration
npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts --migration src/database/migrations/1734790000000-FixEmailIndexConflict.ts

if [ $? -eq 0 ]; then
    print_status "Migration completed successfully!"
else
    print_error "Migration failed. Check the error messages above."
    exit 1
fi

# Step 3: Verify the fix
echo ""
echo "🔍 Verifying the fix..."
npx ts-node scripts/check-indexes.ts

echo ""
echo "✅ Index conflict resolution complete!"
echo ""
echo "Next steps:"
echo "1. Try running the application: npm run start:dev"
echo "2. If successful, run the seeding script: npm run seed:full"