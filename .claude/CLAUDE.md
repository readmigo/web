# Readmigo Web Project Guidelines

## Project Overview

Next.js web application for Readmigo - AI-powered English reading companion.

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

## Development Rules

### Tech Stack

- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- State Management: Zustand
- Authentication: NextAuth.js

### Deployment

- Auto-deploy: Code pushed to GitHub will automatically deploy via Vercel
- Branch: `main` branch triggers production deployment

## Investigation & Problem Analysis

When investigating problems, output using this template:
```
问题的原因：xxx
解决的思路：xxx
修复的方案：xxx
```

## Online Services

| Environment | URL |
|-------------|-----|
| Production | https://app.readmigo.com |

## Readmigo Team Knowledge Base

所有 Readmigo 项目文档集中存储在：`/Users/HONGBGU/Documents/readmigo-repos/docs/`
当需要跨项目上下文（产品需求、架构决策、设计规范等）时，主动到 docs 目录读取相关文档。
