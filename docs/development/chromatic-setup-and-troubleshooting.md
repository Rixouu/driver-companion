# Chromatic Setup and Troubleshooting

## 📊 Current Status

✅ **Chromatic Successfully Connected**  
- Project ID: `68da33ca2d5b652e029c5842`
- Published Storybook: https://68da33ca2d5b652e029c5842-lbayowqiqt.chromatic.com/
- Build 14: **224 stories across 28 components**

⚠️ **Issues Found**  
- **15 component errors** detected during build
- These are runtime errors in some component stories

## 🔗 Chromatic Links

- **Dashboard**: https://www.chromatic.com/setup?appId=68da33ca2d5b652e029c5842
- **Published Storybook**: https://68da33ca2d5b652e029c5842-lbayowqiqt.chromatic.com/
- **Manage Page**: https://www.chromatic.com/manage?appId=68da33ca2d5b652e029c5842

## 🚀 Running Chromatic

### Via NPM Script (Recommended)
```bash
npm run chromatic
```

### Direct Command
```bash
npx chromatic --project-token=<your-token>
```

### Environment Variable (Most Secure)
```bash
# Add to .env.local
CHROMATIC_PROJECT_TOKEN=your_token_here

# Then run
npm run chromatic
```

## 🐛 Fixing Component Errors

The 15 component errors found are likely caused by:

### 1. Missing Context Providers
Some components might need React Context providers (e.g., Auth, Supabase, Theme).

**Solution**: Add decorators in `.storybook/preview.ts`:

```typescript
import { ThemeProvider } from '../components/theme-provider'

export const decorators = [
  (Story) => (
    <ThemeProvider defaultTheme="light">
      <Story />
    </ThemeProvider>
  ),
]
```

### 2. Components That Require Authentication
Stories for components that use `useSession` or Supabase client.

**Solution**: Mock authentication in stories:

```typescript
export const MyStory: Story = {
  parameters: {
    // Mock authentication
    mockData: [
      {
        url: '/api/auth/session',
        method: 'GET',
        status: 200,
        response: { user: { id: '1', name: 'Test User' } },
      },
    ],
  },
}
```

### 3. Server Components Used in Stories
Next.js Server Components can't be used directly in Storybook.

**Solution**: Create client-only versions or mock the server data.

### 4. Missing Environment Variables
Components that rely on environment variables.

**Solution**: Add to `.storybook/preview.ts`:

```typescript
// Mock env vars
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key'
```

## 🔍 Debugging Errors

### 1. View Error Details in Chromatic Dashboard
1. Visit: https://www.chromatic.com/setup?appId=68da33ca2d5b652e029c5842
2. Click on "Build 14" or the latest build
3. Look for components marked with ❌
4. Click on each to see the error details

### 2. Test Locally
```bash
# Run Storybook locally to see errors
npm run storybook

# Visit http://localhost:6006
# Check browser console for errors
```

### 3. Check Specific Component Stories
Look at the stories that are likely causing errors:
- Components using `useRouter` from Next.js
- Components using Supabase hooks
- Components using authentication
- Components with complex data fetching

## 📝 Common Fixes

### Fix #1: Add Next.js Router Mock
```typescript
// .storybook/preview.ts
import { RouterContext } from 'next/dist/shared/lib/router-context'

export const decorators = [
  (Story) => (
    <RouterContext.Provider
      value={{
        pathname: '/',
        query: {},
        asPath: '/',
        push: () => Promise.resolve(true),
        replace: () => Promise.resolve(true),
        reload: () => {},
        back: () => {},
        prefetch: () => Promise.resolve(),
        beforePopState: () => {},
        events: {
          on: () => {},
          off: () => {},
          emit: () => {},
        },
        isFallback: false,
        isLocaleDomain: false,
        isReady: true,
        isPreview: false,
      }}
    >
      <Story />
    </RouterContext.Provider>
  ),
]
```

### Fix #2: Add Theme Provider
Your components use Tailwind classes that depend on theme context.

```typescript
// .storybook/preview.tsx
import { ThemeProvider } from '../components/theme-provider'

export const decorators = [
  (Story) => (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="min-h-screen bg-background text-foreground">
        <Story />
      </div>
    </ThemeProvider>
  ),
]
```

### Fix #3: Add Supabase Mock
For components that use Supabase:

```typescript
// Create .storybook/mocks/supabase.tsx
import { createContext } from 'react'

export const MockSupabaseContext = createContext(null)

export function MockSupabaseProvider({ children }) {
  return (
    <MockSupabaseContext.Provider value={{
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
    }}>
      {children}
    </MockSupabaseContext.Provider>
  )
}

// Then add to decorators in preview.ts
import { MockSupabaseProvider } from './mocks/supabase'

export const decorators = [
  (Story) => (
    <MockSupabaseProvider>
      <Story />
    </MockSupabaseProvider>
  ),
]
```

## 🎯 Next Steps

1. **Visit Chromatic Dashboard** to see specific error details
2. **Identify which 15 components** are failing
3. **Add appropriate mocks/decorators** based on error types
4. **Re-run Chromatic** to verify fixes:
   ```bash
   npm run chromatic
   ```

## 📊 TurboSnap Information

From the Chromatic output:
> TurboSnap not available until at least 10 builds are created from CI

TurboSnap will be enabled automatically after:
- 10 builds from CI/CD
- This will speed up visual testing by only testing changed components

## 🔄 CI/CD Integration

### GitHub Actions Setup
Create `.github/workflows/chromatic.yml`:

```yaml
name: Chromatic

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Chromatic
        uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitOnceUploaded: true
```

### Add Secret to GitHub
1. Go to your repo settings
2. Navigate to Secrets and variables → Actions
3. Add new secret: `CHROMATIC_PROJECT_TOKEN`
4. Value: Your Chromatic project token

## 📚 Resources

- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [Storybook Next.js Guide](https://storybook.js.org/docs/get-started/nextjs)
- [Visual Testing Best Practices](https://www.chromatic.com/docs/visual-testing)

## 🎨 Component Status

| Total Components | Stories | Errors | Success Rate |
|-----------------|---------|--------|--------------|
| 28              | 224     | 15     | 93.3%        |

**Great progress!** Most components are working. Just need to fix the 15 failing ones.

