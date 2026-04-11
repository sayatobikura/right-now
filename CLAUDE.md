# Right Now — AI-Powered Personal Focus Dashboard

## What This Is
A personal productivity tool that answers: "What should I be doing right now?"
Combines lightweight task capture with Claude AI-powered prioritization to surface the most important thing to focus on.

## Architecture
- **Pure static site** — no backend, no serverless functions
- **BYOK (Bring Your Own Key)** — users enter their own Claude API key
- API key stored in localStorage, sent directly to Anthropic API from browser
- Task data stored in localStorage
- Hosted on Vercel free tier (static deploy)

## Tech Stack
- React 18 + TypeScript
- Tailwind CSS (dark theme by default, light theme class available)
- Vite for build
- Claude Sonnet API for AI prioritization (model: claude-sonnet-4-20250514)
- No state management library — React Context + useReducer

## Project Structure
```
src/
├── components/       # React UI components
│   ├── SetupScreen   # First-run API key onboarding
│   ├── Header        # Nav, clock, timezone, settings dropdown
│   ├── QuickAdd      # Task capture bar (expand for priority/deadline/category)
│   ├── FocusCard     # Hero card — AI-recommended current task
│   ├── UpNext        # Ranked queue of next 3-5 tasks
│   ├── ProgressBar   # Daily completion tracker
│   ├── TaskList      # Full CRUD view with filter tabs
│   └── EmptyState    # No-tasks placeholder
├── services/         # Business logic (no React dependency)
│   ├── TaskService   # Task CRUD + localStorage persistence
│   ├── AIService     # Claude API integration + prompt engineering
│   └── SettingsService # API key management
├── hooks/            # Custom React hooks
│   └── useApp        # useTasks, useAI, useApiKey, useClock
├── types/            # TypeScript type definitions
│   └── index         # Task, AISuggestion, Priority, Category, etc.
├── App.tsx           # Main app — routing between dashboard/tasks/setup
├── main.tsx          # Entry point
└── index.css         # CSS variables (theme tokens) + Tailwind directives
```

## Key Design Decisions
- One-screen app: Focus Dashboard is the primary view, Task List is secondary
- AI-first prioritization: Claude decides what matters, not manual drag-and-drop
- Tasks have: title, priority (high/med/low), category (work/personal/self-dev), deadline, status (open/completed/skipped)
- AI prompt includes: all open tasks, current time/timezone, day of week, time-of-day context
- API calls use `anthropic-dangerous-direct-browser-access` header for CORS

## Commands
```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Type-check + production build
npm run preview  # Preview production build
```

## Theme System
CSS variables defined in `src/index.css`. Dark theme is default (:root), light theme via `.light` class on html.
Tailwind config maps to these variables (e.g., `bg-surface-0`, `text-text-primary`, `text-accent`).

## Current Status (MVP)
- [x] Week 1: Task CRUD + localStorage + responsive layout
- [x] Week 2: Claude API integration + BYOK setup + AI ranking
- [ ] Week 3: Polish — animations, swipe gestures, dark/light toggle
- [ ] Week 4: PWA, timezone edge cases, offline fallback, deploy

## Coding Conventions
- Functional components only, no class components
- Custom hooks in src/hooks/ for shared state logic
- Services in src/services/ are plain TypeScript (no React imports)
- Tailwind for all styling, no separate CSS files per component
- SVG icons inline (no icon library)
