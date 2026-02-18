---
applyTo:
  - "src/app/**/*.{ts,tsx}"
  - "!src/app/api/**"
---

# App Router (Pages) Instructions

## Next.js App Router Guidelines

### File Conventions

- `page.tsx` - Page component (creates a route)
- `layout.tsx` - Layout component (wraps pages)
- `loading.tsx` - Loading UI (shown during navigation)
- `error.tsx` - Error UI (error boundary)
- `not-found.tsx` - 404 UI
- `route.ts` - API endpoint

### Page Components

**Always export as default**:
```typescript
// app/books/page.tsx
export default function BooksPage() {
  return <div>Books</div>
}
```

**Add metadata for SEO**:
```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Books - Readmigo',
  description: 'Browse and discover books',
}

export default function BooksPage() {
  return <div>Books</div>
}
```

**Dynamic metadata**:
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = await fetchBook(params.id)
  return {
    title: book.title,
    description: book.description,
  }
}
```

### Layouts

- Layouts persist across navigation and maintain state
- Nest layouts for hierarchical UI
- Layouts are Server Components by default

```typescript
export default function BookLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="book-layout">
      <nav>...</nav>
      {children}
    </div>
  )
}
```

### Loading and Error States

**Loading UI**:
```typescript
// app/books/loading.tsx
export default function Loading() {
  return <div>Loading books...</div>
}
```

**Error Boundaries**:
```typescript
// app/books/error.tsx
'use client' // Error components must be Client Components

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### Data Fetching

**Server Components** (preferred):
```typescript
async function getBooks() {
  const res = await fetch('https://api.example.com/books', {
    next: { revalidate: 3600 } // Revalidate every hour
  })
  return res.json()
}

export default async function BooksPage() {
  const books = await getBooks()
  return <BookList books={books} />
}
```

**Client Components** (when needed):
```typescript
'use client'

import { useQuery } from '@tanstack/react-query'

export function BookList() {
  const { data, isLoading } = useQuery({
    queryKey: ['books'],
    queryFn: fetchBooks,
  })
  
  if (isLoading) return <div>Loading...</div>
  return <div>{/* render books */}</div>
}
```

### Route Parameters

**Dynamic Routes**:
```typescript
// app/books/[id]/page.tsx
interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function BookPage({ params }: Props) {
  const { id } = await params
  const book = await fetchBook(id)
  return <BookDetail book={book} />
}
```

### Parallel and Intercepting Routes

- Use `@folder` for parallel routes (slots)
- Use `(..)folder` for intercepting routes
- Refer to Next.js documentation for advanced routing patterns

### Internationalization

- Middleware handles locale routing
- Use `useTranslations` for client components
- Use `getTranslations` for server components

```typescript
// Server Component
import { getTranslations } from 'next-intl/server'

export default async function Page() {
  const t = await getTranslations('Books')
  return <h1>{t('title')}</h1>
}

// Client Component
'use client'
import { useTranslations } from 'next-intl'

export function BookHeader() {
  const t = useTranslations('Books')
  return <h1>{t('title')}</h1>
}
```

### Best Practices

1. **Server Components by default**: Only use client components when necessary
2. **Streaming**: Use Suspense boundaries for better loading UX
3. **Caching**: Configure fetch with appropriate cache strategies
4. **Images**: Always use next/image for optimized images
5. **Links**: Use next/link for client-side navigation
6. **Font Optimization**: Use next/font for optimized font loading
