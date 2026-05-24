# Project Index

The first stop for navigating this project. Keep this file factual: it describes the project as it exists now.

## What This Project Is

EmojiTranslator is a deterministic title-to-emoji converter and emoji-title guessing game. The current branch presents the game UI, using static generated movie, TV, and book clues built from the converter rules.

## Current Setup State

- App scaffold: Vite + React + TypeScript.
- Git repository: initialised.
- Package manager: pnpm.
- Runtime/deployment target: static browser game, with the existing Hono API still available for converter deployments.
- Persistence: static JSON data files in `src/data/converter` and `src/data/game`; no database.

## Important Folders

- `src/app` - app shell, routing, and top-level orchestration.
- `src/api` - Hono API app and Cloudflare Worker entrypoint.
- `src/features` - feature-specific UI and orchestration.
- `src/components/ui` - reusable visual primitives.
- `src/components` - small reusable app components shared across features.
- `src/domain` - framework-independent business rules.
- `src/services` - IO wrappers.
- `src/data/converter` - static conversion tables and movie-title coverage set.
- `src/data/game` - generated static clue dataset for the guessing game.
- `src/config` - typed config and environment parsing.
- `src/domain/converter` - deterministic conversion engine.
- `src/domain/game` - answer normalisation and near-hit matching rules.
- `src/features/game` - emoji-title guessing game UI.
- `src/lib` - small generic helpers.
- `src/styles` - global CSS and design tokens.
- `src/tests` - shared test setup and integration tests.
- `.agents/skills` - project-installed agent skills used for frontend design, browser checks, and shadcn guidance.
- `docs` - durable project documentation.
- `scripts` - deterministic project utility scripts.
- `review` - generated local analysis artifacts; ignored by git.

## Commands

| Command                           | Purpose                                                            |
| --------------------------------- | ------------------------------------------------------------------ |
| `pnpm install`                    | Install dependencies.                                              |
| `pnpm run dev`                    | Start the development server.                                      |
| `pnpm run dev:api`                | Start the local Hono/Cloudflare API.                               |
| `pnpm run dev:api:worker`         | Start the local Cloudflare Worker API.                             |
| `pnpm run dev:api:node`           | Start the local Node/Railway API.                                  |
| `pnpm run typecheck`              | TypeScript checking.                                               |
| `pnpm run lint`                   | ESLint.                                                            |
| `pnpm run format`                 | Format files with Prettier.                                        |
| `pnpm run format:check`           | Check Prettier formatting.                                         |
| `pnpm test`                       | Run Vitest once.                                                   |
| `pnpm run test:watch`             | Run Vitest in watch mode.                                          |
| `pnpm run analyse:coverage`       | Run converter coverage over the starter movie-title dataset.       |
| `pnpm run fetch:corpus`           | Fetch public review-only title corpora into ignored `review/`.     |
| `pnpm run fetch:game-corpus`      | Fetch Wikidata movie, TV, and book titles into ignored `review/`.  |
| `pnpm run analyse:corpus`         | Analyse any JSON/CSV/text title corpus and write review JSON.      |
| `pnpm run generate:game-dataset`  | Convert the game corpus and write good clues into `src/data/game`. |
| `pnpm run generate:candidates`    | Generate review-only mapping candidates from corpus coverage.      |
| `pnpm run prompt:candidates`      | Print an OpenRouter-ready prompt from candidate review JSON.       |
| `pnpm run llm:candidates`         | Batch candidate review through OpenRouter into ignored JSON.       |
| `pnpm run summarise:llm`          | Summarise LLM suggestions with emoji outputs for review.           |
| `pnpm run promote:llm-candidates` | Promote validated LLM candidate suggestions into static data.      |
| `pnpm run augment:flags`          | Enrich regional flag concepts with country metadata.               |
| `pnpm run fetch:unicode`          | Fetch official Unicode Emoji 17.0 base emoji review data.          |
| `pnpm run llm:unicode`            | Generate one-word meanings and aliases for Unicode emoji.          |
| `pnpm run promote:unicode`        | Promote validated Unicode emoji mappings into converter data.      |
| `pnpm run generate:homophones`    | Generate static CMUdict exact-pronunciation homophone data.        |
| `pnpm run compare:phonetic`       | Compare corpus coverage with whole-word phonetic fallback.         |
| `pnpm run compare:part-ambiguity` | Compare ambiguous part-word phonetic fallback behavior.            |
| `pnpm run build`                  | Typecheck and create the frontend production build.                |
| `pnpm run build:frontend`         | Typecheck and build static frontend assets into `dist/`.           |
| `pnpm run build:api:node`         | Build the Node/Railway API into `dist-api/`.                       |
| `pnpm run deploy:api`             | Deploy the Hono API with Wrangler.                                 |
| `pnpm run deploy:api:worker`      | Deploy the Cloudflare Worker API with Wrangler.                    |
| `pnpm run start:api:node`         | Start the built Node/Railway API.                                  |
| `pnpm run verify`                 | Typecheck, lint, test, and build.                                  |

## Key Docs

- [`../AGENTS.md`](../AGENTS.md) - every-turn agent ruleset.
- [`../INITIALISE.md`](../INITIALISE.md) - first setup pass for a fresh folder.
- [`AGENT_REFERENCE.md`](AGENT_REFERENCE.md) - detailed agent reference.
- [`DESIGN_TOKENS.md`](DESIGN_TOKENS.md) - color, type, and layout token system.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) - module boundaries and runtime shape.
- [`VERIFICATION.md`](VERIFICATION.md) - required checks.
- [`VERSIONING.md`](VERSIONING.md) - version rules.
- [`DECISIONS.md`](DECISIONS.md) - durable decisions.
- [`ROADMAP.md`](ROADMAP.md) - future ideas only, not active work.
- [`CHANGELOG.md`](CHANGELOG.md) - notable changes by version.
- [`DEPLOYMENT.md`](DEPLOYMENT.md) - deploy instructions once chosen.
- [`API.md`](API.md) - API contract, authentication, and rate-limit behavior.
- [`DATA_TOOLING.md`](DATA_TOOLING.md) - corpus, LLM, Unicode, flag, and homophone maintenance scripts.
- [`RESEARCH.md`](RESEARCH.md) - research summary and data-source plan.
- [`COVERAGE_REPORT.md`](COVERAGE_REPORT.md) - coverage-analysis process and current baseline.
- [`HOMOPHONE_LIBRARY_OPTIONS.md`](HOMOPHONE_LIBRARY_OPTIONS.md) - tested homophone library options, results, and resource impact.
- [`RULESETS.md`](RULESETS.md) - human-readable list of active converter rules.
- [`RULESET_EXPANSION_PLAN.md`](RULESET_EXPANSION_PLAN.md) - plan for expanding strict and rebus mappings.
- [`../SECURITY.md`](../SECURITY.md) - security rules.
