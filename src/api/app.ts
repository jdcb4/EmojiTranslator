import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

import { convertMovieTitleToEmoji } from '../domain/converter/convertTitle';
import {
  apiAccessControl,
  type ApiBindings,
  type ApiVariables,
} from './accessControl';

const conversionModeSchema = z.enum(['strict', 'rebus', 'hybrid']);
const conversionDifficultySchema = z.enum(['easy', 'medium', 'hard']);

const convertRequestSchema = z.object({
  title: z.string().min(1).max(200),
  options: z
    .object({
      mode: conversionModeSchema.default('hybrid'),
      maxEmojis: z.number().int().min(1).max(24).optional(),
      allowHomophones: z.boolean().optional(),
      allowPartialWords: z.boolean().optional(),
      allowPhoneticWords: z.boolean().optional(),
      allowAmbiguousPartWordPhonetics: z.boolean().optional(),
      ignoreArticles: z.boolean().optional(),
      requireAllImportantWords: z.boolean().optional(),
      targetDifficulty: conversionDifficultySchema.optional(),
    })
    .default({ mode: 'hybrid' }),
});

export const apiApp = new Hono<{
  Bindings: ApiBindings;
  Variables: ApiVariables;
}>();

apiApp.use(
  '/api/*',
  cors({
    origin: '*',
    allowHeaders: ['Content-Type'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  }),
);

apiApp.use('/api/convert', apiAccessControl);

apiApp.get('/api/health', (context) => {
  return context.json({ ok: true, service: 'emoji-translator-api' });
});

apiApp.post('/api/convert', async (context) => {
  const parsed = convertRequestSchema.safeParse(
    await context.req.json().catch(() => null),
  );

  if (!parsed.success) {
    return context.json(
      {
        error: 'Invalid request',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      400,
    );
  }

  return context.json(
    convertMovieTitleToEmoji(parsed.data.title, parsed.data.options),
  );
});

apiApp.notFound((context) => {
  return context.json({ error: 'Not found' }, 404);
});
