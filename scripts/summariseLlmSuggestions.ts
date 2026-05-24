import { readFileSync } from 'node:fs';

import { writeJson } from './corpusTools';

type Options = {
  input: string;
  output: string;
  promoteThreshold: number;
};

type LlmSuggestion = {
  word: string;
  recommendedAction: string;
  directMapping?: { emoji: string; conceptName: string; reason: string } | null;
  homophones?: Array<{
    input: string;
    soundsLike: string;
    emoji: string;
    reason: string;
  }>;
  partWord?: {
    parts: Array<{
      input: string;
      soundsLike: string | null;
      emoji: string;
      reason: string;
    }>;
  } | null;
  rejectReason?: string | null;
  confidence: number;
};

type LlmSuggestionFile = {
  model: string;
  source: string;
  requestedCandidateCount: number;
  suggestions: LlmSuggestion[];
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    input: 'review/large-llm-suggestions.json',
    output: 'review/large-llm-suggestions-summary.json',
    promoteThreshold: 0.85,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--input') {
      options.input = args[index + 1] ?? options.input;
      index += 1;
    } else if (arg === '--output') {
      options.output = args[index + 1] ?? options.output;
      index += 1;
    } else if (arg === '--promote-threshold') {
      options.promoteThreshold = Number(
        args[index + 1] ?? options.promoteThreshold,
      );
      index += 1;
    }
  }

  return options;
}

function emojiFor(suggestion: LlmSuggestion) {
  return (
    suggestion.directMapping?.emoji ??
    suggestion.homophones?.[0]?.emoji ??
    suggestion.partWord?.parts.map((part) => part.emoji).join('') ??
    null
  );
}

function reasonFor(suggestion: LlmSuggestion) {
  return (
    suggestion.directMapping?.reason ??
    suggestion.homophones?.[0]?.reason ??
    suggestion.partWord?.parts.map((part) => part.reason).join('; ') ??
    suggestion.rejectReason ??
    null
  );
}

function reviewEntry(suggestion: LlmSuggestion) {
  return {
    word: suggestion.word,
    action: suggestion.recommendedAction,
    confidence: suggestion.confidence,
    emoji: emojiFor(suggestion),
    directMapping: suggestion.directMapping ?? null,
    homophones: suggestion.homophones ?? [],
    partWord: suggestion.partWord ?? null,
    reason: reasonFor(suggestion),
  };
}

const options = parseArgs();
const data = JSON.parse(
  readFileSync(options.input, 'utf8'),
) as LlmSuggestionFile;
const actionCounts = data.suggestions.reduce<Record<string, number>>(
  (counts, suggestion) => {
    counts[suggestion.recommendedAction] =
      (counts[suggestion.recommendedAction] ?? 0) + 1;
    return counts;
  },
  {},
);
const nonOmitted = data.suggestions.filter(
  (suggestion) => suggestion.recommendedAction !== 'omit',
);
const summary = {
  generatedAt: new Date().toISOString(),
  source: options.input,
  model: data.model,
  requestedCandidateCount: data.requestedCandidateCount,
  suggestionCount: data.suggestions.length,
  actionCounts,
  maybePromote: nonOmitted
    .filter((suggestion) => suggestion.confidence >= options.promoteThreshold)
    .map(reviewEntry),
  needsManualReview: nonOmitted
    .filter((suggestion) => suggestion.confidence < options.promoteThreshold)
    .map(reviewEntry),
  omitted: data.suggestions
    .filter((suggestion) => suggestion.recommendedAction === 'omit')
    .map((suggestion) => ({
      word: suggestion.word,
      reason: suggestion.rejectReason,
      confidence: suggestion.confidence,
    })),
};

writeJson(options.output, summary);
console.log(`Wrote ${options.output}`);
