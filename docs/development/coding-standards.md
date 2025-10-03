# 📝 Coding Standards

This document outlines the coding standards and best practices for the Vehicle Inspection System.

## General Principles

- **Readability First**: Code should be self-documenting and easy to understand
- **Consistency**: Follow established patterns throughout the codebase
- **Type Safety**: Use TypeScript features to catch errors at compile time
- **Performance**: Write efficient code that doesn't compromise readability
- **Maintainability**: Code should be easy to modify and extend

## File Naming Conventions

### Files and Directories
- **Use kebab-case** for all file and directory names
- **Examples**:
  ```
  ✅ user-profile.tsx
  ✅ quotation-form.tsx
  ✅ use-quotation-service.ts
  ❌ UserProfile.tsx
  ❌ quotationForm.tsx
  ```

### React Components
- **Use PascalCase** for component names
- **Match file name** with component name
- **Examples**:
  ```typescript
  // File: user-profile.tsx
  export function UserProfile() { }
  
  // File: quotation-form.tsx
  export function QuotationForm() { }
  ```

### Hooks
- **Prefix with `use`**
- **Use camelCase** for hook names
- **Examples**:
  ```typescript
  // File: use-quotation-service.ts
  export function useQuotationService() { }
  
  // File: use-vehicle-data.ts
  export function useVehicleData() { }
  ```

## TypeScript Standards

### Type Definitions
- **Use interfaces** for object shapes
- **Use types** for unions and computed types
- **Avoid `any`** - use `unknown` or specific types
- **Examples**:
  ```typescript
  // ✅ Good
  interface User {
    id: string;
    email: string;
    name: string;
  }
  
  type Status = 'pending' | 'approved' | 'rejected';
  
  // ❌ Avoid
  const user: any = {};
  ```

### Function Signatures
- **Explicit return types** for public functions
- **Parameter types** for all function parameters
- **Examples**:
  ```typescript
  // ✅ Good
  function createUser(userData: CreateUserInput): Promise<User> {
    // implementation
  }
  
  // ❌ Avoid
  function createUser(userData) {
    // implementation
  }
  ```

### Generic Types
- **Use descriptive generic names**
- **Examples**:
  ```typescript
  // ✅ Good
  interface ApiResponse<TData> {
    data: TData;
    status: number;
  }
  
  // ❌ Avoid
  interface ApiResponse<T> {
    data: T;
    status: number;
  }
  ```

## React Standards

### Component Structure
```typescript
// 1. Imports
import React from 'react';
import { Button } from '@/components/ui/button';

// 2. Types/Interfaces
interface ComponentProps {
  title: string;
  onAction: () => void;
}

// 3. Component
export function Component({ title, onAction }: ComponentProps) {
  // 4. Hooks
  const [state, setState] = useState('');
  
  // 5. Event handlers
  const handleClick = () => {
    onAction();
  };
  
  // 6. Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick}>Action</Button>
    </div>
  );
}
```

### Hooks Usage
- **Custom hooks** for reusable logic
- **Use `useCallback`** for event handlers passed as props
- **Use `useMemo`** for expensive calculations
- **Examples**:
  ```typescript
  // ✅ Good
  const handleSubmit = useCallback((data: FormData) => {
    onSubmit(data);
  }, [onSubmit]);
  
  const expensiveValue = useMemo(() => {
    return calculateExpensiveValue(data);
  }, [data]);
  ```

### State Management
- **Local state** for component-specific data
- **Context** for shared state within component trees
- **Zustand** for global state management
- **Examples**:
  ```typescript
  // ✅ Local state
  const [isOpen, setIsOpen] = useState(false);
  
  // ✅ Global state
  const { quotations, fetchQuotations } = useQuotationStore();
  ```

## API Standards

### Route Handlers
```typescript
// 1. Imports
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-client';

// 2. Handler
export async function GET(request: NextRequest) {
  try {
    // 3. Validation
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }
    
    // 4. Business logic
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('table')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // 5. Response
    return NextResponse.json({ data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Error Handling
- **Consistent error responses**
- **Proper HTTP status codes**
- **Logging for debugging**
- **Examples**:
  ```typescript
  // ✅ Good
  try {
    const result = await operation();
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Operation failed:', error);
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
  ```

## Database Standards

### Query Patterns
- **Use service client** for server-side operations
- **Use regular client** for client-side operations
- **Handle errors** consistently
- **Examples**:
  ```typescript
  // ✅ Server-side
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('quotations')
    .select('*')
    .eq('status', 'pending');
  
  if (error) {
    throw new DatabaseError(error.message);
  }
  ```

### Migration Standards
- **Descriptive migration names**
- **Backward compatible changes**
- **Rollback procedures**
- **Examples**:
  ```sql
  -- Migration: 20250130_add_quotation_status_index.sql
  CREATE INDEX IF NOT EXISTS idx_quotations_status 
  ON quotations(status);
  ```

## Styling Standards

### Tailwind CSS
- **Use utility classes** for styling
- **Group related classes** together
- **Use responsive prefixes**
- **Examples**:
  ```tsx
  // ✅ Good
  <div className="flex flex-col space-y-4 p-6 bg-white rounded-lg shadow-sm md:flex-row md:space-y-0 md:space-x-4">
    <Button className="w-full md:w-auto">Action</Button>
  </div>
  ```

### Component Styling
- **Use CSS modules** for complex styles
- **Use styled-components** sparingly
- **Follow design system** patterns
- **Examples**:
  ```tsx
  // ✅ Good - using design system
  <Button variant="primary" size="lg">
    Submit
  </Button>
  ```

## Testing Standards

### Unit Tests
- **Test behavior, not implementation**
- **Use descriptive test names**
- **Mock external dependencies**
- **Examples**:
  ```typescript
  // ✅ Good
  describe('QuotationForm', () => {
    it('should validate required fields', async () => {
      render(<QuotationForm onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });
  ```

### Integration Tests
- **Test complete workflows**
- **Use test database**
- **Clean up after tests**
- **Examples**:
  ```typescript
  // ✅ Good
  describe('Quotation API', () => {
    it('should create quotation and send email', async () => {
      const quotationData = { /* test data */ };
      
      const response = await request(app)
        .post('/api/quotations')
        .send(quotationData);
      
      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject(quotationData);
    });
  });
  ```

## Documentation Standards

### Code Comments
- **Explain why, not what**
- **Use JSDoc** for public functions
- **Keep comments up to date**
- **Examples**:
  ```typescript
  /**
   * Creates a new quotation with pricing calculations
   * @param input - Quotation input data
   * @returns Promise resolving to created quotation
   * @throws {ValidationError} When input data is invalid
   */
  async function createQuotation(input: CreateQuotationInput): Promise<Quotation> {
    // Validate input data
    const validatedInput = validateQuotationInput(input);
    
    // Calculate pricing based on service type and duration
    const pricing = await calculatePricing(validatedInput);
    
    // Create quotation record
    return quotationRepository.create({
      ...validatedInput,
      ...pricing
    });
  }
  ```

### README Files
- **Clear project description**
- **Setup instructions**
- **Usage examples**
- **Contributing guidelines**

## Performance Standards

### Bundle Size
- **Keep components small** (< 500 lines)
- **Use dynamic imports** for large components
- **Optimize images** and assets
- **Examples**:
  ```typescript
  // ✅ Good - dynamic import
  const HeavyComponent = lazy(() => import('./HeavyComponent'));
  
  // ✅ Good - code splitting
  const AdminPanel = dynamic(() => import('./AdminPanel'), {
    loading: () => <Skeleton />
  });
  ```

### Database Queries
- **Use indexes** for frequently queried columns
- **Avoid N+1 queries**
- **Use joins** instead of multiple queries
- **Examples**:
  ```typescript
  // ✅ Good - single query with join
  const { data } = await supabase
    .from('quotations')
    .select(`
      *,
      quotation_items(*),
      customers(*)
    `)
    .eq('status', 'pending');
  
  // ❌ Avoid - N+1 queries
  const quotations = await supabase.from('quotations').select('*');
  for (const quotation of quotations) {
    const items = await supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', quotation.id);
  }
  ```

## Security Standards

### Input Validation
- **Validate all inputs**
- **Sanitize user data**
- **Use Zod schemas**
- **Examples**:
  ```typescript
  // ✅ Good
  const quotationSchema = z.object({
    customerName: z.string().min(1).max(100),
    email: z.string().email(),
    amount: z.number().positive()
  });
  
  const validatedData = quotationSchema.parse(inputData);
  ```

### Authentication
- **Check authentication** in API routes
- **Use RLS policies** in database
- **Validate permissions**
- **Examples**:
  ```typescript
  // ✅ Good
  export async function GET(request: NextRequest) {
    const user = await validateAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Continue with authenticated logic
  }
  ```

## Git Standards

### Commit Messages
- **Use conventional commits**
- **Be descriptive and concise**
- **Examples**:
  ```
  feat: add quotation approval workflow
  fix: resolve email template rendering issue
  docs: update API documentation
  refactor: extract quotation service logic
  ```

### Branch Naming
- **Use descriptive branch names**
- **Include issue numbers**
- **Examples**:
  ```
  feature/quotation-approval-workflow
  fix/email-template-rendering
  refactor/extract-quotation-service
  ```

---

*Coding Standards - Last Updated: January 30, 2025*
