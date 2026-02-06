# Readmigo Web

[![CI](https://github.com/readmigo/web/actions/workflows/ci.yml/badge.svg)](https://github.com/readmigo/web/actions/workflows/ci.yml)

Web application for Readmigo - AI-powered English reading companion.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Authentication**: NextAuth.js

## Features

- Book discovery and browsing
- Online reading with AI assistance
- Vocabulary management
- Reading progress tracking
- User profile and settings

## Project Structure

```
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components
│   ├── lib/             # Utilities and helpers
│   ├── stores/          # Zustand stores
│   └── styles/          # Global styles
└── public/              # Static assets
```

## Online Services

| Environment | URL |
|-------------|-----|
| Production | https://app.readmigo.com |

## Development

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local

# Start development server
pnpm dev
```

## Deployment

Deployed on Vercel with automatic deployments from main branch.
