# Text-to-Learn: AI-Powered Course Generator

## Overview

Full-stack AI-powered course generation platform. Users enter any topic and get a complete structured course with modules, lessons, rich content blocks, video references, MCQ quizzes, and PDF download.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **AI**: Google Gemini via Replit AI Integrations (`@workspace/integrations-gemini-ai`)
- **Auth**: Replit Auth (OIDC/PKCE) via `@workspace/replit-auth-web`
- **Frontend**: React + Vite + Tailwind CSS + Shadcn/UI
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts/
├── api-server/             # Express API server
│   └── src/
│       ├── routes/         # health, auth, courses, lessons, youtube
│       ├── services/       # courseGenerator.ts (Gemini AI)
│       ├── lib/            # auth.ts (session management)
│       └── middlewares/    # authMiddleware.ts
└── text-to-learn/          # React + Vite frontend
    └── src/
        ├── pages/          # Home, Course, Lesson
        ├── components/     # Navbar, ContentBlocks
        └── App.tsx

lib/
├── api-spec/               # OpenAPI spec + Orval codegen config
├── api-client-react/       # Generated React Query hooks
├── api-zod/                # Generated Zod schemas
├── db/                     # Drizzle ORM schema + DB connection
│   └── src/schema/         # auth.ts, courses.ts
├── integrations-gemini-ai/ # Gemini AI client
└── replit-auth-web/        # Auth hook for web apps
```

## Key Features

1. **Course Generation**: POST /api/courses with `{ topic }` — Gemini generates 4-6 modules with 3-5 lessons each
2. **Lesson Content**: POST /api/lessons/:id/generate — Generates headings, paragraphs, code blocks, video queries, MCQs
3. **YouTube Integration**: GET /api/youtube/search?query=... — Returns video for embedding
4. **Auth**: Replit OIDC login, session stored in PostgreSQL
5. **PDF Export**: jsPDF + html2canvas captures lesson DOM
6. **Rich Lesson Renderer**: Supports heading, paragraph, code, video, mcq block types

## API Routes

- `GET /api/healthz` — health check
- `GET /api/auth/user` — current user
- `GET /api/login` — OIDC login redirect
- `GET /api/callback` — OIDC callback
- `GET /api/logout` — logout
- `GET /api/courses` — list user courses (auth required)
- `POST /api/courses` — generate course from topic (auth required)
- `GET /api/courses/:id` — course with modules and lessons
- `DELETE /api/courses/:id` — delete course (auth required)
- `GET /api/lessons/:id` — lesson with content blocks
- `POST /api/lessons/:id/generate` — generate AI content for lesson
- `GET /api/youtube/search?query=...` — YouTube video search

## Database Schema

- `users` — Replit auth users
- `sessions` — Auth sessions
- `courses` — User courses (title, description, topic, tags, userId)
- `modules` — Course modules (title, orderIndex, courseId)
- `lessons` — Module lessons (title, content JSON, objectives, isGenerated)

## Development

- API server: `pnpm --filter @workspace/api-server run dev`
- Frontend: `pnpm --filter @workspace/text-to-learn run dev`
- DB push: `pnpm --filter @workspace/db run push`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
