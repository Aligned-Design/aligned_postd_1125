# ESLint Rules Guide

**Document Version:** 1.0
**Last Updated:** November 2025
**Scope:** Code quality and consistency enforcement

---

## Quick Reference

### Key Rules

| Rule | Level | How to Fix | Example |
|------|-------|-----------|---------|
| `no-unused-vars` | ❌ Error | Prefix with `_` or remove | `import { _unused } from '...'` |
| `no-explicit-any` | ⚠️ Warning | Use `unknown` with type guards | `const x: unknown = value;` |
| `react-hooks/rules-of-hooks` | ❌ Error | Move hooks to top level | Move outside conditionals |
| `react-refresh/only-export-components` | ⚠️ Warning | Move constants to separate file | Move `export const X` to own file |

---

## Rule: `@typescript-eslint/no-unused-vars`

### **Purpose**
Catch unused imports and variables that should be removed or marked as intentional.

### **Level**
❌ **Error** - Will fail lint check in CI/CD pipeline

### **Configuration**
```javascript
'@typescript-eslint/no-unused-vars': [
  'error',
  {
    argsIgnorePattern: '^_',           // Function arguments
    varsIgnorePattern: '^_',           // Variables
    caughtErrorsIgnorePattern: '^_',   // Catch clause parameters
    ignoreRestSiblings: true,          // Rest parameters
  },
]
```

### **How It Works**

#### ✅ PASS: Remove unused import
```typescript
// BEFORE: Unused import
import { UnusedComponent, UsedComponent } from './components';

// AFTER: Remove unused
import { UsedComponent } from './components';
```

#### ✅ PASS: Prefix with underscore if intentional
```typescript
// Intentionally unused (e.g., type-only import for type checking)
import { _UnusedType } from './types';

// Intentionally unused function parameter
function handler(_event: Event, data: Data) {
  return processData(data);
}

// Intentionally unused catch parameter
try {
  await operation();
} catch (_error) {
  handleError();
}
```

#### ❌ FAIL: Unused import without underscore
```typescript
// Will fail lint check
import { UnusedComponent } from './components';

export function MyComponent() {
  return <div>Hello</div>;
}
```

#### ❌ FAIL: Unused variable without underscore
```typescript
// Will fail lint check
const unusedVariable = 42;

function process(data) {
  return data;
}
```

### **When to Use Underscore Prefix**

Use underscore prefix for:
1. **Type-only imports** that are used in type annotations only
2. **Destructured parameters** that you intentionally don't use
3. **Catch clause errors** that you don't handle but must catch
4. **Intentional placeholders** for future use

### **Migration Guide**

If you have many unused imports:

```bash
# Auto-fix: Automatically prefix unused vars with underscore
pnpm exec eslint . --fix

# Manual review recommended after auto-fix
git diff
```

---

## Rule: `@typescript-eslint/no-explicit-any`

### **Purpose**
Encourage explicit TypeScript typing instead of using `any`, which defeats the purpose of TypeScript.

### **Level**
⚠️ **Warning** - Reported but won't fail CI (non-blocking)

### **Configuration**
```javascript
'@typescript-eslint/no-explicit-any': [
  'warn',
  {
    fixToUnknown: true,      // Suggest 'unknown' instead of 'any'
    ignoreRestArgs: false,   // Don't ignore rest parameters
  },
]
```

### **How It Works**

#### ✅ PASS: Use specific types
```typescript
// Good: Specific interface type
interface User {
  id: string;
  name: string;
}

function getUser(id: string): User {
  // ...
}

// Good: Use unknown with type guard
function process(value: unknown) {
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  return null;
}

// Good: Use generic type
function getValue<T>(key: string): T | undefined {
  // ...
}
```

#### ⚠️ WARNING: Using `any`
```typescript
// Will show warning
function getData(params: any): any {
  return params.data;
}

// Will show warning
const response: any = await fetch(url);
```

#### ✅ PASS: Replace `any` with `unknown`
```typescript
// Better: Use unknown with type narrowing
async function getData(params: unknown): Promise<unknown> {
  if (typeof params !== 'object' || params === null) {
    throw new Error('Invalid params');
  }

  const typedParams = params as Record<string, unknown>;
  return typedParams.data;
}

// Even better: Use proper typing
interface Params {
  data: unknown;
}

async function getData(params: Params): Promise<unknown> {
  return params.data;
}
```

### **Migration Path**

```typescript
// Step 1: Replace any with unknown
const value: unknown = getValue();

// Step 2: Add type guard
if (typeof value === 'string') {
  // value is string here
  console.log(value.length);
}

// Step 3: Or use type assertion when confident
const typedValue = value as MyType;
```

---

## Rule: `react-hooks/rules-of-hooks`

### **Purpose**
Enforce React Hooks rules (only call hooks at top level, not in conditionals).

### **Level**
❌ **Error** - Will fail lint check

### **Common Violations**

#### ❌ FAIL: Hook inside conditional
```typescript
function Component() {
  if (someCondition) {
    const [state, setState] = useState(0); // ❌ WRONG
  }
  return null;
}

function Component() {
  for (let i = 0; i < 10; i++) {
    useEffect(() => {}); // ❌ WRONG
  }
  return null;
}
```

#### ✅ PASS: Hooks at top level
```typescript
function Component() {
  const [state, setState] = useState(0); // ✅ Correct

  useEffect(() => {
    // Use condition inside effect, not around hook
    if (someCondition) {
      setState(1);
    }
  }, []);

  return null;
}
```

---

## Rule: `react-refresh/only-export-components`

### **Purpose**
Ensure files export only React components, not constants or functions that would break hot module reloading.

### **Level**
⚠️ **Warning** - Non-blocking but should be fixed

### **How It Works**

#### ❌ FAIL: Exporting non-component code in component file
```typescript
// components/Button.tsx
export const BUTTON_STYLES = { /* ... */ }; // ❌ FAIL
export const formatLabel = (s: string) => s.toUpperCase(); // ❌ FAIL

export function Button() {
  return <button>{formatLabel('Click')}</button>;
}
```

#### ✅ PASS: Separate constants and utilities
```typescript
// components/Button.styles.ts
export const BUTTON_STYLES = { /* ... */ }; // ✅ In separate file

// components/Button.utils.ts
export const formatLabel = (s: string) => s.toUpperCase(); // ✅ In separate file

// components/Button.tsx
import { BUTTON_STYLES } from './Button.styles';
import { formatLabel } from './Button.utils';

export function Button() {
  return <button>{formatLabel('Click')}</button>;
}
```

---

## Running ESLint

### **Check for violations**
```bash
# Check all files
pnpm run lint

# Check specific file
pnpm exec eslint src/components/MyComponent.tsx

# Check with detailed output
pnpm exec eslint . --format=detailed
```

### **Auto-fix violations**
```bash
# Auto-fix all fixable issues
pnpm exec eslint . --fix

# Auto-fix specific file
pnpm exec eslint src/components/MyComponent.tsx --fix
```

### **Disable for specific line**
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = unknownValue;

// Or disable multiple rules
/* eslint-disable @typescript-eslint/no-explicit-any, no-unused-vars */
const data: any = unknownValue;
const unused = 42;
/* eslint-enable */
```

---

## CI/CD Integration

### **GitHub Actions**
ESLint runs automatically on every PR via `.github/workflows/ci.yml`:

```bash
# Check runs during PR validation
pnpm run lint
```

**Current Status:** Non-blocking warning (allows PR to merge with lint issues)

### **Making Lint Errors Blocking**
If you want lint failures to block PRs:

```yaml
# In .github/workflows/ci.yml
- run: pnpm run lint
  continue-on-error: false  # Change this to fail on lint errors
```

---

## Best Practices

### ✅ DO

1. **Remove unused imports**
   ```typescript
   import { used } from './module'; // Keep this
   ```

2. **Type your functions**
   ```typescript
   function process(data: Data): Result {
     // ...
   }
   ```

3. **Use specific types**
   ```typescript
   const user: User = { id: '1', name: 'John' };
   ```

4. **Prefix intentional unused vars**
   ```typescript
   function handler(_event: Event) {
     // ...
   }
   ```

### ❌ DON'T

1. **Leave unused imports hanging**
   ```typescript
   import { unused } from './module'; // Remove this
   ```

2. **Use `any` type**
   ```typescript
   const data: any = getValue(); // Use unknown instead
   ```

3. **Put hooks in conditionals**
   ```typescript
   if (condition) {
     useState(); // Move outside conditional
   }
   ```

4. **Export constants from component files**
   ```typescript
   // In Button.tsx
   export const STYLES = {...}; // Move to Button.styles.ts
   ```

---

## Troubleshooting

### **"Variable 'X' is assigned a value but never used"**
**Solution:** Either remove the variable or prefix with `_`
```typescript
// Option 1: Remove
const unused = 42;

// Option 2: Prefix if intentional
const _unused = 42; // Marked as intentional
```

### **"'X' is not exported by module"**
**Solution:** Check import path and ensure named export exists
```typescript
// Check that 'Component' is exported
import { Component } from './file'; // Not as default export
```

### **"Type 'any' is not allowed"**
**Solution:** Replace with proper type or use `unknown`
```typescript
// Instead of
const data: any = getValue();

// Use
const data: unknown = getValue();
if (typeof data === 'string') {
  // data is narrowed to string
}
```

---

## References

- [TypeScript ESLint Rules](https://typescript-eslint.io/rules/)
- [ESLint Docs](https://eslint.org/docs/rules/)
- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
- [Project ESLint Config](./eslint.config.js)

---

## Questions?

For questions about specific rules, check:
1. ESLint configuration: `eslint.config.js`
2. CI configuration: `.github/workflows/ci.yml`
3. TypeScript config: `tsconfig.json`
