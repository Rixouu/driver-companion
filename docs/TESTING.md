# Testing Guidelines for Vehicle Inspection System

This document outlines the testing strategy, guidelines for writing tests, and coverage requirements for the Vehicle Inspection System.

## Testing Strategy

[TODO: Describe the overall testing strategy. This should include:
- Levels of testing (Unit, Integration, End-to-End).
- Tools and frameworks used (e.g., Vitest, Testing Library, Playwright/Cypress).
- When and how each type of test should be written.
- Approach to mocking dependencies (e.g., MSW for API mocks, Supabase client mocks).
- CI/CD integration for automated testing.]

## Test Writing Guide

[TODO: Provide guidelines for writing effective tests. This should cover:
- Naming conventions for test files and descriptions.
- Best practices for structuring tests (Arrange-Act-Assert).
- How to write maintainable and readable tests.
- Specific examples for common scenarios (e.g., testing React components, API interactions, custom hooks).
- Guidelines for using test utilities and fixtures.]

### Unit Tests
[TODO: Specific guidance for unit tests.]

### Integration Tests
[TODO: Specific guidance for integration tests.]

### End-to-End (E2E) Tests
[TODO: Specific guidance for E2E tests.]

## Coverage Requirements

[TODO: Define the target test coverage. This should include:
- Overall coverage percentage goal (e.g., >80%).
- Coverage requirements for different parts of the application (e.g., critical business logic, UI components).
- How to measure and report test coverage.
- Process for addressing gaps in coverage.]

## Running Tests

[TODO: Provide instructions on how to run the different types of tests locally and in CI.]

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests (example)
# npm run test:e2e

# Generate coverage report
npm run coverage
```

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Test Structure](#test-structure)
- [Setting Up Testing](#setting-up-testing)
- [Writing Tests](#writing-tests)
- [Running Tests](#running-tests)
- [Coverage Requirements](#coverage-requirements)
- [Best Practices](#best-practices)

## Testing Philosophy

We follow the Testing Pyramid approach:
- **Many Unit Tests**: Fast, isolated tests for individual functions/components
- **Some Integration Tests**: Test interactions between components/services
- **Few E2E Tests**: Test critical user journeys

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── components/         # Component tests
│   ├── hooks/             # Custom hook tests
│   ├── services/          # Service function tests
│   └── utils/             # Utility function tests
├── integration/            # Integration tests
│   ├── api/              # API route tests
│   └── features/         # Feature-level tests
├── e2e/                   # End-to-end tests
│   ├── auth.test.ts      # Authentication flows
│   ├── vehicles.test.ts  # Vehicle management
│   └── inspections.test.ts # Inspection workflows
├── fixtures/              # Test data and mocks
├── utils/                 # Test utilities
└── setup.ts              # Test configuration
```

## Setting Up Testing

### 1. Install Dependencies

```bash
# Core testing dependencies
npm install -D vitest @vitejs/plugin-react jsdom

# Testing utilities
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Additional tools
npm install -D @faker-js/faker msw @testing-library/react-hooks
```

### 2. Configure Vitest

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

### 3. Create Test Setup

Create `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/test-path',
}))

// Mock environment variables
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
```

## Writing Tests

### Unit Tests

#### Component Testing

```typescript
// tests/unit/components/vehicles/vehicle-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VehicleForm } from '@/components/vehicles/vehicle-form'
import { vi } from 'vitest'

describe('VehicleForm', () => {
  const mockOnSubmit = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('should render all required fields', () => {
    render(<VehicleForm onSubmit={mockOnSubmit} />)
    
    expect(screen.getByLabelText(/vehicle name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/plate number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/brand/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/model/i)).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    render(<VehicleForm onSubmit={mockOnSubmit} />)
    
    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)
    
    expect(await screen.findByText(/vehicle name is required/i)).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should submit form with valid data', async () => {
    render(<VehicleForm onSubmit={mockOnSubmit} />)
    
    await user.type(screen.getByLabelText(/vehicle name/i), 'Test Vehicle')
    await user.type(screen.getByLabelText(/plate number/i), 'ABC-123')
    await user.selectOptions(screen.getByLabelText(/brand/i), 'Toyota')
    await user.type(screen.getByLabelText(/model/i), 'Camry')
    
    await user.click(screen.getByRole('button', { name: /submit/i }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Vehicle',
        plateNumber: 'ABC-123',
        brand: 'Toyota',
        model: 'Camry',
      })
    })
  })
})
```

#### Hook Testing

```typescript
// tests/unit/hooks/use-vehicles.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useVehicles } from '@/hooks/use-vehicles'
import { createWrapper } from '@/tests/utils/test-utils'

describe('useVehicles', () => {
  it('should fetch vehicles on mount', async () => {
    const { result } = renderHook(() => useVehicles(), {
      wrapper: createWrapper(),
    })
    
    expect(result.current.isLoading).toBe(true)
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    expect(result.current.vehicles).toHaveLength(3)
    expect(result.current.error).toBeNull()
  })
})
```

#### Service Testing

```typescript
// tests/unit/services/vehicles.test.ts
import { createVehicle, getVehicles } from '@/lib/services/vehicles'
import { createMockSupabaseClient } from '@/tests/utils/supabase-mock'

describe('Vehicle Service', () => {
  const mockSupabase = createMockSupabaseClient()

  describe('createVehicle', () => {
    it('should create a new vehicle', async () => {
      const vehicleData = {
        name: 'Test Vehicle',
        plateNumber: 'ABC-123',
        brand: 'Toyota',
        model: 'Camry',
      }
      
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{ id: '123', ...vehicleData }],
            error: null,
          }),
        }),
      })
      
      const result = await createVehicle(vehicleData)
      
      expect(result).toEqual({
        id: '123',
        ...vehicleData,
      })
    })
  })
})
```

### Integration Tests

```typescript
// tests/integration/api/vehicles.test.ts
import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/vehicles/route'

describe('/api/vehicles', () => {
  describe('GET', () => {
    it('should return vehicles for authenticated user', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
      })
      
      await GET(req)
      
      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.vehicles).toBeInstanceOf(Array)
    })
  })
})
```

### E2E Tests

```typescript
// tests/e2e/vehicles.test.ts
import { test, expect } from '@playwright/test'

test.describe('Vehicle Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should create a new vehicle', async ({ page }) => {
    await page.goto('/vehicles')
    await page.click('text=Add Vehicle')
    
    await page.fill('[name="name"]', 'E2E Test Vehicle')
    await page.fill('[name="plateNumber"]', 'E2E-123')
    await page.selectOption('[name="brand"]', 'Toyota')
    await page.fill('[name="model"]', 'Camry')
    
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Vehicle created successfully')).toBeVisible()
    await expect(page.locator('text=E2E Test Vehicle')).toBeVisible()
  })
})
```

## Running Tests

### Commands

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test"
  }
}
```

### Running Specific Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run only unit tests
npm run test:unit

# Run tests matching pattern
npm test vehicle

# Run tests in specific file
npm test vehicle-form.test.tsx
```

## Coverage Requirements

### Minimum Coverage Targets

- **Overall**: 80%
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Critical Path Coverage

These areas must have >90% coverage:
- Authentication flows
- Payment processing
- Data validation utilities
- API route handlers
- Core business logic

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

## Best Practices

### 1. Test Organization

- One test file per component/module
- Group related tests with `describe`
- Use clear, descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

### 2. Test Data

```typescript
// tests/fixtures/vehicles.ts
import { faker } from '@faker-js/faker'

export function createMockVehicle(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.vehicle.vehicle(),
    plateNumber: faker.vehicle.vrm(),
    brand: faker.vehicle.manufacturer(),
    model: faker.vehicle.model(),
    ...overrides,
  }
}
```

### 3. Custom Render

```typescript
// tests/utils/test-utils.tsx
import { render } from '@testing-library/react'
import { I18nProvider } from '@/lib/i18n/context'
import { ThemeProvider } from '@/components/theme-provider'

export function renderWithProviders(ui: React.ReactElement, options = {}) {
  return render(
    <ThemeProvider>
      <I18nProvider locale="en">
        {ui}
      </I18nProvider>
    </ThemeProvider>,
    options
  )
}
```

### 4. Mocking Best Practices

```typescript
// Mock only what you need
vi.mock('@/lib/supabase', () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
}))

// Restore mocks after tests
afterEach(() => {
  vi.restoreAllMocks()
})
```

### 5. Async Testing

```typescript
// Always use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})

// Use findBy queries for async elements
const element = await screen.findByRole('button', { name: /submit/i })
```

### 6. Accessibility Testing

```typescript
import { axe } from 'jest-axe'

it('should not have accessibility violations', async () => {
  const { container } = render(<VehicleForm />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test:run
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json
```

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Check path aliases in `vitest.config.ts`
   - Ensure tsconfig paths match

2. **Environment variable issues**
   - Mock in test setup
   - Use `vi.stubEnv()`

3. **Async test timeouts**
   - Increase timeout: `test('name', async () => {}, 10000)`
   - Check for unresolved promises

4. **React act() warnings**
   - Wrap state updates in `act()`
   - Use `waitFor` for async updates

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW (Mock Service Worker)](https://mswjs.io/)
- [Playwright](https://playwright.dev/) 