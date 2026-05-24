import type { Context, Next } from 'hono';

export type ApiBindings = {
  API_ADMIN_TOKEN?: string;
  API_PUBLIC_RATE_LIMIT_PER_MINUTE?: string;
  API_RATE_LIMIT_DISABLED?: string;
};

export type ApiVariables = {
  accessTier: 'public' | 'admin';
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const DEFAULT_PUBLIC_LIMIT_PER_MINUTE = 60;
const WINDOW_MS = 60_000;
const publicRateLimitBuckets = new Map<string, RateLimitBucket>();

function bindingValue(
  context: Context<{ Bindings: ApiBindings }>,
  key: keyof ApiBindings,
) {
  return context.env?.[key];
}

function rateLimitDisabled(context: Context<{ Bindings: ApiBindings }>) {
  return bindingValue(context, 'API_RATE_LIMIT_DISABLED') === 'true';
}

function configuredLimit(context: Context<{ Bindings: ApiBindings }>) {
  const rawLimit = bindingValue(context, 'API_PUBLIC_RATE_LIMIT_PER_MINUTE');
  const parsedLimit = rawLimit
    ? Number(rawLimit)
    : DEFAULT_PUBLIC_LIMIT_PER_MINUTE;

  if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
    return DEFAULT_PUBLIC_LIMIT_PER_MINUTE;
  }

  return Math.floor(parsedLimit);
}

function bearerToken(context: Context) {
  const authorization = context.req.header('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/iu.exec(authorization);

  return match?.[1]?.trim() ?? null;
}

function clientKey(context: Context) {
  return (
    context.req.header('cf-connecting-ip') ??
    context.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    'anonymous'
  );
}

function headersForLimit(limit: number, bucket: RateLimitBucket) {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, limit - bucket.count)),
    'X-RateLimit-Reset': String(Math.ceil(bucket.resetAt / 1000)),
  };
}

export async function apiAccessControl(
  context: Context<{ Bindings: ApiBindings; Variables: ApiVariables }>,
  next: Next,
) {
  const configuredAdminToken = bindingValue(context, 'API_ADMIN_TOKEN');
  const suppliedToken = bearerToken(context);

  if (suppliedToken) {
    if (configuredAdminToken && suppliedToken === configuredAdminToken) {
      context.set('accessTier', 'admin');
      await next();
      context.header('X-Access-Tier', 'admin');
      return;
    }

    return context.json({ error: 'Invalid API token' }, 401);
  }

  context.set('accessTier', 'public');

  if (rateLimitDisabled(context)) {
    await next();
    context.header('X-Access-Tier', 'public');
    return;
  }

  const limit = configuredLimit(context);
  const now = Date.now();
  const key = clientKey(context);
  const existingBucket = publicRateLimitBuckets.get(key);
  const bucket =
    existingBucket && existingBucket.resetAt > now
      ? existingBucket
      : { count: 0, resetAt: now + WINDOW_MS };

  bucket.count += 1;
  publicRateLimitBuckets.set(key, bucket);

  const headers = headersForLimit(limit, bucket);

  for (const [header, value] of Object.entries(headers)) {
    context.header(header, value);
  }

  context.header('X-Access-Tier', 'public');

  if (bucket.count > limit) {
    context.header(
      'Retry-After',
      String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))),
    );
    return context.json({ error: 'Public API rate limit exceeded' }, 429);
  }

  await next();
}
