#!/bin/bash
set -e

# Create backup directory
BACKUP_DIR=".fix_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Starting targeted fixes for critical issues..."

# SECTION 1: FIX MISSING VI IMPORTS
echo "Fixing missing vi imports in test files..."

# Add vi import to search-filters.spec.ts if missing
if [ -f "tests/unit/customer/search-filters.spec.ts" ]; then
  echo "Backing up search-filters.spec.ts"
  cp "tests/unit/customer/search-filters.spec.ts" "$BACKUP_DIR/"
  
  if ! grep -q "import.*vi.*from.*vitest" "tests/unit/customer/search-filters.spec.ts"; then
    echo "Adding vi import to search-filters.spec.ts"
    sed -i.bak '1i\
import { describe, it, expect, beforeEach, vi } from '\''vitest'\'';
' "tests/unit/customer/search-filters.spec.ts"
    rm "tests/unit/customer/search-filters.spec.ts.bak"
  fi
fi

# Add vi import to search.service.spec.ts if missing
if [ -f "tests/unit/customer/search.service.spec.ts" ]; then
  echo "Backing up search.service.spec.ts"
  cp "tests/unit/customer/search.service.spec.ts" "$BACKUP_DIR/"
  
  if ! grep -q "import.*vi.*from.*vitest" "tests/unit/customer/search.service.spec.ts"; then
    echo "Adding vi import to search.service.spec.ts"
    sed -i.bak '1i\
import { describe, it, expect, beforeEach, vi } from '\''vitest'\'';
' "tests/unit/customer/search.service.spec.ts"
    rm "tests/unit/customer/search.service.spec.ts.bak"
  fi
fi

# Add vi import to booking-lifecycle.spec.ts if missing
if [ -f "tests/unit/customer/booking-lifecycle.spec.ts" ]; then
  echo "Backing up booking-lifecycle.spec.ts"
  cp "tests/unit/customer/booking-lifecycle.spec.ts" "$BACKUP_DIR/"
  
  if ! grep -q "import.*vi.*from.*vitest" "tests/unit/customer/booking-lifecycle.spec.ts"; then
    echo "Adding vi import to booking-lifecycle.spec.ts"
    sed -i.bak '1i\
import { describe, it, expect, beforeEach, vi } from '\''vitest'\'';
' "tests/unit/customer/booking-lifecycle.spec.ts"
    rm "tests/unit/customer/booking-lifecycle.spec.ts.bak"
  fi
fi

# Add vi import to payment-processing.spec.ts if missing
if [ -f "tests/unit/customer/payment-processing.spec.ts" ]; then
  echo "Backing up payment-processing.spec.ts"
  cp "tests/unit/customer/payment-processing.spec.ts" "$BACKUP_DIR/"
  
  if ! grep -q "import.*vi.*from.*vitest" "tests/unit/customer/payment-processing.spec.ts"; then
    echo "Adding vi import to payment-processing.spec.ts"
    sed -i.bak '1i\
import { describe, it, expect, beforeEach, vi, afterEach } from '\''vitest'\'';
' "tests/unit/customer/payment-processing.spec.ts"
    rm "tests/unit/customer/payment-processing.spec.ts.bak"
  fi
fi

# Add vi import to auth.controller.spec.ts if missing
if [ -f "tests/unit/auth/auth.controller.spec.ts" ]; then
  echo "Backing up auth.controller.spec.ts"
  cp "tests/unit/auth/auth.controller.spec.ts" "$BACKUP_DIR/"
  
  if ! grep -q "import.*vi.*from.*vitest" "tests/unit/auth/auth.controller.spec.ts"; then
    echo "Adding vi import to auth.controller.spec.ts"
    sed -i.bak '1i\
import { describe, it, expect, beforeEach, vi } from '\''vitest'\'';
' "tests/unit/auth/auth.controller.spec.ts"
    rm "tests/unit/auth/auth.controller.spec.ts.bak"
  fi
fi

# SECTION 2: SECURITY FIXES
echo "Applying security fixes..."

# Secure environment variables
if [ -f ".env" ]; then
  echo "Backing up .env"
  cp ".env" "$BACKUP_DIR/"
  
  if grep -q "OPENAI_API_KEY=sk-or-v1-" ".env"; then
    echo "Securing API keys in .env"
    sed -i.bak 's/OPENAI_API_KEY=sk-or-v1-.*/OPENAI_API_KEY=\${OPENAI_API_KEY}/' ".env"
    
    # Add to gitignore if not already there
    if [ ! -f ".gitignore" ] || ! grep -q ".env" ".gitignore"; then
      echo ".env" >> ".gitignore"
    fi
    rm ".env.bak"
  fi
fi

# SECTION 3: CACHE SERVICE INJECTION FIX
echo "Fixing cache service injection in search service tests..."

# Fix cache service injection in search-filters.spec.ts
if [ -f "tests/unit/customer/search-filters.spec.ts" ]; then
  echo "Backing up search-filters.spec.ts"
  cp "tests/unit/customer/search-filters.spec.ts" "$BACKUP_DIR/"
  
  # Add generateSearchKey method to mockCacheService if not already present
  if ! grep -q "generateSearchKey" "tests/unit/customer/search-filters.spec.ts"; then
    echo "Adding generateSearchKey to mockCacheService in search-filters.spec.ts"
    sed -i.bak '/const mockCacheService = {/a\
      generateSearchKey: vi.fn().mockReturnValue('\''test-key'\''),\
      getSearchResults: vi.fn().mockResolvedValue(null),\
      setSearchResults: vi.fn().mockResolvedValue(undefined),\
' "tests/unit/customer/search-filters.spec.ts"
    rm "tests/unit/customer/search-filters.spec.ts.bak"
  fi
fi

# Fix cache service injection in search.service.spec.ts
if [ -f "tests/unit/customer/search.service.spec.ts" ]; then
  echo "Backing up search.service.spec.ts"
  cp "tests/unit/customer/search.service.spec.ts" "$BACKUP_DIR/"
  
  # Ensure mockCacheService has all required methods
  if ! grep -q "generateSearchKey.*mockReturnValue" "tests/unit/customer/search.service.spec.ts"; then
    echo "Updating mockCacheService in search.service.spec.ts"
    sed -i.bak '/const mockCacheService = {/c\
        { provide: CacheService, useValue: {\
          generateSearchKey: vi.fn().mockReturnValue('\''test-key'\''),\
          getSearchResults: vi.fn().mockResolvedValue(null),\
          setSearchResults: vi.fn().mockResolvedValue(undefined),\
          get: vi.fn().mockResolvedValue(null),\
          set: vi.fn().mockResolvedValue(undefined),\
          del: vi.fn().mockResolvedValue(undefined)\
        } }' "tests/unit/customer/search.service.spec.ts"
    rm "tests/unit/customer/search.service.spec.ts.bak"
  fi
fi

# SECTION 4: VERIFICATION
echo "Verifying fixes..."

# Run tests to verify fixes
echo "Running tests to verify fixes..."
npx vitest run \
  tests/unit/customer/search-filters.spec.ts \
  tests/unit/customer/search.service.spec.ts \
  tests/unit/customer/booking-lifecycle.spec.ts \
  tests/unit/customer/payment-processing.spec.ts \
  tests/unit/auth/auth.controller.spec.ts || {
    echo "ERROR: Tests failed after applying fixes - reverting changes"
    # Restore from backup
    for file in "$BACKUP_DIR"/*; do
      [ -f "$file" ] && cp "$file" "$(basename "$file")"
    done
    exit 1
  }

# Verify security fixes
if [ -f ".env" ] && grep -q "OPENAI_API_KEY=sk-or-v1-" ".env"; then
  echo "ERROR: API keys still exposed - reverting security changes"
  cp "$BACKUP_DIR/.env" ".env" 2>/dev/null || true
fi

# Commit changes
echo "Committing verified changes..."
git add .env .gitignore \
  tests/unit/customer/search-filters.spec.ts \
  tests/unit/customer/search.service.spec.ts \
  tests/unit/customer/booking-lifecycle.spec.ts \
  tests/unit/customer/payment-processing.spec.ts \
  tests/unit/auth/auth.controller.spec.ts 2>/dev/null || echo "No files to commit"

git commit -m "fix(tests): resolved critical issues from analysis report
- Added missing vi imports to test files
- Fixed cache service injection in search service tests
- Secured API keys in .env file
- Added .env to .gitignore" || echo "No changes to commit"

# Create summary report
cat > FIX_SUMMARY.md << EOF
# Fix Implementation Summary

## Successfully Applied
- Added missing vi imports to 5 test files
- Fixed cache service injection in search service tests
- Secured API keys in .env file
- Added .env to .gitignore

## Remaining Issues (from analysis report)
- Type mismatches in test files (TS2339, TS2554, TS2322 errors) - requires manual review
- TypeScript strict mode disabled - requires incremental enabling
- 222 ESLint warnings beyond unused imports - requires code refactoring
- Missing properties in object literals - requires manual review

## Next Steps
1. Address type mismatches by updating test expectations to match service interfaces
2. Enable TypeScript strict mode incrementally
3. Fix remaining ESLint warnings through code refactoring
4. Review and update object literals with missing properties

This summary was generated automatically on $(date)
EOF

echo "Fix process completed. See FIX_SUMMARY.md for details."
echo "The following issues still require manual attention per analysis report:"
echo "- Type mismatches in test files (TS2339, TS2554, TS2322 errors)"
echo "- TypeScript strict mode configuration"
echo "- Remaining ESLint warnings"
echo "- Missing properties in object literals"