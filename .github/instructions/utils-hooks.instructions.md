---
applyTo:
  - "src/lib/**/*.{ts,tsx}"
  - "src/hooks/**/*.{ts,tsx}"
---

# Utilities and Hooks Instructions

## Library Code (src/lib/)

Utility functions and shared logic should be placed in `src/lib/`.

### Best Practices

1. **Pure Functions**: Prefer pure functions without side effects
2. **Type Safety**: Always use TypeScript with proper types
3. **Single Responsibility**: Each file should have a clear purpose
4. **Documentation**: Add JSDoc comments for exported functions
5. **Testing**: Write unit tests for all utilities

### Utility Function Example

```typescript
/**
 * Formats a number as a currency string
 * @param amount - The amount to format
 * @param currency - The currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}
```

### Common Utility Patterns

**String utilities**:
```typescript
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

**Array utilities**:
```typescript
export function groupBy<T, K extends keyof any>(
  array: T[],
  getKey: (item: T) => K
): Record<K, T[]> {
  return array.reduce((acc, item) => {
    const key = getKey(item)
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<K, T[]>)
}
```

**Date utilities**:
```typescript
import { format, parseISO } from 'date-fns'

export function formatDate(date: string | Date, formatString: string = 'PP'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatString)
}
```

## Custom Hooks (src/hooks/)

### Hook Guidelines

1. **Naming**: Always prefix with `use` (e.g., `useBooks`, `useDebounce`)
2. **Composition**: Build complex hooks from simpler ones
3. **Return Values**: Use consistent return patterns (object or array)
4. **Side Effects**: Clean up effects properly
5. **Testing**: Test hooks using `@testing-library/react-hooks` or in a component

### Custom Hook Example

```typescript
import { useState, useEffect } from 'react'

interface UseDebounceOptions {
  delay?: number
}

/**
 * Debounces a value
 * @param value - The value to debounce
 * @param options - Options including delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, options: UseDebounceOptions = {}): T {
  const { delay = 500 } = options
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

### Common Hook Patterns

**Data fetching hook**:
```typescript
import { useQuery } from '@tanstack/react-query'

export function useBook(id: string) {
  return useQuery({
    queryKey: ['books', id],
    queryFn: () => fetchBook(id),
    enabled: !!id,
  })
}
```

**Local storage hook**:
```typescript
import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error('Error writing to localStorage:', error)
    }
  }

  return [storedValue, setValue] as const
}
```

**Media query hook**:
```typescript
import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}
```

### Hook Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  it('should debounce value', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, { delay: 100 }),
      { initialProps: { value: 'initial' } }
    )

    expect(result.current).toBe('initial')

    rerender({ value: 'updated' })
    expect(result.current).toBe('initial')

    await waitFor(() => {
      expect(result.current).toBe('updated')
    }, { timeout: 200 })
  })
})
```

## API Client (src/lib/api/)

When creating API client code:

1. **Type Safety**: Define request/response types
2. **Error Handling**: Handle and type errors properly
3. **Reusability**: Create reusable fetch wrappers
4. **Configuration**: Use environment variables for API URLs

```typescript
// src/lib/api/client.ts
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new APIError(
      error.message || 'An error occurred',
      response.status,
      error
    )
  }

  return response.json()
}
```

## Validation (src/lib/validations/)

Use Zod for runtime validation:

```typescript
import { z } from 'zod'

export const bookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  author: z.string().min(1, 'Author is required').max(255),
  isbn: z.string().optional(),
  publishedYear: z.number().int().min(1000).max(9999).optional(),
})

export type Book = z.infer<typeof bookSchema>
```
