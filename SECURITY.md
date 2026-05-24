# Security

## Reporting

If you discover a security issue, do not open a public issue. Contact the maintainer directly.

## Project security rules

These rules apply to all contributors, including AI agents. They apply even before the project has been scaffolded.

### Secrets

- Never commit secrets, API keys, tokens, certificates, or production credentials.
- Use `.env.local` or the project’s chosen local secret file for local secrets.
- Ensure local secret files are ignored by git before creating them.
- Validate every environment variable through a typed schema once app code exists.

### Dependencies

- Prefer well-maintained packages with TypeScript types when using TypeScript.
- Document meaningful new top-level dependencies in `docs/DECISIONS.md`.
- Do not install packages until the scaffold and package manager have been deliberately chosen.

### Input handling

- Validate every external input: forms, URL params, request bodies, localStorage reads, JSON file loads, third-party API responses, and realtime events.
- Treat data on disk as untrusted on read.

### Auth

Do not implement authentication unless the user has explicitly asked for it. Adding auth changes the security surface significantly. If a task seems to need auth, raise it as a product/security decision before implementing.

### Output handling

- Avoid `dangerouslySetInnerHTML` and `eval`-style APIs.
- Sanitize user-supplied content before rendering as HTML.

### CI and supply chain

- Do not bypass commit signing, lint, typecheck, or test failures once those checks exist.
- Do not skip dependency update review without reading the changelog.
