#!/bin/bash

# Check if Vercel CLI is installed
echo "Checking for Vercel CLI..."

if command -v vercel &> /dev/null; then
    echo "✅ Vercel CLI is installed!"
    vercel --version
    echo ""
    echo "Next steps:"
    echo "1. Run: vercel login"
    echo "2. Run: npm run setup:env"
else
    echo "❌ Vercel CLI is NOT installed"
    echo ""
    echo "To install it, run:"
    echo "  npm install -g vercel"
    echo ""
    echo "Or if using yarn/pnpm:"
    echo "  pnpm add -g vercel"
    echo ""
    echo "After installation, run: vercel login"
fi
