# Copilot Instructions for Readmigo Web

## Project Overview

Readmigo Web is an AI-powered English reading companion built with Next.js 14. This is the web application that provides book discovery, online reading with AI assistance, vocabulary management, and reading progress tracking.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Authentication**: NextAuth.js v5
- **Testing**: Vitest (unit tests), Playwright (E2E tests)
- **Package Manager**: pnpm v9.14.2
- **Node Version**: 20.x
- **Deployment**: Vercel (auto-deploy from main branch)

## Project Structure

```
├── src/
│   ├── app/             # Next.js App Router pages and routes
│   ├── components/      # Reusable React components
│   ├── features/        # Feature-specific code and components
│   ├── lib/             # Utilities, helpers, and shared logic
│   ├── stores/          # Zustand state management stores
│   ├── hooks/           # Custom React hooks
│   ├── i18n/            # Internationalization configuration (next-intl)
│   ├── types/           # TypeScript type definitions
│   └── test/            # Test utilities and helpers
├── public/              # Static assets
├── e2e/                 # End-to-end tests (Playwright)
├── docs/                # Documentation
└── messages/            # i18n message files
```

## Development Guidelines

### Code Style and Conventions

1. **TypeScript**:
   - Always use TypeScript with strict mode
   - Prefer type inference where possible, but be explicit for function parameters and return types
   - Use proper interfaces and types, avoid `any`
   - Path alias: Use `@/*` for imports from `src/`

2. **React and Next.js**:
   - Use React Server Components by default (Next.js App Router)
   - Use Client Components only when necessary (mark with `"use client"`)
   - Follow Next.js App Router conventions for routing and layouts
   - Use proper metadata exports for SEO
   - Prefer `next/link` for navigation, `next/image` for images

3. **Styling**:
   - Use Tailwind CSS utility classes
   - Follow mobile-first responsive design approach
   - Use the `cn()` utility function from `lib/utils` to merge class names
   - Use Radix UI components from `@radix-ui/*` for accessible UI components

4. **State Management**:
   - Use Zustand stores for global client state
   - Keep stores in `src/stores/`
   - Use React hooks for local component state
   - Use TanStack Query (@tanstack/react-query) for server state

5. **Internationalization**:
   - Use next-intl for all user-facing strings
   - Message files are in `messages/` directory
   - Always use translation keys, never hardcode strings

### Development Commands

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local

# Start development server (runs on port 3001)
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint

# Type checking
pnpm typecheck

# Run unit tests
pnpm test

# Run unit tests in watch mode
pnpm test:watch

# Run E2E tests (local)
pnpm test:e2e

# Run E2E tests (production)
pnpm test:e2e:prod
```

### Testing Guidelines

1. **Unit Tests**:
   - Write unit tests using Vitest
   - Place test files adjacent to the code they test (e.g., `utils.ts` → `utils.test.ts`)
   - Use Testing Library for component tests
   - Focus on testing behavior, not implementation details

2. **E2E Tests**:
   - Write E2E tests using Playwright
   - Place E2E tests in the `e2e/` directory
   - Test critical user flows and workflows
   - Run E2E tests before committing major features

### Code Quality Checks

Before committing, always run:
1. `pnpm lint` - Check for linting errors
2. `pnpm typecheck` - Verify TypeScript types
3. `pnpm test` - Run unit tests
4. `pnpm build` - Ensure the project builds successfully

### Important Rules

1. **Never modify**:
   - Files in `.next/` directory (build output)
   - `pnpm-lock.yaml` manually (use pnpm commands)
   - Configuration in `.vercelignore` without understanding deployment impact

2. **Security**:
   - Never commit secrets or API keys
   - Use environment variables for sensitive data
   - Follow the `.env.example` template for environment setup
   - Sentry is configured for error tracking (check `sentry.*.config.ts`)

3. **Dependencies**:
   - Use `pnpm add <package>` to add dependencies
   - Check for security vulnerabilities before adding new packages
   - Prefer stable, well-maintained packages
   - Consider bundle size impact

4. **Git and Deployment**:
   - Main branch auto-deploys to production via Vercel
   - Keep commits focused and atomic
   - Write clear commit messages
   - Test locally before pushing to main

5. **Performance**:
   - Optimize images (use next/image)
   - Code-split large components
   - Use dynamic imports for heavy libraries
   - Monitor bundle size

### API and Services

- **Production URL**: https://app.readmigo.com
- **Authentication**: Handled by NextAuth.js
- **Error Tracking**: Sentry integration configured
- **Analytics**: Vercel Analytics and Speed Insights enabled

### Common Patterns

1. **Component Structure**:
```typescript
// Server Component (default)
export default function MyPage() {
  return <div>...</div>
}

// Client Component (when needed)
"use client"
export function MyClientComponent() {
  const [state, setState] = useState()
  return <div>...</div>
}
```

2. **API Routes** (App Router):
```typescript
// src/app/api/[endpoint]/route.ts
export async function GET(request: Request) {
  // Handle GET request
}
```

3. **Translations**:
```typescript
import { useTranslations } from 'next-intl'

function MyComponent() {
  const t = useTranslations('Namespace')
  return <div>{t('key')}</div>
}
```

### Special Files

- `patches/epubjs.patch` - Custom patch for epub.js library (managed via pnpm)
- `middleware.ts` - Next.js middleware for authentication and i18n
- `instrumentation.ts` - Application instrumentation setup

## Getting Help

- Check existing documentation in `docs/` directory
- Review similar patterns in the codebase
- Refer to Next.js 14 App Router documentation
- Check Radix UI documentation for component APIs
