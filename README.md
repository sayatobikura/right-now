# ⚡ Right Now

**AI-Powered Personal Focus Dashboard** — Know what to do right now.

Right Now is a personal productivity tool that answers one question: *"What should I be doing right now?"* It combines lightweight task capture with Claude AI-powered prioritization to surface the single most important thing to focus on at any given moment.

## Features

- **🎯 Focus Dashboard** — AI-ranked "do this now" with reasoning
- **⚡ Quick Add** — Capture tasks in under 5 seconds
- **🤖 AI Prioritization** — Claude Sonnet ranks by deadline, priority, time-of-day, and context
- **🌏 Timezone-Aware** — Works across US/Japan or any timezone
- **🔑 BYOK** — Bring Your Own API Key. Your data stays in your browser.
- **📱 Responsive** — Works on phone and desktop

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and enter your Claude API key.

### Get a Claude API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Create an account (you get $5 free credits)
3. Generate an API key
4. Paste it into Right Now's setup screen

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| AI | Claude Sonnet (via Anthropic API) |
| Storage | localStorage (browser) |
| Build | Vite |
| Hosting | Vercel (static) |

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/right-now)

No environment variables needed — each user enters their own API key.

## Architecture

```
Browser
├── React UI (Focus Dashboard / Task List)
├── TaskService (CRUD → localStorage)
├── AIService (→ Anthropic API directly)
└── SettingsService (API key → localStorage)
```

No backend. No server. Pure static site. Each user's API key stays in their browser and is only sent to Anthropic's API over HTTPS.

## Project Structure

```
src/
├── components/
│   ├── SetupScreen.tsx    # First-run API key onboarding
│   ├── Header.tsx         # Nav, clock, settings
│   ├── QuickAdd.tsx       # Task capture bar
│   ├── FocusCard.tsx      # Hero focus task card
│   ├── UpNext.tsx         # Ranked task queue
│   ├── ProgressBar.tsx    # Daily completion tracker
│   ├── TaskList.tsx       # Full task list view
│   └── EmptyState.tsx     # No-tasks placeholder
├── services/
│   ├── TaskService.ts     # Task CRUD + localStorage
│   ├── AIService.ts       # Claude API integration
│   └── SettingsService.ts # API key management
├── hooks/
│   └── useApp.ts          # Custom React hooks
├── types/
│   └── index.ts           # TypeScript types
├── App.tsx                # Main app component
├── main.tsx               # Entry point
└── index.css              # Theme + Tailwind
```

## License

MIT
