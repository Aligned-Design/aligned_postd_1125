# Onboarding & Content Generation Improvements - Implementation Plan

## Overview

This document outlines the implementation plan for hardening the onboarding and content generation flows based on the comprehensive audit.

## Critical Fixes (Priority 1)

### 1. Auth Signup - Better "User Already Registered" Handling

**Issue**: 400 errors for already-registered users are logged as errors, but should be logged at info level with clearer messaging.

**Fix**: 
- Detect specific "user already exists" error from Supabase
- Return 400 with clear message (not error level)
- Log at info/warning level, not error
- UI shows friendly "already registered" message

**Files to Modify**:
- `server/routes/auth.ts`

### 2. AI Provider Failures - Graceful Default Content Generation

**Issue**: When both AI providers fail, content generation throws error and fails completely.

**Fix**:
- Create deterministic default content plan generator
- When AI fails completely, generate sensible defaults based on brand guide
- Return structured response indicating "AI unavailable" state
- Log clearly but don't fail the request

**Files to Modify**:
- `server/lib/onboarding-content-generator.ts` - Add default content generator
- `server/lib/content-planning-service.ts` - Add fallback logic
- `server/workers/ai-generation.ts` - Improve error handling

### 3. Content Plan Persistence - Ensure Reliability

**Issue**: Persistence failures cause "Content Not Found" errors later.

**Fix**:
- Always return content even if persistence fails (log clearly)
- Add retry logic for transient DB errors
- Ensure transactional consistency where possible
- Clear logging of persistence success/failure

**Files to Modify**:
- `server/routes/onboarding.ts`
- `server/routes/content-plan.ts`
- `server/lib/content-planning-service.ts`

### 4. Frontend - Fix "Content Not Found" Error

**Issue**: Shows scary "Content Not Found" banner when content might exist or be generating.

**Fix**:
- Better empty state with "Generate Content" button
- Poll/retry logic for content loading
- Distinguish "generating" vs "failed" vs "empty"
- Clear actionable messages

**Files to Modify**:
- `client/pages/onboarding/Screen8CalendarPreview.tsx`
- `client/lib/user-friendly-errors.ts`

## Implementation Status

- ✅ Audit completed
- ⏳ Critical fixes (in progress)
- ⏳ Documentation
- ⏳ Testing

