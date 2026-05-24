# Decisions

Durable architecture and tooling decisions. Use ADR-lite format: each entry is dated, names the decision, gives the reasoning, and records rejected alternatives.

When adding a new entry, append to the bottom. Do not delete past decisions; supersede them with a new entry that links back.

## Format

```md
## YYYY-MM-DD: <decision title>

**Decision:** <one sentence>

**Reasoning:** <why this won>

**Rejected alternatives:** <what else was considered and why not>

**Supersedes:** <link to a prior decision, if applicable>
```

---

## 2026-05-23: Project Identity

**Decision:** Name the app EmojiTranslator and initialise it as an emoji translation web app scaffold.

**Reasoning:** The user provided the project name and asked to initialise the project before supplying feature details, so the scaffold should stay product-ready without inventing behavior.

**Rejected alternatives:** A CLI, API-only service, or mobile app were not chosen because no requirements currently point away from a browser UI.

**Supersedes:** None.

## 2026-05-23: Package Manager

**Decision:** Use pnpm.

**Reasoning:** Project instructions name pnpm as the default package manager, and pnpm provides deterministic lockfile-based installs.

**Rejected alternatives:** npm and yarn were not chosen because the project has an explicit pnpm default and no conflicting requirement.

**Supersedes:** None.

## 2026-05-23: Frontend Stack

**Decision:** Use Vite, React, and strict TypeScript.

**Reasoning:** Vite and TypeScript are the documented defaults for a small frontend app, and React gives a practical component model for the likely translation UI.

**Rejected alternatives:** Next.js was not chosen because routing, SSR, API routes, and deployment needs are not known yet. Vanilla TypeScript was not chosen because the product is expected to have an interactive UI.

**Supersedes:** None.

## 2026-05-23: Styling System

**Decision:** Use Tailwind CSS with project-owned semantic design tokens.

**Reasoning:** The project instructions require token-based styling once a UI token system exists, and Tailwind keeps layout and state styling compact while tokens preserve design consistency.

**Rejected alternatives:** Plain CSS modules were not chosen because the project docs already define a Tailwind token workflow. Component libraries were deferred until product requirements justify them.

**Supersedes:** None.

## 2026-05-23: Validation

**Decision:** Use Zod for typed validation.

**Reasoning:** The project defaults require validation for external input and local data files; Zod is the documented default.

**Rejected alternatives:** Hand-written validators were not chosen because they are easier to drift from TypeScript types. Other schema libraries were not chosen because no requirement outweighs the default.

**Supersedes:** None.

## 2026-05-23: Verification Tooling

**Decision:** Use ESLint, Prettier, Vitest, and React Testing Library.

**Reasoning:** These match the project defaults and provide deterministic type, lint, format, unit, and component checks from the first scaffold.

**Rejected alternatives:** Jest was not chosen because Vitest integrates directly with Vite. No test runner was rejected because checks must exist once tooling exists.

**Supersedes:** None.

## 2026-05-23: Persistence

**Decision:** Do not add app persistence yet; default to JSON files only when small local data becomes necessary.

**Reasoning:** Product details are pending, and the instructions require JSON before a database unless JSON becomes unsuitable.

**Rejected alternatives:** Adding a database now was rejected because no persistence requirement exists.

**Supersedes:** None.

## 2026-05-23: Deployment

**Decision:** Do not choose a hosting provider yet.

**Reasoning:** The app can build to static assets, but production deployment requirements are unknown.

**Rejected alternatives:** GitHub Pages, Vercel, Netlify, and Cloudflare Pages were deferred until the deployment target is a real requirement.

**Supersedes:** None.

## 2026-05-23: Baseline Agent Skills

**Decision:** Install frontend-design, web-design-guidelines, agent-browser, and shadcn skills under `.agents/skills`.

**Reasoning:** The project initialise guide requires these baseline skills so future frontend work has local design, browser inspection, and shadcn guidance available.

**Rejected alternatives:** Skipping skill installation was rejected because the initialise instructions explicitly require it. Installing broader speculative skills was rejected until the product direction is clearer.

**Supersedes:** None.

## 2026-05-23: Deterministic Runtime Converter

**Decision:** Implement title conversion as a deterministic TypeScript engine backed by editable JSON files.

**Reasoning:** The product spec requires transparent rules, confidence scoring, explanations, and no runtime LLM calls.

**Rejected alternatives:** Runtime LLM generation was rejected because it would make outputs non-deterministic and hard to audit. A database was rejected because the current conversion library is small and static JSON is sufficient.

**Supersedes:** None.

## 2026-05-23: Hono API on Cloudflare Workers

**Decision:** Add a Hono API with Cloudflare Workers as the deployment target.

**Reasoning:** The user wants an option to expose an API, and the API only needs lightweight request validation plus deterministic conversion. Hono fits Cloudflare Workers without forcing a broader framework migration.

**Rejected alternatives:** Next.js was rejected for now because the backend is not comprehensive enough to justify moving away from the existing Vite app. Railway remains a possible future target if server-side requirements grow.

**Supersedes:** [2026-05-23: Deployment](#2026-05-23-deployment).

## 2026-05-23: Coverage Analysis Tooling

**Decision:** Use a `tsx` script for local coverage analysis over the static movie-title dataset.

**Reasoning:** The spec requires a repeatable coverage report and unmapped-word analysis, and `tsx` lets the script run the same TypeScript engine used by the app and API.

**Rejected alternatives:** A separate JavaScript build script was rejected because it would duplicate runtime wiring. Shell-only analysis was rejected because it could not inspect typed conversion results.

**Supersedes:** None.

## 2026-05-23: Deprecate Movie-Clue Runtime Mode

**Decision:** Deprecate movie-clue mode and remove movie-specific overrides from hybrid scoring.

**Reasoning:** The current product direction is to translate the supplied title itself, with strict and rebus variants. Movie-specific clue overrides can be useful references, but they solve a different problem by using plot or iconography instead of title translation.

**Rejected alternatives:** Keeping movie-clue in hybrid was rejected because it can hide weak strict/rebus coverage. Deleting the override table was rejected for now because it may still be useful as archived reference data.

**Supersedes:** [2026-05-23: Deterministic Runtime Converter](#2026-05-23-deterministic-runtime-converter).

## 2026-05-23: Bounded Part-Word Rebus Fallback

**Decision:** Add `hypher`, `hyphenation.en-us`, and `double-metaphone` for a bounded programmatic part-word rebus fallback.

**Reasoning:** The user wants unmapped words to be split into syllable-like chunks and tested against the translation library, including sound-alike checks. Hypher provides lightweight English hyphenation points, and double-metaphone provides deterministic phonetic codes without runtime AI or a backend service.

**Rejected alternatives:** A full NLP stack was rejected as too large for the current Cloudflare-friendly converter. Runtime LLM segmentation was rejected because it would be non-deterministic and more expensive. A complete rewrite was rejected because the fallback fits cleanly after the existing reviewed strict/rebus rules.

**Supersedes:** None.

## 2026-05-24: Static CMUdict Homophone Fallback

**Decision:** Use `cmu-pronouncing-dictionary` as a development-time generator dependency for exact-pronunciation homophone fallback data.

**Reasoning:** The CMUdict experiment had much better precision than phonetic hash algorithms. Generating a reduced static JSON table keeps the browser and Cloudflare Worker runtime deterministic and avoids shipping the full pronunciation dictionary in the app bundle.

**Rejected alternatives:** Runtime Soundex, Metaphone, Double Metaphone, NYSIIS, and Fuzzy Soundex were rejected because they produced too many misleading clues. Shipping a broad NLP runtime package was rejected because the app only needs a small generated homophone table.

**Supersedes:** None.

## 2026-05-24: Split Static Frontend and Backend-Only API Deployments

**Decision:** Support separate frontend-only static deployment and backend-only API deployment from the same monorepo.

**Reasoning:** The converter is deterministic and stateless, so the web page can run entirely from static assets while the API can be deployed independently for third-party access. Hono remains the shared API app, with Cloudflare Workers and Node/Railway entrypoints adapting the same code.

**Rejected alternatives:** Moving to Next.js was rejected because the API remains lightweight and does not require a comprehensive backend. Adding a database-backed quota system was deferred because best-effort public limits plus an admin token satisfy the current requirement without introducing persistence.

**Supersedes:** [2026-05-23: Hono API on Cloudflare Workers](#2026-05-23-hono-api-on-cloudflare-workers).
