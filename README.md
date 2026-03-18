# 🎓 Text-to-Learn — AI-Powered Course Generator

> Transform any topic into a complete, structured learning experience in seconds using Google Gemini AI.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-ai--course--creator--akshitaryan604.replit.app-blue?style=for-the-badge)](https://ai-course-creator--akshitaryan604.replit.app)
[![GitHub](https://img.shields.io/badge/GitHub-akshit0006%2FAI--Course--Creator-black?style=for-the-badge&logo=github)](https://github.com/akshit0006/AI-Course-Creator)

---

## 🌟 What is Text-to-Learn?

Text-to-Learn is a full-stack AI-powered course generation platform. A user types any topic — *"Quantum Computing for Beginners"*, *"Advanced SQL Optimization"*, *"History of the Roman Empire"* — and the app uses **Google Gemini 2.5 Flash** to instantly generate a complete, multi-module structured course with:

- Rich lesson content (headings, explanations, code examples)
- Embedded YouTube video resources
- Interactive multiple-choice quizzes with instant feedback
- PDF export of any lesson
- Persistent storage tied to your account

No manual authoring. No templates. Just AI-generated education on demand.

---

## ✨ Features

### 🤖 AI Course Generation
- Automatically generates **4–6 modules** per course, each with **3–5 lessons**
- Gemini designs a curriculum that progresses logically from foundational to advanced
- Every course has a title, description, and relevant tags

### 📚 Rich Lesson Content
Each generated lesson contains a mix of content block types:
| Block Type | Description |
|---|---|
| **Heading** | Section titles for clear structure |
| **Paragraph** | 200+ word detailed explanations |
| **Code Block** | Syntax-highlighted, copyable code examples |
| **Video** | Embedded YouTube educational videos sourced via AI |
| **MCQ Quiz** | 4-option multiple choice with explanations for the correct answer |

### 🎬 Smart YouTube Integration
- Searches for real educational YouTube videos relevant to each lesson topic
- Uses the YouTube Data API when available, falls back to Gemini AI video suggestions
- If no video can be found, shows a direct YouTube search link — never a broken state

### 📄 PDF Download
- Export any lesson as a multi-page PDF
- Videos and interactive elements are cleanly excluded from the PDF
- Proper A4 formatting with margins and multi-page support

### 🔐 Authentication
- Secure login via **Replit Auth** (OpenID Connect / PKCE)
- All courses are tied to the authenticated user's account
- Sessions stored securely in PostgreSQL

### 💾 Persistent Storage
- All courses, modules, lessons, and generated content saved to **PostgreSQL**
- Courses are re-accessible anytime after login — nothing is lost between sessions

---

## 🏗️ Architecture & Technical Complexity

This is a production-grade **pnpm monorepo** with multiple interconnected packages, not a simple single-page app.

```
workspace/
├── artifacts/
│   ├── api-server/         # Express 5 REST API (Node.js + TypeScript)
│   └── text-to-learn/      # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI 3.0 specification (single source of truth)
│   ├── api-client-react/   # Auto-generated React Query hooks (via Orval)
│   ├── api-zod/            # Auto-generated Zod validation schemas (via Orval)
│   ├── db/                 # Drizzle ORM schema + PostgreSQL connection
│   ├── integrations-gemini-ai/  # Gemini AI client wrapper
│   └── replit-auth-web/    # Auth hook for the web frontend
└── scripts/
    └── post-merge.sh       # Automated environment reconciliation
```

### Why This Architecture is Complex

**OpenAPI-Driven Development** — The entire API contract is defined in a single `openapi.yaml` spec. From this, two separate libraries are auto-generated using Orval:
- `api-client-react` → Type-safe React Query hooks for every endpoint
- `api-zod` → Zod validation schemas used server-side for request validation

This means the frontend and backend share types — any API change is automatically reflected everywhere with zero manual type duplication.

**Multi-Package TypeScript Project References** — All packages use TypeScript `composite` mode with `references`, enabling incremental compilation across the monorepo. Each package is independently buildable but shares types across boundaries.

**Drizzle ORM Schema** — Database schema is defined in TypeScript using Drizzle ORM, with migrations managed via `drizzle-kit push`. The schema includes:
- `users` — Replit-authenticated users
- `sessions` — Secure auth sessions
- `courses` — AI-generated courses with metadata
- `modules` — Course modules with ordering
- `lessons` — Lessons with JSON content blocks, objectives, and generation state

---

## 🧠 AI Pipeline

### Course Generation Flow
```
User types topic
    ↓
POST /api/courses { topic }
    ↓
Gemini 2.5 Flash generates CourseOutline JSON
  (title, description, tags, modules[], lessons[])
    ↓
Stored in PostgreSQL (courses, modules, lessons tables)
    ↓
Course page rendered with lesson list
```

### Lesson Generation Flow
```
User clicks "Generate Lesson Content"
    ↓
POST /api/lessons/:id/generate
    ↓
Gemini 2.5 Flash generates LessonContent JSON
  (objectives[], content[] with mixed block types)
    ↓
Saved to lessons.content (JSONB column)
    ↓
Frontend renders each block by type
    ↓
Video blocks trigger GET /api/youtube/search
    ↓
YouTube API (or Gemini fallback) returns video ID
    ↓
YouTube iframe embedded in lesson
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS v4, Shadcn/UI |
| **Animations** | Framer Motion |
| **State/Data Fetching** | TanStack React Query v5 |
| **Routing** | Wouter (lightweight React router) |
| **Backend** | Express 5, Node.js 24, TypeScript |
| **Database** | PostgreSQL + Drizzle ORM |
| **AI** | Google Gemini 2.5 Flash |
| **Auth** | Replit Auth (OpenID Connect + PKCE) |
| **API Codegen** | Orval (OpenAPI → React Query + Zod) |
| **Validation** | Zod v4 |
| **PDF Export** | jsPDF v4 + html2canvas |
| **Monorepo** | pnpm workspaces |
| **Runtime** | Node.js 24 (ESM + CJS) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL database

### Environment Variables
```env
DATABASE_URL=postgresql://...
GEMINI_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=your_youtube_api_key   # Optional — AI fallback used if absent
SESSION_SECRET=a_long_random_string
REPL_ID=your_repl_id                   # For Replit Auth
```

### Installation

```bash
# Clone the repository
git clone https://github.com/akshit0006/AI-Course-Creator.git
cd AI-Course-Creator

# Install all dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Run API codegen (if you modify the OpenAPI spec)
pnpm --filter @workspace/api-spec run codegen
```

### Development

```bash
# Start the API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Start the frontend (port defined by PORT env var)
pnpm --filter @workspace/text-to-learn run dev
```

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/healthz` | No | Health check |
| GET | `/api/auth/user` | No | Current user info |
| GET | `/api/login` | No | OIDC login redirect |
| GET | `/api/callback` | No | OIDC callback handler |
| GET | `/api/logout` | No | Logout |
| GET | `/api/courses` | Yes | List user's courses |
| POST | `/api/courses` | Yes | Generate a new course |
| GET | `/api/courses/:id` | No | Get course with modules & lessons |
| DELETE | `/api/courses/:id` | Yes | Delete a course |
| GET | `/api/lessons/:id` | No | Get lesson with content |
| POST | `/api/lessons/:id/generate` | No | Generate AI content for lesson |
| GET | `/api/youtube/search?query=` | No | Search for educational video |

---

## 🎨 UI Highlights

- **Gradient hero page** with animated search input
- **Course dashboard** with module/lesson count cards
- **Split-panel lesson view** — sticky sidebar navigation + scrollable content
- **Animated lesson generation** state with spinner and messaging
- **Dark code blocks** with syntax labels and one-click copy
- **MCQ quizzes** with color-coded correct/incorrect feedback and explanations
- **Responsive design** — works on mobile, tablet, and desktop

---

## 🔒 Security

- Auth sessions stored server-side in PostgreSQL (not just cookies)
- Course deletion verifies ownership before allowing delete
- All user-facing API inputs validated with Zod schemas
- No secrets exposed to the frontend

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

*Built with Google Gemini AI, React, Express, and PostgreSQL.*
