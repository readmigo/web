---
applyTo:
  - "src/app/api/**/*.ts"
---

# API Routes Instructions

## Next.js API Routes (App Router)

### File Structure

API routes in App Router use `route.ts` files:
```
app/
  api/
    books/
      route.ts        # /api/books
      [id]/
        route.ts      # /api/books/[id]
```

### HTTP Methods

Export named functions for each HTTP method:

```typescript
// app/api/books/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')
  
  // Fetch data
  const books = await fetchBooks(query)
  
  return NextResponse.json(books)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  // Validate and create
  const book = await createBook(body)
  
  return NextResponse.json(book, { status: 201 })
}
```

### Dynamic Routes

Access route parameters through the second argument:

```typescript
// app/api/books/[id]/route.ts
interface Params {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  const { id } = await params
  const book = await fetchBook(id)
  
  if (!book) {
    return NextResponse.json(
      { error: 'Book not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json(book)
}

export async function PATCH(
  request: NextRequest,
  { params }: Params
) {
  const { id } = await params
  const updates = await request.json()
  
  const book = await updateBook(id, updates)
  return NextResponse.json(book)
}

export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
  const { id } = await params
  await deleteBook(id)
  
  return new NextResponse(null, { status: 204 })
}
```

### Error Handling

Always handle errors and return appropriate status codes:

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }
    
    const book = await createBook(body)
    return NextResponse.json(book, { status: 201 })
    
  } catch (error) {
    console.error('Error creating book:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Authentication

Check authentication using NextAuth:

```typescript
import { auth } from '@/auth' // NextAuth configuration

export async function GET(request: NextRequest) {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // Proceed with authenticated request
  const data = await fetchUserData(session.user.id)
  return NextResponse.json(data)
}
```

### CORS and Headers

Set appropriate headers:

```typescript
export async function GET(request: NextRequest) {
  const data = await fetchData()
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
```

### Request Validation

Use Zod for request validation:

```typescript
import { z } from 'zod'

const createBookSchema = z.object({
  title: z.string().min(1).max(255),
  author: z.string().min(1).max(255),
  isbn: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createBookSchema.parse(body)
    
    const book = await createBook(validated)
    return NextResponse.json(book, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Response Types

Use proper TypeScript types:

```typescript
interface BookResponse {
  id: string
  title: string
  author: string
}

export async function GET(request: NextRequest): Promise<NextResponse<BookResponse[]>> {
  const books = await fetchBooks()
  return NextResponse.json(books)
}
```

### Best Practices

1. **Validation**: Always validate and sanitize input
2. **Error Handling**: Return appropriate HTTP status codes
3. **Authentication**: Check auth for protected endpoints
4. **Rate Limiting**: Consider implementing rate limiting for public APIs
5. **Logging**: Log errors for debugging (Sentry integration available)
6. **Type Safety**: Use TypeScript for request/response types
7. **Testing**: Write tests for API endpoints
8. **Documentation**: Document API endpoints and their contracts
