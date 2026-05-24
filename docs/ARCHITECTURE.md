# Architecture

This document describes the project's runtime shape and module boundaries.

## Runtime Shape

- App type: browser web app with optional public API.
- Framework/runtime: Vite + React + TypeScript.
- API runtime: Hono, deployable as a Cloudflare Worker or Node service.
- Styling: Tailwind CSS mapped to semantic CSS custom property tokens.
- Deployment target: static frontend, with an optional backend-only API.
- Persistence model: static JSON files in `src/data/converter`.
- Major integration boundaries: `/api/convert` and `/api/health`.

## Module Boundaries

- `src/api` - Hono API app and Cloudflare Worker entrypoint.
- `src/app` - app shell, routing, and top-level orchestration.
- `src/features` - feature-specific UI and orchestration.
- `src/components/ui` - generic visual primitives.
- `src/components` - small reusable app components shared across features.
- `src/domain` - framework-independent business rules.
- `src/services` - IO wrappers.
- `src/data/converter` - editable deterministic conversion data.
- `src/config` - typed config and environment parsing.
- `src/lib` - small generic helpers without domain knowledge.
- `src/styles` - CSS entrypoint and design tokens.
- `src/tests` - shared test utilities and integration tests.

## Boundary Rules

- Domain code does not import React, framework runtime APIs, filesystem, network, or database modules unless explicitly required.
- UI components do not own persistence or network calls.
- IO sits behind service modules so it can be mocked or swapped in tests.
- Feature orchestration is separate from pure domain rules.
- Inject time, randomness, IDs, and external services when deterministic tests need control.

## Converter Pipeline

The converter is deterministic:

1. Tokenise and normalise the input title.
2. Apply strict title rules for articles, connectors, exact words, plurals, numbers, compounds, and curated synonyms.
3. Apply rebus rules for homophones, exact dictionary homophones, and manually reviewed partial-word mappings when enabled.
4. Score the candidate and return confidence, warnings, token explanations, and alternatives.

Movie-specific clue overrides are deprecated. `src/data/converter/movie-overrides.json` is retained as archived seed/reference data, but hybrid mode no longer uses it.

The human-readable list of active runtime rules lives in `docs/RULESETS.md`. Keep that file aligned with converter behavior when rule order or mapping conventions change.

Partial-word conversion exists as reviewed entries in `src/data/converter/compound-rules.json` with `rule: "partial_word"`. Rebus mode also has a bounded programmatic fallback in `src/domain/converter/partWordFallback.ts` for still-unmapped words. The fallback uses hyphenation points, substring groupings, explicit homophones, and conservative phonetic matching; it scores below reviewed partial-word rules.

Exact dictionary homophone conversion uses a generated static table at `src/data/converter/pronunciation-homophones.json`. The generator uses CMUdict during local tooling only; the browser and Worker runtime do not load the full pronunciation dictionary.

## Deployment Boundaries

The monorepo intentionally produces separate deployable artifacts:

- Static frontend: Vite builds `dist/`. The UI can run without the API and
  lazy-loads the local converter module to keep the initial page lighter.
- Cloudflare Worker API: `src/api/worker.ts` exposes the Hono app on Workers.
- Railway/Node API: `src/api/node-server.ts` adapts the same Hono app to Node.

The API supports public rate-limited requests and bearer-token admin requests.
The built-in limiter is best-effort and in-memory; durable distributed limits
should be handled by the deployment platform or a deliberately added store.

## Persistence

The app uses static JSON files in `src/data/converter`. Data is validated with Zod on load.

Move to a database only when JSON is unsuitable. Document the migration in `docs/DECISIONS.md` before or alongside the change.

## Validation

Validate every external input: forms, URL params, request bodies, environment variables, JSON file loads, third-party API responses, and realtime events.

Environment variables flow through `src/config/env.ts`.

## Testing

Use Vitest for unit tests and React Testing Library for component tests. Keep domain logic deterministic and framework-independent where practical.

## Deployment

See `docs/DEPLOYMENT.md`.
