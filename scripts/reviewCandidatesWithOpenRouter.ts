import { existsSync, readFileSync } from 'node:fs';

import { writeJson, type CandidateReview } from './corpusTools';

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

function parseEnvFile(path: string) {
  if (!existsSync(path)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        const key =
          separator === -1 ? line.trim() : line.slice(0, separator).trim();
        const rawValue = separator === -1 ? '' : line.slice(separator + 1);
        const value = rawValue.trim().replace(/^['"]|['"]$/g, '');

        return [key, value] as const;
      }),
  );
}

function apiKey() {
  const fromProcess = process.env.OPEN_ROUTER_API_KEY;

  if (fromProcess) {
    return fromProcess;
  }

  return parseEnvFile('.env').OPEN_ROUTER_API_KEY;
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

function parseJsonObject(raw: string) {
  try {
    return JSON.parse(raw) as { suggestions?: LlmSuggestion[] };
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);

    if (fenced) {
      return JSON.parse(fenced[1] ?? '{}') as { suggestions?: LlmSuggestion[] };
    }

    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');

    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(raw.slice(start, end + 1)) as {
        suggestions?: LlmSuggestion[];
      };
    }

    throw new Error('OpenRouter response did not contain a JSON object.');
  }
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
  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        'x-title': 'EmojiTranslator candidate review',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are a conservative data reviewer for a deterministic emoji rebus converter. Return compact valid JSON only.',
          },
          {
            role: 'user',
            content: promptFor(candidates),
          },
        ],
        response_format: { type: 'json_object' },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}: ${await response.text()}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenRouter response did not include message content.');
  }

  return validSuggestions(parseJsonObject(content).suggestions);
}

const options = parseArgs();
const key = apiKey();

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
