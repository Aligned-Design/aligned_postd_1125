# POSTD Phase 6 - T1: Test Cleanup Plan

> **Status:** 📋 Plan Only – This is a plan document, not yet executed.  
> **Last Updated:** 2025-01-20

**Date:** 2025-01-20

## Overview

This document outlines the plan for cleaning up TypeScript errors in test files. **This is future work and has not been executed yet.**

## Current Test Error Status

**Total Test TypeScript Errors:** 104

**Error Distribution by File:**
- `server/__tests__/weekly-summary.test.ts` - 38 errors
- `server/__tests__/rbac-enforcement.test.ts` - 27 errors
- `server/__tests__/oauth-csrf.test.ts` - 10 errors
- `server/__tests__/phase-6-media.test.ts` - 8 errors
- `server/__tests__/websocket-server.test.ts` - 5 errors
- `server/__tests__/pipeline-orchestrator.test.ts` - 4 errors
- `server/__tests__/integration-routes.test.ts` - 2 errors
- `server/__tests__/escalation-scheduler.test.ts` - 2 errors
- `server/__tests__/brand-intelligence-json.test.ts` - 1 error
- `server/__tests__/webhook-handler.test.ts` - 1 error
- `server/__tests__/validation-schemas.test.ts` - 1 error
- `server/__tests__/rls-validation.test.ts` - 1 error
- `server/__tests__/phase-8-analytics.test.ts` - 1 error
- `server/__tests__/phase-7-publishing.test.ts` - 1 error
- `server/__tests__/phase-2-routes-integration.test.ts` - 1 error
- `server/__tests__/fixtures.ts` - 1 error

## Error Type Analysis

### 1. Type Assertion Issues (`unknown` → specific types)
**Count:** ~40+ errors  
**Files:** Most test files  
**Pattern:**
- `error TS2339: Property 'X' does not exist on type 'unknown'`
- `error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'X'`

**Examples:**
- `server/__tests__/phase-6-media.test.ts`: Property 'metadata', 'id' does not exist on type 'unknown'
- `server/__tests__/oauth-csrf.test.ts`: Property 'validatedState', 'message' does not exist on type 'unknown'
- `server/__tests__/escalation-scheduler.test.ts`: Argument of type 'unknown' is not assignable to parameter of type 'EscalationLevel'

**Fix Strategy:**
- Add proper type guards or type assertions
- Use `as` assertions where safe (with comments)
- Create helper functions for common type conversions

### 2. Missing/Incorrect Mock Types
**Count:** ~35+ errors  
**Files:** `weekly-summary.test.ts`, `rbac-enforcement.test.ts`, `oauth-csrf.test.ts`, `integration-routes.test.ts`  
**Pattern:**
- `error TS2339: Property 'X' does not exist on type 'Request'`
- `error TS2554: Expected N arguments, but got M`
- `error TS2349: This expression is not callable`
- `error TS2708: Cannot use namespace 'jest' as a value`
- `error TS2694: Namespace 'global.jest' has no exported member 'Mock'`

**Examples:**
- `server/__tests__/oauth-csrf.test.ts`: Property 'validatedState' does not exist on type 'Request' (8 instances)
- `server/__tests__/integration-routes.test.ts`: Expected 3 arguments, but got 2 (2 instances)
- `server/__tests__/rbac-enforcement.test.ts`: Jest mock type issues (27 errors)

**Fix Strategy:**
- Extend Express Request type with custom properties
- Update mock function signatures to match actual implementations
- Create proper mock factories with correct types
- Fix Jest type imports and mock declarations
- Add missing required properties to test user objects (e.g., `email` field)

### 3. Outdated Type Definitions
**Count:** ~15+ errors  
**Files:** `pipeline-orchestrator.test.ts`, `phase-6-media.test.ts`, `phase-2-routes-integration.test.ts`  
**Pattern:**
- `error TS2339: Property 'X' does not exist on type 'Y'`
- `error TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'`
- `error TS2367: This comparison appears to be unintentional because types have no overlap`

**Examples:**
- `server/__tests__/pipeline-orchestrator.test.ts`: Property 'scores' does not exist on type (2 instances)
- `server/__tests__/pipeline-orchestrator.test.ts`: Argument of type '"copy"' is not assignable to parameter of type '"advisor" | "copywriter" | "creative"' (2 instances)
- `server/__tests__/phase-2-routes-integration.test.ts`: Comparison between '"brand_1"' and '"brand_2"' has no overlap

**Fix Strategy:**
- Update test code to match current type definitions
- Align test mocks with actual service interfaces
- Fix enum/union type mismatches
- Correct test assertions that compare incompatible types

### 4. Fixture/Test Data Type Issues
**Count:** ~10+ errors  
**Files:** `fixtures.ts`, various test files  
**Pattern:**
- `error TS2322: Type 'X' is not assignable to type 'Y'`
- `error TS2739: Type '{}' is missing the following properties`

**Examples:**
- `server/__tests__/fixtures.ts`: Type 'string' is not assignable to type 'Record<string, unknown>'
- `server/__tests__/phase-6-media.test.ts`: Type '{}' is missing properties

**Fix Strategy:**
- Update fixture data to match current type definitions
- Add missing required properties to test objects
- Use proper type constructors for test data

## Proposed Batch Breakdown

### T1A: Fix Base Test Utilities & Types
**Scope:**
- `server/__tests__/fixtures.ts` - Fix base fixture types
- Create/update shared test type utilities
- Fix Express Request type extensions for tests

**Estimated Errors:** ~15-20  
**Priority:** High (foundation for other fixes)

**Tasks:**
1. Fix `fixtures.ts` type definitions
2. Create proper type guards for common test patterns
3. Extend Express Request type with test-specific properties
4. Update shared mock utilities

### T1B: Fix Server Integration Tests
**Scope:**
- `server/__tests__/oauth-csrf.test.ts`
- `server/__tests__/integration-routes.test.ts`
- `server/__tests__/rls-validation.test.ts`
- `server/__tests__/validation-schemas.test.ts`
- `server/__tests__/webhook-handler.test.ts`

**Estimated Errors:** ~15-20  
**Priority:** High (core functionality tests)

**Tasks:**
1. Fix Request type extensions for OAuth/CSRF tests
2. Update mock function signatures
3. Fix type assertions for test data
4. Align test mocks with current route handlers

### T1C: Fix Feature-Specific Tests
**Scope:**
- `server/__tests__/escalation-scheduler.test.ts`
- `server/__tests__/pipeline-orchestrator.test.ts`
- `server/__tests__/phase-6-media.test.ts`
- `server/__tests__/phase-7-publishing.test.ts`
- `server/__tests__/phase-8-analytics.test.ts`
- `server/__tests__/phase-2-routes-integration.test.ts`

**Estimated Errors:** ~20-25  
**Priority:** Medium (feature-specific tests)

**Tasks:**
1. Fix type assertions for service responses
2. Update test data to match current interfaces
3. Fix enum/union type mismatches
4. Align mocks with current service implementations

### T1D: Fix Large Test Files
**Scope:**
- `server/__tests__/weekly-summary.test.ts` (38 errors)
- `server/__tests__/rbac-enforcement.test.ts` (27 errors)
- `server/__tests__/websocket-server.test.ts` (5 errors)

**Estimated Errors:** ~70  
**Priority:** Medium (comprehensive test suites)

**Tasks:**
1. Fix type assertions throughout large test files
2. Update mock factories and helpers
3. Fix Request/Response type extensions
4. Align test patterns with current codebase

## Execution Strategy

### Phase T1A (Foundation)
1. Start with `fixtures.ts` to establish correct base types
2. Create shared test type utilities
3. Extend Express types for test environment
4. Verify foundation fixes don't break other tests

### Phase T1B (Core Tests)
1. Fix integration and route tests
2. Ensure core functionality tests compile
3. Verify test structure is sound

### Phase T1C (Feature Tests)
1. Fix feature-specific test files
2. Align with current service interfaces
3. Update test data patterns

### Phase T1D (Large Files)
1. Tackle high-error-count files systematically
2. Fix patterns that repeat across multiple tests
3. Ensure comprehensive test coverage remains

## Constraints

- **Do NOT** change test logic or behavior
- **Do NOT** remove test coverage
- **Do NOT** use `@ts-ignore` without clear justification
- **DO** maintain test readability and maintainability
- **DO** align with current codebase types and interfaces
- **DO** add type guards and assertions where appropriate

## Success Criteria

- ✅ All test files compile without TypeScript errors
- ✅ Test logic and behavior unchanged
- ✅ Test coverage maintained or improved
- ✅ Type safety improved in test code
- ✅ Test code follows current codebase patterns

## Notes

- This plan is **future work** and has not been executed
- Test errors do not block application functionality
- Test cleanup can be done incrementally
- Some errors may resolve automatically when base types are fixed

---

**Last Updated:** 2025-01-20  
**Status:** 📋 PLAN ONLY - Awaiting execution

