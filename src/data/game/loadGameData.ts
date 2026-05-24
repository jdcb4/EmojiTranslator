import { z } from 'zod';

import titleCluesJson from './title-clues.json';

const gameClueSchema = z.object({
  id: z.string().min(1),
  code: z.string().regex(/^[A-Z]{6}$/),
  title: z.string().min(1),
  emoji: z.string().min(1),
  kind: z.enum(['movie', 'tv', 'book', 'unknown']),
  source: z.string().min(1),
  highRecognition: z.boolean(),
  recognitionSources: z.array(z.string().min(1)),
  boxOfficeRank: z.number().positive().optional(),
  confidence: z.number().min(0).max(1),
});

export const gameClues = z.array(gameClueSchema).min(1).parse(titleCluesJson);

export type GameClue = (typeof gameClues)[number];
