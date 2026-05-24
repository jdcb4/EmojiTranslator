# Agent Instructions

This file holds the rules an agent must obey on every turn. It is designed to work in a fresh folder before any repository, package manager, framework, dependencies, or scripts exist.

Detailed reference material lives in `docs/AGENT_REFERENCE.md`. Load it on demand, not by default.

## Project state assumptions

- The current folder may be empty or partially prepared.
- A git repository may not exist yet.
- Dependencies may not be installed yet.
- `package.json`, framework config, scripts, tests, and source folders may not exist yet.
- Treat all stack, deployment, and folder guidance in these docs as defaults to establish, not as facts that already exist.

## First-step orientation

Before making changes:

1. Read this file.
2. Read `INITIALISE.md` if the project has not been set up yet.
3. Read `docs/PROJECT_INDEX.md`.
4. Inspect the current folder before assuming files exist.
5. Inspect `package.json` scripts if `package.json` exists; otherwise create scripts deliberately during setup.
6. Read any docs relevant to the files being changed.
7. Prefer existing patterns over new abstractions once the project has code.

If docs are missing, stale, or inconsistent with the actual project, fix them as part of the change.

## Default project shape

Use these defaults unless the user asks for something different or the project clearly requires another shape:

- TypeScript strict mode.
- pnpm as package manager.
- Vite or framework-specific equivalent for frontend builds.
- ESLint + Prettier for linting/formatting.
- Vitest for unit tests; React Testing Library for React component tests.
- Zod for validation of external input and local data files.
- Tailwind CSS + shadcn-style primitives for UI projects.
- JSON files for small local persistence. Move to a database only when JSON becomes unsuitable.
- No authentication unless the user explicitly asks for it.

## Hard rules

1. **No auth without explicit request.** If a task seems to need auth, surface that as a product/security decision rather than building it silently.
2. **No new top-level dependency or framework without recording the reason** in `docs/DECISIONS.md` once that file exists.
3. **No new database without first justifying why JSON files are insufficient.** Record the decision in `docs/DECISIONS.md`.
4. **Do not claim checks passed unless they were run successfully.** If checks cannot run because setup is incomplete, say exactly what is missing.
5. **Once versioning files exist, bump versions on behaviour-affecting changes** according to `docs/VERSIONING.md`, and update `docs/CHANGELOG.md`.
6. **Do not implement roadmap items unless the user moves them into active work.** Out-of-scope ideas go in `docs/ROADMAP.md`.
7. **Do not commit secrets, build output, dependency folders, or local env files.** See `SECURITY.md` and `.gitignore` once present.
8. **Do not weaken or skip tests to make them pass.** Fix the underlying issue.
9. **Local dev is Windows PowerShell unless the user says otherwise.** Use PowerShell-safe commands for local instructions. CI and Docker can use bash.
10. **Use design tokens, not raw visual styling, once a UI token system exists.** See `docs/DESIGN_TOKENS.md`.

## Verification principle

Before claiming a task is complete, run the strongest deterministic checks that exist in the current project.

- If no project has been initialised yet, say that verification is not yet available.
- If `package.json` exists, inspect scripts and run the relevant checks.
- If a documented verification command does not exist, update the docs or add the script.
- Record failed or skipped checks honestly.

## Documentation map

- `INITIALISE.md` — first steps for preparing a fresh folder.
- `docs/PROJECT_INDEX.md` — entry point: actual folders, commands, and key docs.
- `docs/ARCHITECTURE.md` — module boundaries and runtime shape.
- `docs/VERIFICATION.md` — required checks once tooling exists.
- `docs/VERSIONING.md` — version rules once manifests exist.
- `docs/DECISIONS.md` — durable decisions.
- `docs/ROADMAP.md` — future ideas only.
- `docs/CHANGELOG.md` — notable changes by version.
- `docs/DEPLOYMENT.md` — deploy instructions once chosen.
- `docs/AGENT_REFERENCE.md` — detailed reference.
- `docs/DESIGN_TOKENS.md` — colour, type, and layout token system.
- `SECURITY.md` — security rules.

## When blocked

If a task cannot be completed cleanly:

1. Make the smallest safe improvement available.
2. Document what remains blocked and why.
3. Include exact commands run and exact failures.
4. Do not claim checks passed unless they were run successfully.
