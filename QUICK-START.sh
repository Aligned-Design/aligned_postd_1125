#!/bin/bash

# Quick Start: Create all GitHub issues in 3 commands

echo "=================================================="
echo "GitHub Issues Batch Creation - Quick Start"
echo "=================================================="
echo ""

# Check prerequisites
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not installed"
    echo "Install from: https://cli.github.com"
    exit 1
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN not set"
    echo "Run: export GITHUB_TOKEN=your_token_here"
    echo "Get token from: https://github.com/settings/tokens"
    exit 1
fi

echo "✅ Verified GitHub CLI"
echo "✅ Verified GITHUB_TOKEN"
echo ""
echo "Ready to create 85 issues! (This takes 2 minutes)"
echo ""
echo "Running: bash scripts/create-github-issues.sh"
echo "=================================================="
echo ""

bash scripts/create-github-issues.sh
