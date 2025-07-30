#!/bin/bash
set -e

# Create backup directory
BACKUP_DIR=".fix_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Starting comprehensive fixes for test dependencies..."

# SECTION 1: FIX SEARCH SERVICE TESTS
echo "Fixing search service tests dependencies..."

# Fix search-filters.spec.ts
if [ -f "tests/unit/customer/search-filters.spec.ts" ]; then
  echo "Backing up search-filters.spec.ts"
  cp "tests/unit/customer/search-filters.spec.ts" "$BACKUP_DIR/"
  
  # Add missing vi import if needed
  if ! grep -q "import.*vi.*from.*vitest" "tests/unit/customer/search-filters.spec.ts"; then
    sed -i.bak '1i\
import { describe, it, expect, beforeEach, vi } from 'vitest';
' "tests/unit/customer/search-filters.spec.ts"
    rm "tests/unit/customer/search-filters.spec.ts.bak"
  fi
  
  # Update the mockCacheService to include generateSearchKey method
  sed -i.bak '/const mockCacheService = {/c\
    const mockCacheService = {\
      get: vi.fn(),\
      set: vi.fn(),\
      del: vi.fn(),\
      generateSearchKey: vi.fn().mockReturnValue('test-search-key'),\
      getSearchResults: vi.fn().mockResolvedValue(null),\
      setSearchResults: vi.fn().mockResolvedValue(undefined)\
    };' "tests/unit/customer/search-filters.spec.ts"
  rm "tests/unit/customer/search-filters.spec.ts.bak"
fi

# Fix search.service.spec.ts
if [ -f "tests/unit/customer/search.service.spec.ts" ]; then
  echo "Backing up search.service.spec.ts"
  cp "tests/unit/customer/search.service.spec.ts" "$BACKUP_DIR/"
  
  # Add missing vi import if needed
  if ! grep -q "import.*vi.*from.*vitest" "tests/unit/customer/search.service.spec.ts"; then
    sed -i.bak '1i\
import { describe, it, expect, beforeEach, vi } from 'vitest';
' "tests/unit/customer/search.service.spec.ts"
    rm "tests/unit/customer/search.service.spec.ts.bak"
  fi
  
  # Update the CacheService mock to include generateSearchKey method
  sed -i.bak '/provide: CacheService,/c\
        { provide: CacheService, useValue: {\
          generateSearchKey: vi.fn().mockReturnValue('test-search-key'),\
          getSearchResults: vi.fn().mockResolvedValue(null),\
          setSearchResults: vi.fn().mockResolvedValue(undefined),\
          get: vi.fn().mockResolvedValue(null),\
          set: vi.fn().mockResolvedValue(undefined),\
          del: vi.fn().mockResolvedValue(undefined)\
        } }' "tests/unit/customer/search.service.spec.ts"
  rm "tests/unit/customer/search.service.spec.ts.bak"
fi

# SECTION 2: SECURITY FIXES
echo "Applying security fixes..."

# Secure environment variables
if [ -f ".env" ]; then
  echo "Backing up .env"
  cp ".env" "$BACKUP_DIR/"
  
  if grep -q "OPENAI_API_KEY=sk-or-v1-" ".env"; then
    echo "Securing API keys in .env"
    sed -i.bak 's/OPENAI_API_KEY=sk-or-v1-.*/OPENAI_API_KEY=${OPENAI_API_KEY}/' ".env"
    
    # Add to gitignore if not already there
    if [ ! -f ".gitignore" ] || ! grep -q ".env" ".gitignore"; then
      echo ".env" >> ".gitignore"
    fi
    rm ".env.bak"
  fi
fi

# SECTION 3: VERIFICATION
echo "Verifying fixes..."

# Run tests to verify fixes
echo "Running tests to verify fixes..."
npx vitest run \
  tests/unit/customer/search-filters.spec.ts \
  tests/unit/customer/search.service.spec.ts || {
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
  tests/unit/customer/search.service.spec.ts 2>/dev/null || echo "No files to commit"

git commit -m "fix(tests): resolved cache service injection and dependency issues
- Fixed cache service injection in search service tests
- Added missing vi imports to test files
- Secured API keys in .env file
- Added .env to .gitignore" || echo "No changes to commit"

# Create summary report
cat > FIX_SUMMARY.md << EOF
# Fix Implementation Summary

## Successfully Applied
- Fixed cache service injection in search service tests
- Added missing vi imports to test files
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