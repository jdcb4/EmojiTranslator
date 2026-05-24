# Deployment

EmojiTranslator supports two deployment shapes from this monorepo:

1. Frontend-only static web page.
2. Backend-only API.

Both use the same deterministic converter code and static JSON data.

## Frontend-Only Static Page

Use this when the public product is the web page and users convert titles in
their browser.

Suitable targets:

- Cloudflare Pages.
- GitHub Pages.
- Any static file host or CDN.

Build the frontend:

```powershell
pnpm run build:frontend
```

Static output:

```text
dist/
```

Runtime requirements:

- No server.
- No database.
- No secrets.
- No runtime LLM calls.

For Cloudflare Pages, use:

```text
Build command: pnpm run build:frontend
Output directory: dist
```

For GitHub Pages, this works directly on a custom domain. If deploying under a
repository subpath, configure Vite's `base` path before building.

### Frontend Load-Speed Notes

The converter data is the heaviest frontend asset. The UI now lazy-loads the
local converter module so the initial interface can render before the converter
data chunk is fetched.

Keep the frontend fast by:

- Keeping the API optional rather than required for normal conversion.
- Lazy-loading converter/data modules instead of importing them into the initial
  app shell.
- Serving `dist/` behind a CDN with gzip or Brotli enabled.
- Keeping generated review artifacts out of the bundle.
- Considering a separate web worker if converter work ever becomes visibly
  expensive on low-end devices.

## Backend-Only API

Use this when third parties should call the converter without loading the web UI.

API documentation lives in [`API.md`](API.md).

### Cloudflare Worker API

Run locally:

```powershell
pnpm run dev:api:worker
```

Deploy:

```powershell
pnpm run deploy:api:worker
```

Cloudflare secrets:

```powershell
wrangler secret put API_ADMIN_TOKEN
```

Optional plain environment variables can be configured in `wrangler.toml` or the
Cloudflare dashboard:

- `API_PUBLIC_RATE_LIMIT_PER_MINUTE`
- `API_RATE_LIMIT_DISABLED`

The in-app rate limiter is best-effort on Workers because isolate memory is not a
durable global store. For hard public limits, prefer Cloudflare platform rate
limiting or add a Durable Object/KV-backed limiter.

### Railway Node API

Run locally:

```powershell
pnpm run dev:api:node
```

Build:

```powershell
pnpm run build:api:node
```

Start:

```powershell
pnpm run start:api:node
```

Railway settings:

```text
Build command: pnpm install --frozen-lockfile && pnpm run build:api:node
Start command: pnpm run start:api:node
```

Railway environment variables:

- `PORT` is supplied by Railway.
- `API_ADMIN_TOKEN` enables unlimited admin-tier requests.
- `API_PUBLIC_RATE_LIMIT_PER_MINUTE` configures public access.
- `API_RATE_LIMIT_DISABLED=true` disables the in-app public limiter.

The in-memory limiter is acceptable for a single on-demand Railway process. Use
Redis or another shared store only if durable quotas across restarts/replicas
become an active requirement.

## Current Artifacts

- Frontend output: `dist/`.
- Railway API output: `dist-api/node-server.js`.
- API entrypoint: `src/api/worker.ts`.
- Node API entrypoint: `src/api/node-server.ts`.
- Cloudflare config: `wrangler.toml`.
- Required environment variables: none for public rate-limited access.
- Optional secret: `API_ADMIN_TOKEN`.

Run `pnpm run verify` before any deploy once a target is selected.
