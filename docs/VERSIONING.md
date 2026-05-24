# Versioning

This project uses `MAJOR.MINOR.PATCH`.

## Version Sources

- `package.json` at the repository root.

Keep all future version sources aligned if new manifests are introduced.

## Bump Rules

- **PATCH** - bug fixes, small UI polish, documentation corrections that affect usage, dependency compatibility fixes, and refactors with no intended behavior change.
- **MINOR** - new features, meaningful UX changes, new settings, new screens, new integrations, new deployment capability, and additive domain behavior.
- **MAJOR** - breaking persistence/schema changes, incompatible public API changes, removed capabilities, or production release line reset.

Pre-1.0: use `MINOR` for meaningful feature milestones and `PATCH` for fixes.

## Process

Before every commit, decide whether the work changes:

- app behavior
- user-visible UX
- deployment behavior
- dependencies
- persistence schema
- public APIs
- usage documentation

If yes, bump the version and update `docs/CHANGELOG.md` in the same commit.

If no, note in the commit message that the change is version-neutral.

Do not commit feature or fix work without either a version bump or an explicit version-neutral note once versioning is active.
