# Right Now — AI-Powered Quick Notes & Journal

## What This Is
A personal note-taking app with AI-powered auto-organization. Capture thoughts quickly, and AI automatically tags, categorizes, and finds connections between your notes.

## Architecture
- **Pure static site** — no backend, no serverless functions
- **BYOK (Bring Your Own Key)** — users enter their own Claude or OpenAI API key
- API key stored in localStorage, sent directly to AI provider from browser
- Note data stored in localStorage
- Hosted on Vercel free tier (static deploy)

## Tech Stack
- React 19 + TypeScript
- Tailwind CSS v3 (dark theme by default, light theme class available)
- Vite for build
- Claude Sonnet or GPT-4o for AI organization (model selectable at setup)
- No state management library — React useReducer + hooks

## Project Structure
```
src/
├── components/       # React UI components
│   ├── SetupScreen   # First-run API key + provider onboarding
│   ├── Header        # Nav, search, clock, settings dropdown
│   ├── NoteEditor    # Quick note capture (expandable textarea)
│   ├── NoteCard      # Individual note card (pin, tags, category)
│   ├── NoteGrid      # Google Keep-style grid layout
│   ├── NoteDetail    # Full note view modal with edit + connections
│   ├── TagFilter     # Filter by tags and categories
│   ├── JournalView   # Timeline/chronological view grouped by day
│   └── EmptyState    # No-notes placeholder
├── services/         # Business logic (no React dependency)
│   ├── NoteService   # Note CRUD + localStorage persistence
│   ├── AIService     # AI auto-organize + connection discovery
│   └── SettingsService # API key + provider management
├── hooks/            # Custom React hooks
│   └── useApp        # useNotes, useAIOrganize, useApiKey, useClock
├── types/            # TypeScript type definitions
│   └── index         # Note, AIOrganizeResult, AIConnectionResult, etc.
├── App.tsx           # Main app — routing between notes/journal/setup
├── main.tsx          # Entry point
└── index.css         # CSS variables (theme tokens) + Tailwind directives
```

## Key Design Decisions
- Two views: Notes (grid) and Journal (timeline) — Notes is primary
- AI-first organization: AI auto-tags and categorizes on save
- Notes have: content, tags[], category, isPinned, timestamps
- AI finds connections between notes on demand (in detail view)
- Supports two AI providers: Claude (Anthropic) and ChatGPT (OpenAI)
- Claude uses `@anthropic-ai/sdk` with `dangerouslyAllowBrowser: true`
- OpenAI uses raw `fetch` to avoid extra SDK dependency

## Commands
```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Type-check + production build
npm run preview  # Preview production build
```

## Theme System
CSS variables defined in `src/index.css`. Dark theme is default (:root), light theme via `.light` class on html.
Tailwind config maps to these variables (e.g., `bg-surface-0`, `text-text-primary`, `text-accent`).

## Coding Conventions
- Functional components only, no class components
- Custom hooks in src/hooks/ for shared state logic
- Services in src/services/ are plain TypeScript (no React imports)
- Tailwind for all styling, no separate CSS files per component
- SVG icons inline (no icon library)
