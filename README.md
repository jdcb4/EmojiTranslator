# EmojiTranslator

EmojiTranslator is a deterministic movie-title-to-emoji converter for quiz clue generation. It uses static JSON data and transparent rules; runtime conversion does not call an LLM.

The active product modes are strict title, rebus, and hybrid. Movie-specific clue overrides are deprecated so expansion work focuses on translating title words, synonyms, compounds, and sound-alikes.

## Current Status

- App: Vite + React + TypeScript.
- API: optional Hono endpoint targeting Cloudflare Workers.
- Package manager: pnpm.
- Styling: Tailwind CSS with semantic design tokens.
- Verification: TypeScript, ESLint, Vitest, and production build scripts.
- Deployment: static web build plus Cloudflare Worker API.

## Quick Start

```powershell
pnpm install
pnpm run dev
```

Run the API locally in a second PowerShell session:

```powershell
pnpm run dev:api
```

## Verification

```powershell
pnpm run verify
```

This runs typecheck, lint, tests, and a production build.

## Coverage Analysis

```powershell
pnpm run analyse:coverage
```

The starter dataset includes 100 common movie titles.

## Documentation

Start with:

- `AGENTS.md`
- `INITIALISE.md`
- `docs/PROJECT_INDEX.md`

Durable project docs live under `docs/`.

## License

Add the project license once chosen.
