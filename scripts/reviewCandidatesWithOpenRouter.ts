import { readFileSync } from 'node:fs';

import { writeJson, type CandidateReview } from './corpusTools';
import { openRouterApiKey, openRouterJson } from './openRouterUtils';

type Options = {
  input: string;
  output: string;
  model: string;
  batchSize: number;
  limit: number;
};

type LlmSuggestion = {
  word: string;
  recommendedAction:
    | 'direct_mapping'
    | 'synonym'
    | 'homophone'
    | 'part_word'
    | 'omit';
  directMapping: { emoji: string; conceptName: string; reason: string } | null;
  homophones: Array<{
    input: string;
    soundsLike: string;
    emoji: string;
    reason: string;
  }>;
  partWord: {
    parts: Array<{
      input: string;
      soundsLike: string | null;
      emoji: string;
      reason: string;
    }>;
  } | null;
  rejectReason: string | null;
  confidence: number;
};

type ReviewOutput = {
  generatedAt: string;
  model: string;
  source: string;
  requestedCandidateCount: number;
  suggestions: LlmSuggestion[];
  batches: Array<{
    start: number;
    count: number;
    suggestionCount: number;
  }>;
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    input: 'review/candidate-review.json',
    output: 'review/llm-candidate-suggestions.json',
    model: 'google/gemini-3-flash-preview',
    batchSize: 40,
    limit: 120,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--input') {
      options.input = args[index + 1] ?? options.input;
      index += 1;
    } else if (arg === '--output') {
      options.output = args[index + 1] ?? options.output;
      index += 1;
    } else if (arg === '--model') {
      options.model = args[index + 1] ?? options.model;
      index += 1;
    } else if (arg === '--batch-size') {
      options.batchSize = Number(args[index + 1] ?? options.batchSize);
      index += 1;
    } else if (arg === '--limit') {
      options.limit = Number(args[index + 1] ?? options.limit);
      index += 1;
    }
  }

  return options;
}

function promptFor(candidates: CandidateReview['candidates']) {
  return `We are expanding a deterministic title-to-emoji converter.
Suggest only fair strict or rebus mappings for these failed words.
Do not use plot knowledge, character knowledge, or title-specific trivia.
Prefer reusable mappings over title-specific one-offs.
Reject short foreign articles and words that have no fair visual clue.

Return JSON only with this shape:
{
  "suggestions": [
    {
      "word": "string",
      "recommendedAction": "direct_mapping | synonym | homophone | part_word | omit",
      "directMapping": { "emoji": "string", "conceptName": "string", "reason": "string" } | null,
      "homophones": [{ "input": "string", "soundsLike": "string", "emoji": "string", "reason": "string" }],
      "partWord": { "parts": [{ "input": "string", "soundsLike": "string | null", "emoji": "string", "reason": "string" }] } | null,
      "rejectReason": "string | null",
      "confidence": 0.0
    }
  ]
}

Candidates:
${JSON.stringify(candidates, null, 2)}`;
}

function validSuggestions(value: unknown): LlmSuggestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (suggestion): suggestion is LlmSuggestion =>
      Boolean(suggestion) &&
      typeof suggestion === 'object' &&
      typeof (suggestion as LlmSuggestion).word === 'string',
  );
}

async function requestBatch(
  key: string,
  model: string,
  candidates: CandidateReview['candidates'],
) {
  const response = await openRouterJson<{ suggestions?: LlmSuggestion[] }>({
    apiKey: key,
    model,
    title: 'EmojiTranslator candidate review',
    system:
      'You are a conservative data reviewer for a deterministic emoji rebus converter. Return compact valid JSON only.',
    user: promptFor(candidates),
  });

  return validSuggestions(response.suggestions);
}

const options = parseArgs();
const key = openRouterApiKey();

if (!key) {
  throw new Error(
    'OPEN_ROUTER_API_KEY was not found in the process environment or .env.',
  );
}

const review = JSON.parse(
  readFileSync(options.input, 'utf8'),
) as CandidateReview;
const candidates = review.candidates.slice(0, options.limit);
const output: ReviewOutput = {
  generatedAt: new Date().toISOString(),
  model: options.model,
  source: options.input,
  requestedCandidateCount: candidates.length,
  suggestions: [],
  batches: [],
};

for (let start = 0; start < candidates.length; start += options.batchSize) {
  const batch = candidates.slice(start, start + options.batchSize);

  console.log(`Reviewing candidates ${start + 1}-${start + batch.length}...`);
  const suggestions = await requestBatch(key, options.model, batch);
  output.suggestions.push(...suggestions);
  output.batches.push({
    start,
    count: batch.length,
    suggestionCount: suggestions.length,
  });
}

writeJson(options.output, output);
console.log(
  `Wrote ${output.suggestions.length} suggestions to ${options.output}`,
);
