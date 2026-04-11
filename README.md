# ⚡ Right Now

**AI-Powered Quick Notes & Journal** — Capture thoughts, let AI organize them.

Right Now is a personal note-taking app that automatically tags, categorizes, and finds connections between your notes using AI. Think Google Keep meets AI-powered organization.

## Features

- **Quick Capture** — Type a note, hit save. That's it.
- **AI Auto-Organize** — AI automatically suggests tags and categories for every note
- **Smart Connections** — AI discovers related notes you might have forgotten about
- **Journal View** — See your notes as a daily timeline
- **Pin & Filter** — Pin important notes, filter by tags or categories
- **Search** — Full-text search across all notes
- **BYOK** — Bring Your Own API Key (Claude or ChatGPT). Your data stays in your browser.
- **Responsive** — Works on phone and desktop

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), choose your AI provider (Claude or ChatGPT), and enter your API key.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS v3 |
| AI | Claude Sonnet or GPT-4o (user's choice) |
| Storage | localStorage (browser) |
| Build | Vite |

## Architecture

```
Browser
├── React UI (Notes Grid / Journal View)
├── NoteService (CRUD → localStorage)
├── AIService (→ Anthropic or OpenAI API directly)
└── SettingsService (API key + provider → localStorage)
```

No backend. No server. Pure static site. Your API key stays in your browser.

## License

MIT
