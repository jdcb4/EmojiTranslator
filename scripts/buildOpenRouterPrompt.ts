import { readFileSync } from 'node:fs';

import type { CandidateReview } from './corpusTools';

type Options = {
  input: string;
  limit: number;
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    input: 'review/candidate-review.json',
    limit: 25,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--input') {
      options.input = args[index + 1] ?? options.input;
      index += 1;
    } else if (arg === '--limit') {
      options.limit = Number(args[index + 1] ?? options.limit);
      index += 1;
    }
  }

  return options;
}

const options = parseArgs();
const review = JSON.parse(
  readFileSync(options.input, 'utf8'),
) as CandidateReview;
const candidates = review.candidates.slice(0, options.limit);

console.log(`We are expanding a deterministic title-to-emoji converter.
Suggest only fair strict or rebus mappings for these failed words.
Do not use plot knowledge, character knowledge, or title-specific trivia.
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

Be conservative. Prefer omit over a misleading clue.

Candidates:
${JSON.stringify(candidates, null, 2)}`);
