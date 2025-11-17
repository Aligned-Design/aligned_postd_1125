import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM APIs in tests
    environment: 'jsdom',
    // Global test setup
    globals: true,
    // Default test timeout (10 seconds for async operations)
    testTimeout: 10000,
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['client/**/*.{ts,tsx}', 'server/**/*.ts'],
      exclude: [
        'node_modules/',
        'client/__tests__/',
        'server/__tests__/',
        'dist/',
        '.next/',
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    // Test include patterns
    include: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    // Setup files
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'client'),
      '@shared': resolve(__dirname, 'shared'),
    },
  },
});
