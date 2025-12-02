import { afterEach, beforeAll, afterAll, vi, beforeEach } from 'vitest';

// Set default test environment variables if not already set
// These are used by Supabase client initialization in tests
// Tests should use TEST_ prefixed env vars in CI, or fallback to localhost for local testing
if (!process.env.VITE_SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = process.env.TEST_SUPABASE_URL || 'http://localhost:54321';
}
if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // Create a dummy JWT token that will pass validation in tests
  // Format: header.payload.signature (base64 encoded JSON)
  // The payload needs to have role: "service_role"
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({ role: 'service_role', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64');
  const signature = 'test-signature';
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || `${header}.${payload}.${signature}`;
}
if (!process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.VITE_SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY || 'test-anon-key';
}

// Helper to create storage mock with actual data storage
const createStorageMock = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key]);
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
};

const localStorageMock = createStorageMock();
const sessionStorageMock = createStorageMock();

// Cleanup before each test
beforeEach(() => {
  localStorageMock.clear();
  sessionStorageMock.clear();
  vi.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
  // DOM cleanup
  document.body.innerHTML = '';
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Set localStorage and sessionStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as unknown as typeof IntersectionObserver;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as unknown as typeof ResizeObserver;

// Mock DragEvent if not available
if (typeof DragEvent === 'undefined') {
  (global as Record<string, unknown>).DragEvent = class DragEvent extends Event {
    dataTransfer: DataTransfer;
    constructor(type: string, eventInitDict?: EventInit) {
      super(type, eventInitDict);
      this.dataTransfer = {
        dropEffect: 'move',
        effectAllowed: 'move',
        files: [] as unknown as FileList,
        items: [] as unknown as DataTransferItemList,
        types: [],
        getData: vi.fn(),
        setData: vi.fn(),
        clearData: vi.fn(),
        setDragImage: vi.fn(),
      } as unknown as DataTransfer;
    }
  };
}

// Mock StorageEvent if not available
if (typeof StorageEvent === 'undefined') {
  (global as Record<string, unknown>).StorageEvent = class StorageEvent extends Event {
    key: string | null;
    newValue: string | null;
    oldValue: string | null;
    storageArea: Storage | null;
    url: string;

    constructor(type: string, eventInitDict?: StorageEventInit) {
      super(type, eventInitDict);
      this.key = eventInitDict?.key ?? null;
      this.newValue = eventInitDict?.newValue ?? null;
      this.oldValue = eventInitDict?.oldValue ?? null;
      this.storageArea = eventInitDict?.storageArea ?? null;
      this.url = eventInitDict?.url ?? '';
    }
  };
}

// Mock web-vitals module
vi.mock('web-vitals', () => ({
  onCLS: vi.fn((callback: (metric: { name: string; value: number; rating: string }) => void) =>
    callback({ name: 'CLS', value: 0.1, rating: 'good' })),
  onFID: vi.fn((callback: (metric: { name: string; value: number; rating: string }) => void) =>
    callback({ name: 'FID', value: 100, rating: 'good' })),
  onFCP: vi.fn((callback: (metric: { name: string; value: number; rating: string }) => void) =>
    callback({ name: 'FCP', value: 500, rating: 'good' })),
  onLCP: vi.fn((callback: (metric: { name: string; value: number; rating: string }) => void) =>
    callback({ name: 'LCP', value: 1000, rating: 'good' })),
  onTTFB: vi.fn((callback: (metric: { name: string; value: number; rating: string }) => void) =>
    callback({ name: 'TTFB', value: 300, rating: 'good' })),
}));

// Mock Sentry module
vi.mock('@sentry/react', async () => {
  const actual = await vi.importActual('@sentry/react');
  return {
    ...actual,
    init: vi.fn(),
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    setUser: vi.fn(),
    ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
    reactRouterV6Instrumentation: vi.fn(() => ({})),
    Replay: vi.fn(function() {
      return {};
    }),
  };
});

vi.mock('@sentry/tracing', () => ({
  BrowserTracing: vi.fn(() => ({})),
}));

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn((...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
        args[0].includes('Warning:'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  });
});

afterAll(() => {
  console.error = originalError;
});
