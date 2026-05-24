# Verification

Run the strongest deterministic checks that exist before claiming work is complete.

## Standard Checks

```powershell
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run build
pnpm run verify
```

The combined `verify` script runs typecheck, lint, tests, and build.

## Formatting

```powershell
pnpm run format:check
```

Use `pnpm run format` to apply formatting.

## Codebase Analysis

For significant implementation changes, consider deterministic analysis:

```powershell
pnpm dlx fallow --no-cache --format human
```

If unavailable or noisy, record that it was skipped and perform a local code-quality review.

## Environment

- Node.js: `>=22.13.1`
- pnpm: `>=9.15.0`
