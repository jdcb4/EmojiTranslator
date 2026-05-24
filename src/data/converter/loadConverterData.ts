import { z } from 'zod';

import compoundRulesJson from './compound-rules.json';
import emojiConceptsJson from './emoji-concepts.json';
import homophonesJson from './homophones.json';
import movieTitleTestSetJson from './movie-title-test-set.json';
import pronunciationHomophonesJson from './pronunciation-homophones.json';

const categorySchema = z.enum([
  'animal',
  'person',
  'body',
  'object',
  'place',
  'vehicle',
  'nature',
  'weather',
  'space',
  'food',
  'emotion',
  'action',
  'symbol',
  'number',
  'time',
  'fantasy',
  'crime',
  'abstract',
]);

const emojiConceptSchema = z.object({
  id: z.string().min(1),
  emoji: z.string().min(1),
  canonicalWord: z.string().min(1),
  displayName: z.string().min(1),
  directWords: z.array(z.string().min(1)),
  plurals: z.array(z.string().min(1)),
  synonyms: z.array(z.string().min(1)),
  relatedWords: z.array(z.string().min(1)),
  homophones: z.array(z.string().min(1)).optional(),
  soundAlikes: z.array(z.string().min(1)).optional(),
  category: categorySchema,
  recognisability: z.number().min(0).max(1),
  ambiguity: z.number().min(0).max(1),
  quizUsefulness: z.number().min(0).max(1),
  source: z.enum([
    'unicode_cldr',
    'curated',
    'llm_assisted',
    'manual_reviewed',
  ]),
  notes: z.string().optional(),
});

const homophoneSchema = z.object({
  input: z.string().min(1),
  soundsLike: z.string().min(1),
  emoji: z.string().min(1),
  confidence: z.number().min(0).max(1),
  example: z.string().optional(),
});

const compoundRuleSchema = z.object({
  input: z.string().min(1),
  parts: z.array(z.string().min(1)).min(2),
  emoji: z.string().min(1),
  rule: z.enum(['compound', 'partial_word']),
});

const pronunciationHomophoneSchema = z.object({
  input: z.string().min(1),
  candidates: z
    .array(
      z.object({
        word: z.string().min(1),
        emoji: z.string().min(1),
        conceptId: z.string().min(1),
        source: z.enum(['exact', 'plural', 'synonym']),
      }),
    )
    .min(1)
    .max(3),
});

export const converterData = {
  emojiConcepts: z.array(emojiConceptSchema).parse(emojiConceptsJson),
  homophones: z.array(homophoneSchema).parse(homophonesJson),
  compoundRules: z.array(compoundRuleSchema).parse(compoundRulesJson),
  pronunciationHomophones: z
    .array(pronunciationHomophoneSchema)
    .parse(pronunciationHomophonesJson),
  movieTitleTestSet: z.array(z.string().min(1)).parse(movieTitleTestSetJson),
};

export type ConverterData = typeof converterData;
