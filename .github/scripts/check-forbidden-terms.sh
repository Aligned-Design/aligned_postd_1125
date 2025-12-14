#!/bin/bash
# POSTD - Forbidden Terms Check
# Prevents reintroduction of deprecated dependencies and branding

set -e

echo "🔍 Checking for forbidden terms in code..."

FORBIDDEN_FOUND=false

# Check for Builder.io in code files
echo "Checking for Builder.io references..."
if grep -rn "builder\.io\|@builder\.io\|BuilderComponent\|builder\.init" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    server/ client/ shared/ 2>/dev/null; then
    echo "❌ Found Builder.io references in code"
    FORBIDDEN_FOUND=true
fi

# Check for old branding in code (allow in docs/archive)
echo "Checking for deprecated branding..."
if grep -rn "aligned-20\|aligned20\|Aligned-20AI" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    --exclude-dir="docs" --exclude-dir="design-import" \
    server/ client/ shared/ 2>/dev/null; then
    echo "❌ Found deprecated 'Aligned-20AI' branding in code"
    FORBIDDEN_FOUND=true
fi

# Check package.json for forbidden dependencies
echo "Checking package.json for forbidden dependencies..."
if grep -n "@builder\.io" package.json 2>/dev/null; then
    echo "❌ Found Builder.io in package.json dependencies"
    FORBIDDEN_FOUND=true
fi

if [ "$FORBIDDEN_FOUND" = true ]; then
    echo ""
    echo "❌ FAIL: Forbidden terms found in codebase"
    echo ""
    echo "See docs/CANONICAL_TERMS.md for approved terminology"
    exit 1
else
    echo ""
    echo "✅ PASS: No forbidden terms in code"
    exit 0
fi

