# API

EmojiTranslator exposes an optional Hono API for backend-only deployments.

The frontend does not require this API. The static web page can run the converter
entirely in the browser. Use the API when third parties should call the
converter directly.

## Base URL

Local Worker dev:

```text
http://127.0.0.1:8787
```

Railway or Cloudflare production URLs depend on the deployed service.

## Authentication

Public requests are allowed without a token and are rate limited.

Admin requests use a bearer token and bypass the in-app public rate limit:

```http
Authorization: Bearer <API_ADMIN_TOKEN>
```

Environment variables:

| Variable                           | Required | Default | Purpose                                             |
| ---------------------------------- | -------- | ------- | --------------------------------------------------- |
| `API_ADMIN_TOKEN`                  | No       | unset   | Token that enables unlimited admin-tier API access. |
| `API_PUBLIC_RATE_LIMIT_PER_MINUTE` | No       | `60`    | Best-effort public request limit per IP per minute. |
| `API_RATE_LIMIT_DISABLED`          | No       | `false` | Set to `true` to disable the in-app public limiter. |

Invalid bearer tokens return `401`. Requests without a bearer token are treated
as public traffic.

## Rate Limits

The built-in limiter is intentionally lightweight:

- It limits unauthenticated public calls per client IP.
- It is in-memory and best-effort.
- It works well for local development and a single Railway process.
- It is not a durable distributed limiter across multiple Node instances or
  Cloudflare Worker isolates.

Production options:

- Cloudflare Workers: prefer Cloudflare platform rate limiting for hard global
  limits, or add a Durable Object/KV-backed limiter if app-owned limits are
  required.
- Railway: use one process for simple best-effort limits, or add Redis if limits
  must be shared across replicas/restarts.

No database is currently required because conversion is deterministic and
stateless. Add a backing store only if durable cross-instance API quotas become
an active requirement.

## Headers

Responses from `POST /api/convert` include:

| Header                  | Meaning                                  |
| ----------------------- | ---------------------------------------- |
| `X-Access-Tier`         | `public` or `admin`.                     |
| `X-RateLimit-Limit`     | Public per-minute request limit.         |
| `X-RateLimit-Remaining` | Remaining public requests in the window. |
| `X-RateLimit-Reset`     | Unix timestamp when the window resets.   |
| `Retry-After`           | Seconds to wait after a `429` response.  |

Admin responses include `X-Access-Tier: admin` and do not include public
rate-limit counters.

## `GET /api/health`

Returns a basic health payload.

Example response:

```json
{
  "ok": true,
  "service": "emoji-translator-api"
}
```

## `POST /api/convert`

Converts a title into emoji.

Request body:

```json
{
  "title": "The Lion King",
  "options": {
    "mode": "hybrid",
    "maxEmojis": 8,
    "allowHomophones": true,
    "allowPartialWords": true,
    "allowPhoneticWords": false,
    "allowAmbiguousPartWordPhonetics": false,
    "ignoreArticles": true,
    "requireAllImportantWords": false,
    "targetDifficulty": "medium"
  }
}
```

Required fields:

| Field   | Type   | Limits          |
| ------- | ------ | --------------- |
| `title` | string | 1 to 200 chars. |

Options:

| Option                            | Values                      | Default  |
| --------------------------------- | --------------------------- | -------- |
| `mode`                            | `strict`, `rebus`, `hybrid` | `hybrid` |
| `maxEmojis`                       | integer, 1 to 24            | `8`      |
| `allowHomophones`                 | boolean                     | `true`   |
| `allowPartialWords`               | boolean                     | `true`   |
| `allowPhoneticWords`              | boolean                     | `false`  |
| `allowAmbiguousPartWordPhonetics` | boolean                     | `false`  |
| `ignoreArticles`                  | boolean                     | `true`   |
| `requireAllImportantWords`        | boolean                     | `false`  |
| `targetDifficulty`                | `easy`, `medium`, `hard`    | `medium` |

Example public request:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:8787/api/convert" `
  -ContentType "application/json" `
  -Body '{"title":"The Lion King","options":{"mode":"strict"}}'
```

Example admin request:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:8787/api/convert" `
  -Headers @{ Authorization = "Bearer $env:API_ADMIN_TOKEN" } `
  -ContentType "application/json" `
  -Body '{"title":"Life of Pi","options":{"mode":"rebus"}}'
```

Example response:

```json
{
  "title": "The Lion King",
  "emoji": "🦁👑",
  "confidence": 1,
  "accepted": true,
  "modeUsed": "strict",
  "tokens": [
    {
      "token": "The",
      "normalised": "the",
      "ruleUsed": "ignored_article",
      "scoreImpact": 0,
      "explanation": "Ignored article"
    },
    {
      "token": "Lion",
      "normalised": "lion",
      "emoji": "🦁",
      "ruleUsed": "exact",
      "scoreImpact": 100,
      "explanation": "lion maps to 🦁 (lion) by exact rule"
    }
  ],
  "warnings": [],
  "alternatives": []
}
```

## Errors

| Status | Meaning                       |
| ------ | ----------------------------- |
| `400`  | Invalid request body/options. |
| `401`  | Invalid bearer token.         |
| `429`  | Public rate limit exceeded.   |
| `404`  | Unknown route.                |
