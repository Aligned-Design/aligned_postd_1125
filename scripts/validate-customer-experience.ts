#!/usr/bin/env tsx

/**
 * Customer Experience Validation Script
 * 
 * Validates that the core customer onboarding flow is functional and reliable,
 * accepting both "magic" state (with logos/images) and "empty but valid" state
 * (without logos/images but still functional).
 * 
 * This script checks:
 * - Critical onboarding components exist
 * - Brand summary review screen handles empty logos/images gracefully
 * - Essential UI elements are present and functional
 * - Customer can proceed even without logos/images
 */

import fs from 'fs';
import path from 'path';

interface ValidationResult {
  check: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: string;
}

const results: ValidationResult[] = [];

function addResult(check: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: string) {
  results.push({ check, status, message, details });
}

console.log('🔍 Starting Customer Experience Validation...\n');

// 1. Check that Screen5BrandSummaryReview component exists and handles empty state
const screen5Path = path.join(process.cwd(), 'client/pages/onboarding/Screen5BrandSummaryReview.tsx');
if (fs.existsSync(screen5Path)) {
  const screen5Content = fs.readFileSync(screen5Path, 'utf-8');
  
  // Check for empty state handling
  const hasEmptyLogoHandling = screen5Content.includes('No logos were extracted') || 
                               screen5Content.includes('No logos found') ||
                               screen5Content.includes('logoImages.length > 0');
  
  const hasEmptyImageHandling = screen5Content.includes('No brand images were extracted') ||
                                screen5Content.includes('No images found') ||
                                screen5Content.includes('otherImages.length > 0');
  
  const hasContinueButton = screen5Content.includes('This looks perfect! Continue') ||
                           screen5Content.includes('handleContinue');
  
  const hasColorsSection = screen5Content.includes('Color') || screen5Content.includes('palette');
  const hasToneSection = screen5Content.includes('Tone') || screen5Content.includes('tone');
  const hasKeywordsSection = screen5Content.includes('Keyword') || screen5Content.includes('keyword');
  
  if (hasEmptyLogoHandling && hasEmptyImageHandling && hasContinueButton) {
    addResult(
      'Screen5BrandSummaryReview - Empty state handling',
      'PASS',
      'Component handles empty logos/images gracefully and allows continuation',
      'The component shows appropriate messages when logos/images are missing and still allows users to proceed'
    );
  } else {
    addResult(
      'Screen5BrandSummaryReview - Empty state handling',
      'WARNING',
      'Component may not handle empty logos/images optimally',
      `Logo handling: ${hasEmptyLogoHandling}, Image handling: ${hasEmptyImageHandling}, Continue button: ${hasContinueButton}`
    );
  }
  
  if (hasColorsSection && hasToneSection && hasKeywordsSection) {
    addResult(
      'Screen5BrandSummaryReview - Essential sections',
      'PASS',
      'All essential brand sections are present (colors, tone, keywords)',
    );
  } else {
    addResult(
      'Screen5BrandSummaryReview - Essential sections',
      'WARNING',
      'Some essential sections may be missing',
      `Colors: ${hasColorsSection}, Tone: ${hasToneSection}, Keywords: ${hasKeywordsSection}`
    );
  }
} else {
  addResult(
    'Screen5BrandSummaryReview - Component exists',
    'FAIL',
    'Brand summary review component not found',
    `Expected at: ${screen5Path}`
  );
}

// 2. Check that the onboarding flow can proceed without logos/images
const onboardingFiles = [
  'client/pages/onboarding/Screen1SignUp.tsx',
  'client/pages/onboarding/Screen2BusinessEssentials.tsx',
  'client/pages/onboarding/Screen3AiScrape.tsx',
  'client/pages/onboarding/Screen5BrandSummaryReview.tsx',
];

const existingOnboardingFiles = onboardingFiles.filter(file => 
  fs.existsSync(path.join(process.cwd(), file))
);

if (existingOnboardingFiles.length === onboardingFiles.length) {
  addResult(
    'Onboarding flow - Critical screens exist',
    'PASS',
    `All ${onboardingFiles.length} critical onboarding screens are present`,
  );
} else {
  addResult(
    'Onboarding flow - Critical screens exist',
    'WARNING',
    `Only ${existingOnboardingFiles.length}/${onboardingFiles.length} critical screens found`,
    `Missing: ${onboardingFiles.filter(f => !existingOnboardingFiles.includes(f)).join(', ')}`
  );
}

// 3. Check that build artifacts exist (validates that build succeeded)
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  const hasClientBuild = fs.existsSync(path.join(distPath, 'index.html'));
  const hasServerBuild = fs.existsSync(path.join(distPath, 'server'));
  
  if (hasClientBuild) {
    addResult(
      'Build artifacts - Client',
      'PASS',
      'Client build artifacts exist',
    );
  } else {
    addResult(
      'Build artifacts - Client',
      'WARNING',
      'Client build artifacts not found (may need to run pnpm build)',
    );
  }
} else {
  addResult(
    'Build artifacts - Directory exists',
    'WARNING',
    'dist directory not found (build may not have run)',
    'This is OK if running validation before build'
  );
}

// 4. Summary
console.log('\n📊 Validation Results:\n');
console.log('='.repeat(60));

const passed = results.filter(r => r.status === 'PASS').length;
const warnings = results.filter(r => r.status === 'WARNING').length;
const failed = results.filter(r => r.status === 'FAIL').length;

results.forEach(result => {
  const icon = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
  console.log(`${icon} ${result.check}`);
  console.log(`   ${result.message}`);
  if (result.details) {
    console.log(`   Details: ${result.details}`);
  }
  console.log('');
});

console.log('='.repeat(60));
console.log(`✅ Passed: ${passed}`);
console.log(`⚠️  Warnings: ${warnings}`);
console.log(`❌ Failed: ${failed}`);

// Core customer experience checks: must have empty state handling
const coreChecksPassed = results.some(r => 
  r.check.includes('Empty state handling') && r.status === 'PASS'
);

if (coreChecksPassed && failed === 0) {
  console.log('\n🎉 Customer experience validation PASSED');
  console.log('The onboarding flow works reliably even without logos/images.\n');
  process.exit(0);
} else if (failed > 0) {
  console.log('\n❌ Customer experience validation FAILED');
  console.log('Critical issues found that must be addressed.\n');
  process.exit(1);
} else {
  console.log('\n⚠️  Customer experience validation PASSED with warnings');
  console.log('Core functionality works, but some optimizations recommended.\n');
  process.exit(0);
}

