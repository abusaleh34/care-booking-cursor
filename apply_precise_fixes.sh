#!/bin/bash
set -e

# Create backup directory
BACKUP_DIR=".fix_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Starting precise fixes for cache service injection issue..."

# SECTION 1: FIX CACHE SERVICE INJECTION IN SEARCH SERVICE TESTS
echo "Fixing cache service injection in search service tests..."

# Fix cache service injection in search-filters.spec.ts
if [ -f "tests/unit/customer/search-filters.spec.ts" ]; then
  echo "Backing up search-filters.spec.ts"
  cp "tests/unit/customer/search-filters.spec.ts" "$BACKUP_DIR/"
  
  # Add cacheService to the test setup
  if grep -q "const mockCacheService = {" "tests/unit/customer/search-filters.spec.ts"; then
    echo "Updating mockCacheService in search-filters.spec.ts"
    sed -i.bak '/const mockCacheService = {/,/};/c\
    const mockCacheService = {\
      get: vi.fn(),\
      set: vi.fn(),\
      del: vi.fn(),\
      generateSearchKey: vi.fn().mockReturnValue("test-search-key"),\
      getSearchResults: vi.fn().mockResolvedValue(null),\
      setSearchResults: vi.fn().mockResolvedValue(undefined)\
    };' "tests/unit/customer/search-filters.spec.ts"
    rm "tests/unit/customer/search-filters.spec.ts.bak"
  fi
fi

# Fix cache service injection in search.service.spec.ts
if [ -f "tests/unit/customer/search.service.spec.ts" ]; then
  echo "Backing up search.service.spec.ts"
  cp "tests/unit/customer/search.service.spec.ts" "$BACKUP_DIR/"
  
  # Update the mockCacheService in the test module
  if grep -q "{ provide: CacheService, useValue:" "tests/unit/customer/search.service.spec.ts"; then
    echo "Updating mockCacheService in search.service.spec.ts"
    sed -i.bak '/{ provide: CacheService, useValue:/,/}/c\
        { provide: CacheService, useValue: {\
          generateSearchKey: vi.fn().mockReturnValue("test-search-key"),\
          getSearchResults: vi.fn().mockResolvedValue(null),\
          setSearchResults: vi.fn().mockResolvedValue(undefined),\
          get: vi.fn().mockResolvedValue(null),\
          set: vi.fn().mockResolvedValue(undefined),\
          del: vi.fn().mockResolvedValue(undefined)\
        } }' "tests/unit/customer/search.service.spec.ts"
    rm "tests/unit/customer/search.service.spec.ts.bak"
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

git commit -m "fix(tests): resolved cache service injection in search service tests
- Fixed cache service injection in search service tests
- Secured API keys in .env file
- Added .env to .gitignore" || echo "No changes to commit"

# Create summary report
cat > FIX_SUMMARY.md << EOF
# Fix Implementation Summary

## Successfully Applied
- Fixed cache service injection in search service tests
- Secured API keys in .env file
- Added .env to .gitignore

## Remaining Issues (from analysis report)
- Missing vi imports in some test files - requires manual review
- Type mismatches in test files (TS2339, TS2554, TS2322 errors) - requires manual review
- TypeScript strict mode disabled - requires incremental enabling
- 222 ESLint warnings beyond unused imports - requires code refactoring
- Missing properties in object literals - requires manual review

## Next Steps
1. Add missing vi imports to test files
2. Address type mismatches by updating test expectations to match service interfaces
3. Enable TypeScript strict mode incrementally
4. Fix remaining ESLint warnings through code refactoring
5. Review and update object literals with missing properties

This summary was generated automatically on $(date)
EOF

echo "Fix process completed. See FIX_SUMMARY.md for details."
echo "The following issues still require manual attention per analysis report:"
echo "- Missing vi imports in some test files"
echo "- Type mismatches in test files (TS2339, TS2554, TS2322 errors)"
echo "- TypeScript strict mode configuration"
echo "- Remaining ESLint warnings"
echo "- Missing properties in object literals"