import { z } from 'zod';

const clientEnvSchema = z.object({
  MODE: z.string(),
  DEV: z.boolean(),
  PROD: z.boolean(),
});

export const clientEnv = clientEnvSchema.parse({
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
});
