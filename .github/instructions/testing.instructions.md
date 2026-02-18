---
applyTo:
  - "**/*.test.{ts,tsx}"
  - "**/*.spec.{ts,tsx}"
  - "e2e/**/*.{ts,tsx}"
  - "src/test/**/*.{ts,tsx}"
---

# Testing Instructions

## Testing Philosophy

- Test behavior, not implementation
- Write tests that give confidence in the code
- Keep tests simple and readable
- Test edge cases and error scenarios

## Unit Testing with Vitest

### Setup

- Tests are run with Vitest
- Use Testing Library for React components
- Place test files adjacent to the code they test

### Component Testing

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)
    
    const button = screen.getByRole('button', { name: /submit/i })
    await user.click(button)
    
    expect(screen.getByText(/success/i)).toBeInTheDocument()
  })
})
```

### Testing Library Best Practices

1. **Query Priority**:
   - Prefer `getByRole` for accessibility
   - Use `getByLabelText` for form fields
   - Use `getByText` for static text
   - Avoid `getByTestId` unless necessary

2. **User Interactions**:
   - Use `@testing-library/user-event` for realistic user interactions
   - Always `await` user interactions
   - Test keyboard navigation when applicable

3. **Async Testing**:
   - Use `findBy*` queries for async content
   - Use `waitFor` for complex async scenarios
   - Set appropriate timeouts for slow operations

### Mocking

**Mock modules**:
```typescript
import { vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  fetchBooks: vi.fn(() => Promise.resolve([{ id: '1', title: 'Test' }]))
}))
```

**Mock hooks**:
```typescript
import * as nextIntl from 'next-intl'

vi.spyOn(nextIntl, 'useTranslations').mockReturnValue((key: string) => key)
```

**Mock fetch**:
```typescript
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' }),
  } as Response)
)
```

### Testing Utilities

Create test utilities in `src/test/` for reusable helpers:

```typescript
// src/test/utils.tsx
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}
```

## E2E Testing with Playwright

### File Organization

- Place E2E tests in `e2e/` directory
- Use descriptive file names (e.g., `book-reading.spec.ts`)
- Group related tests in the same file

### Writing E2E Tests

```typescript
import { test, expect } from '@playwright/test'

test.describe('Book Reading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/books')
  })

  test('should open and read a book', async ({ page }) => {
    // Click on a book
    await page.getByRole('link', { name: /The Great Gatsby/i }).click()
    
    // Verify book page loaded
    await expect(page).toHaveURL(/\/books\/\d+/)
    await expect(page.getByRole('heading', { name: /The Great Gatsby/i })).toBeVisible()
    
    // Start reading
    await page.getByRole('button', { name: /Start Reading/i }).click()
    
    // Verify reader opened
    await expect(page.getByTestId('book-reader')).toBeVisible()
  })
})
```

### E2E Best Practices

1. **Locators**:
   - Use `getByRole` for semantic elements
   - Use `getByLabel` for form fields
   - Use `getByText` for text content
   - Use `getByTestId` only as last resort

2. **Assertions**:
   - Use auto-waiting assertions (`expect(locator).toBeVisible()`)
   - Verify critical user flows
   - Check for error states

3. **Test Independence**:
   - Each test should be independent
   - Clean up test data after tests
   - Don't rely on test execution order

4. **Performance**:
   - Use `page.goto()` wisely
   - Reuse authenticated sessions
   - Mock external APIs when appropriate

### Configuration

- `playwright.config.ts` - Local development testing
- `playwright.ci.config.ts` - CI environment testing
- `playwright.prod.config.ts` - Production environment testing

### Running Tests

```bash
# Unit tests
pnpm test              # Run once
pnpm test:watch        # Watch mode

# E2E tests
pnpm test:e2e          # Local environment
pnpm test:e2e:prod     # Production environment
```

## Testing Checklist

Before committing:
- [ ] All new code has corresponding tests
- [ ] Tests pass locally (`pnpm test`)
- [ ] Tests are readable and well-documented
- [ ] Edge cases are covered
- [ ] Error scenarios are tested
- [ ] Async operations are properly awaited
- [ ] Mocks are used appropriately
