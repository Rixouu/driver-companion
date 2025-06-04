import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test to prevent test pollution
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    // Add other useSearchParams methods if needed, e.g., getAll, has, etc.
  }),
  usePathname: () => '/mock-pathname', // Default mock pathname
  useParams: () => ({}), // Default mock params
}));

// Mock Next.js Link component
vi.mock('next/link', () => {
  // A simple functional component mock for next/link
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    // In a test environment, you might not need actual navigation,
    // but you can spy on props or render children directly.
    return children;
  };
  return {
    __esModule: true,
    default: MockLink,
  };
});


// Mock environment variables (adjust as necessary for your project)
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://mock.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'mock-anon-key');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'mock-service-role-key');

// You can add other global mocks or setup here, e.g.:
// - Mocking global fetch
// - Setting up MSW (Mock Service Worker) for API mocking
// - Mocking other third-party libraries used globally

console.log('Global test setup loaded.'); 