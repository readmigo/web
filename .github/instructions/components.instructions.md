---
applyTo:
  - "src/components/**/*.{ts,tsx}"
  - "src/features/**/components/**/*.{ts,tsx}"
---

# Component Development Instructions

## Component Guidelines

### File Organization

- Place shared/reusable components in `src/components/`
- Place feature-specific components in `src/features/[feature]/components/`
- Use PascalCase for component file names (e.g., `UserProfile.tsx`)
- Co-locate tests with components (e.g., `UserProfile.test.tsx`)

### Component Structure

**Server Components (default)**:
```typescript
// No "use client" directive
export default function MyComponent({ prop }: Props) {
  // Can fetch data directly
  // Cannot use hooks, event handlers, or browser APIs
  return <div>...</div>
}
```

**Client Components**:
```typescript
"use client"

import { useState } from "react"

export function MyClientComponent({ prop }: Props) {
  const [state, setState] = useState()
  // Can use hooks, event handlers, browser APIs
  return <div onClick={...}>...</div>
}
```

### Best Practices

1. **Prefer Server Components**: Use server components by default, only add `"use client"` when you need:
   - State (useState, useReducer)
   - Effects (useEffect)
   - Event handlers (onClick, onChange, etc.)
   - Browser APIs (localStorage, window, etc.)
   - Custom hooks that use the above

2. **Type Safety**:
   - Always define proper prop types
   - Use interface or type for component props
   - Export props type if component is reusable

   ```typescript
   interface UserProfileProps {
     userId: string
     onUpdate?: () => void
   }
   
   export function UserProfile({ userId, onUpdate }: UserProfileProps) {
     // ...
   }
   ```

3. **Styling**:
   - Use Tailwind CSS utility classes
   - Use `cn()` from `@/lib/utils` to merge conditional classes
   - Follow mobile-first responsive design
   - Use Radix UI components for accessible UI patterns

   ```typescript
   import { cn } from "@/lib/utils"
   
   <div className={cn(
     "base-classes",
     variant === "primary" && "variant-classes",
     className
   )}>
   ```

4. **Accessibility**:
   - Use semantic HTML elements
   - Include proper ARIA labels when needed
   - Ensure keyboard navigation works
   - Use Radix UI components which have built-in accessibility

5. **Performance**:
   - Memoize expensive computations with useMemo
   - Memoize callbacks passed to children with useCallback
   - Use dynamic imports for heavy components
   - Optimize images with next/image

6. **Internationalization**:
   - Never hardcode user-facing strings
   - Use next-intl for all text
   
   ```typescript
   import { useTranslations } from 'next-intl'
   
   function MyComponent() {
     const t = useTranslations('ComponentName')
     return <button>{t('submit')}</button>
   }
   ```

### UI Components with Radix

When using Radix UI components:
- Import from the specific Radix package
- Follow Radix composition patterns
- Apply Tailwind styles to Radix primitives
- Refer to existing component implementations in `src/components/ui/`

### Testing Components

1. Focus on user behavior, not implementation
2. Use Testing Library queries (`getByRole`, `getByLabelText`, etc.)
3. Test accessibility (roles, labels)
4. Test user interactions (clicks, typing, etc.)
5. Mock external dependencies and API calls

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('MyComponent', () => {
  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)
    
    const button = screen.getByRole('button', { name: /submit/i })
    await user.click(button)
    
    expect(screen.getByText(/success/i)).toBeInTheDocument()
  })
})
```

### Common Patterns

**Form Components**:
- Use react-hook-form for form state
- Use zod for validation with @hookform/resolvers
- Include proper error messages and validation feedback

**Loading States**:
- Show loading indicators for async operations
- Use Suspense boundaries where appropriate
- Provide fallback UI for better UX

**Error Handling**:
- Display user-friendly error messages
- Use error boundaries for component-level errors
- Log errors appropriately (Sentry integration available)
