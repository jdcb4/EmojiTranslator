# Initialise This Project

Use this file when starting from a fresh folder that only contains these agent documentation files. The goal is to turn the folder into a coherent repository without assuming git, packages, scripts, dependencies, or source folders already exist.

## 1. Inspect the starting folder

Before creating anything, list the files and identify what already exists.

PowerShell:

```powershell
Get-ChildItem -Force
```

Do not overwrite user-created files unless the user explicitly asked you to replace them.

## 2. Read the project docs

Read these first:

1. `AGENTS.md`
2. `docs/PROJECT_INDEX.md`
3. `docs/ARCHITECTURE.md`
4. `docs/VERIFICATION.md`
5. `SECURITY.md`

Treat them as starter guidance. If they describe files or commands that do not exist yet, either create those files during setup or update the docs to match the chosen setup.

## 3. Establish the project identity

If the project name, product description, or target stack is unknown, infer only what is safe from the user’s request and existing files. Otherwise add placeholders and mark them clearly.

Update at least:

- `README.md` — product name, short description, quick start once available.
- `docs/PROJECT_INDEX.md` — actual folders and commands.
- `docs/ARCHITECTURE.md` — chosen runtime shape and module boundaries.
- `docs/DECISIONS.md` — initial stack/setup decisions.

## 4. Initialise git only if appropriate

Check whether git already exists:

```powershell
git status
```

If this is not a git repository and the user asked you to prepare a normal repo, initialise it:

```powershell
git init
```

Then add or verify `.gitignore` before installing dependencies or generating build output.

Recommended initial `.gitignore` entries:

```gitignore
node_modules/
dist/
build/
coverage/
.env
.env.*
!.env.example
.DS_Store
Thumbs.db
*.log
```

## 5. Choose and create the app scaffold

Do not assume a scaffold already exists. Pick the smallest suitable setup for the user’s goal.

Recommended defaults for a TypeScript web app:

- pnpm
- TypeScript strict mode
- Vite or framework-specific equivalent
- Vitest
- ESLint + Prettier
- Zod for validation
- Tailwind + token primitives if building a UI

Record meaningful framework choices in `docs/DECISIONS.md`.

## 6. Create baseline folders deliberately

Only create folders that match the chosen scaffold. For a small TypeScript app, these are reasonable defaults:

```text
src/
  app/
  components/
  components/ui/
  config/
  data/
  domain/
  features/
  lib/
  services/
  tests/
docs/
scripts/
```

If the chosen framework uses a different convention, follow that convention and update `docs/PROJECT_INDEX.md` and `docs/ARCHITECTURE.md`.

## 7. Add package scripts

Once `package.json` exists, add scripts with these canonical names where the tooling supports them:

```json
{
  "scripts": {
    "dev": "...",
    "typecheck": "...",
    "lint": "...",
    "test": "...",
    "test:watch": "...",
    "build": "...",
    "verify": "pnpm run typecheck && pnpm run lint && pnpm test && pnpm run build"
  }
}
```

The `verify` script may use `&&` inside `package.json`; package managers handle that differently from an interactive PowerShell session. For commands written for the user to run directly in PowerShell, avoid `&&`.

## 8. Add verification only after tooling exists

Do not claim these checks exist until scripts are actually present:

```powershell
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run build
pnpm run verify
```

If any check cannot be created yet, document the missing precondition in `docs/VERIFICATION.md`.

## 9. Make the first documentation pass

After scaffolding, update:

- `README.md` with real quick-start instructions.
- `docs/PROJECT_INDEX.md` with actual folder paths and scripts.
- `docs/ARCHITECTURE.md` with actual runtime shape.
- `docs/DEPLOYMENT.md` with either real deployment instructions or a clear “not chosen yet” note.
- `docs/CHANGELOG.md` with the initial setup entry once versioning exists.

## 10. Install relevant agent skills

At project initiation, install the core agent skills before implementation work begins. Run `npx skills init`, then install the baseline skills that improve frontend UX, design consistency, browser-based inspection, and shadcn/ui usage:

```powershell
npx skills init
npx skills add https://github.com/anthropics/skills --skill frontend-design
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines
npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser
npx skills add https://github.com/shadcn/ui --skill shadcn
```

After the project direction is clear, install any additional highly relevant skills for the chosen stack, deployment target, testing approach, design system, or domain. Do not install broad or speculative skills just because they might be useful later. Prefer a small, relevant skills set that directly supports the current project goals, and document any non-obvious skill choices in docs/DECISIONS.md.

## 11. Final setup check

Before handing back:

1. Show the files created or changed.
2. Run available deterministic checks.
3. State any checks skipped and why.
4. State whether git was initialised.
5. State whether dependencies were installed.
6. State the current next recommended step.
