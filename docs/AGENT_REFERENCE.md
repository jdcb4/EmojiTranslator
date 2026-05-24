# Agent Reference

Detailed reference for AI agents working in this project. Load on demand. The short every-turn ruleset is in `AGENTS.md`.

This document is written for a project that may begin as docs only. Treat defaults as choices to establish during setup, not as proof that files or tools already exist.

## Toolchain defaults

Use these defaults unless the user asks for another stack or the project clearly needs something else:

- **Language:** TypeScript strict mode for JS/TS projects.
- **Package manager:** pnpm. Do not switch to npm or yarn without a `docs/DECISIONS.md` entry.
- **Build:** Vite or framework-specific equivalent.
- **Lint/format:** ESLint flat config + Prettier.
- **Test:** Vitest; React Testing Library for React UI.
- **Validation:** Zod anywhere external input lands.
- **Styling:** Tailwind CSS + shadcn-style primitives for React UI.
- **Code quality:** Fallow, Knip, ts-prune, or jscpd as on-demand investigations once tooling exists.

## Modularity rules

- Domain code is framework-independent. No React, no IO, no DB imports.
- UI components do not own persistence or network calls.
- IO sits behind service modules so it can be mocked in tests.
- Feature orchestration is separate from pure domain rules.
- Inject time, randomness, IDs, and external services for deterministic tests.

## Reducing duplication

Before adding new code:

1. Search for existing functions, hooks, components, schemas, constants, and types that already solve part of the problem.
2. Prefer extending an existing module over creating a parallel implementation.
3. Extract shared logic only after at least two real call sites exist, unless the boundary is already obvious.
4. Keep shared utilities small and dependency-light.
5. Avoid catch-all `utils` files that mix unrelated concerns.

Duplication policy:

- Domain rules have one canonical implementation.
- Validation schemas are reused by UI, API, tests, and persistence where practical.
- Constants and defaults live in named config modules, not inline across screens.
- Test helpers do not reimplement production logic in a way that can mask bugs.

## Deterministic codebase analysis

Only run these after the relevant package manager and dependencies exist:

```powershell
pnpm dlx fallow --no-cache --format human
pnpm dlx ts-prune
pnpm dlx knip
pnpm dlx jscpd .
pnpm ls --depth=0
```

Do not blindly follow these tools. False positives are common for framework entrypoints, plugin-loaded files, generated files, and runtime-only dependencies. Document false positives near the relevant config.

## Persistence policy

1. Default to JSON files in `src/data/` for small local datasets. Validate on read.
2. Move to SQLite when relational queries, transactions, or larger datasets become awkward in JSON.
3. Move to Postgres when concurrency, advanced queries, or production scale demand it.

Every move between tiers needs a `docs/DECISIONS.md` entry and migration logic that handles existing data.

## Persistence and schema changes

When changing persisted data, database schema, local storage, or public data formats:

1. Document current and new schema.
2. Add or update migration logic.
3. Add tests for old data loading into the new version.
4. Increment `MAJOR` if old data cannot be migrated after versioning is active.
5. Update `docs/ARCHITECTURE.md`, `docs/VERSIONING.md`, and `docs/CHANGELOG.md`.

## Dependency policy

Before adding a dependency:

1. Check whether the platform or existing dependencies already solve the problem.
2. Prefer small, well-maintained packages with TypeScript support.
3. Avoid dependencies for trivial helpers.
4. Document meaningful new dependencies in `docs/DECISIONS.md`.
5. Run dependency checks after installation if scripts exist.

## Auth policy

Do not implement authentication unless the user explicitly asks for it.

If a task seems to need auth, raise the question rather than building it. Auth materially changes the security surface, the data model, and the deployment shape, so the choice belongs to the user.

## Git hygiene

Git may not exist yet. If it does, do not commit:

- dependency folders such as `node_modules`
- build output such as `dist`, `.next`, `coverage`, generated native folders, or compiled artifacts unless intentionally tracked
- local environment files such as `.env` and `.env.local`
- signing credentials, API keys, tokens, secrets
- editor caches and OS metadata

Before committing, once git exists:

```powershell
git status --short
git diff --check
git diff --stat
```

## Token-efficient agent workflow

- `docs/PROJECT_INDEX.md` is the navigation entry point. Keep it current.
- Maintain short module-level notes for complex folders.
- Prefer small files with clear names over large files mixing concerns.
- Use descriptive commit messages that include version impact once versioning is active.
- When completing a task, leave a concise summary: changed files, checks run, version decision, docs updated.
- Do not paste large generated outputs into docs. Link to scripts or source files.
- Avoid broad rewrites when a focused change will do.
- Keep public APIs narrow and documented.

## Working on Windows PowerShell

Assume local interactive commands are run in Windows PowerShell unless the user says otherwise. CI and Docker may run Linux bash.

Rules for shell commands run interactively:

- No `&&` or `||` chains. Use `;` for unconditional sequencing or `; if ($?) { ... }` for conditional sequencing.
- Env vars are `$env:NAME`, not `$NAME` or `${NAME}`.
- Line continuation is backtick, not `\`.
- Use `$null`, not `/dev/null`.
- Avoid `2>&1` on native executables unless needed.
- Use `Remove-Item -Recurse -Force`, not `rm -rf`.
- Use `New-Item -ItemType Directory -Force -Path ...` or `mkdir ...`.
- Quote paths with spaces.

### Cross-shell command equivalents

| Task                   | Bash                   | PowerShell                            |
| ---------------------- | ---------------------- | ------------------------------------- |
| Sequence               | `A; B` or `A && B`     | `A; B`                                |
| Conditional            | `A && B`               | `A; if ($?) { B }`                    |
| Set env var inline     | `FOO=bar pnpm dev`     | `$env:FOO="bar"; pnpm dev`            |
| Make dir incl. parents | `mkdir -p path/to/dir` | `mkdir path/to/dir`                   |
| Remove dir recursively | `rm -rf dir`           | `Remove-Item -Recurse -Force dir`     |
| Suppress output        | `cmd > /dev/null 2>&1` | `cmd > $null 2> $null`                |
| Read env var           | `echo $FOO`            | `$env:FOO` or `Write-Output $env:FOO` |

## When documenting commands in `/docs`

- For commands that run in CI/Docker on Linux, bash syntax is fine and code fences should be labelled `bash`.
- For commands the user runs locally, prefer commands that work cross-shell. If not possible, label the fence `powershell` and provide PowerShell syntax.

## When blocked

1. Make the smallest safe improvement available.
2. Document what remains blocked and why.
3. Include exact commands run and exact failures.
4. Do not claim checks passed unless they were run successfully.
