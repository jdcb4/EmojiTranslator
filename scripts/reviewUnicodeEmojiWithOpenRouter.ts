import { existsSync, readFileSync } from 'node:fs';

import { writeJson } from './corpusTools';
import { openRouterApiKey, openRouterJson } from './openRouterUtils';

type UnicodeEmojiEntry = {
  emoji: string;
  codepoints: string[];
  unicodeName: string;
  group: string;
  subgroup: string;
  primaryWord: string | null;
};

type ReviewedEmojiEntry = UnicodeEmojiEntry & {
  reviewedPrimaryWord: string;
  aliases: string[];
};

type Options = {
  input: string;
  output: string;
  model: string;
  batchSize: number;
  limit?: number;
  resume: boolean;
};

type PrimaryResponse = {
  meanings: Array<{ emoji: string; word: string }>;
};

type AliasResponse = {
  aliases: Array<{ emoji: string; words: string[] }>;
};

const WORD_PATTERN = /^[a-z0-9][a-z0-9]{0,23}$/;
const BLOCKED_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'of',
  'in',
  'on',
  'at',
  'to',
  'for',
  'with',
  'from',
]);

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    input: 'review/unicode-base-emojis.json',
    output: 'review/unicode-emoji-llm-review.json',
    model: 'google/gemini-3-flash-preview',
    batchSize: 80,
    resume: true,
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
      options.limit = Number(args[index + 1]);
      index += 1;
    } else if (arg === '--no-resume') {
      options.resume = false;
    }
  }

  return options;
}

function cleanWord(word: string) {
  return word
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '');
}

function validWord(word: string) {
  return WORD_PATTERN.test(word) && !BLOCKED_WORDS.has(word);
}

function fallbackPrimaryWord(entry: UnicodeEmojiEntry) {
  return (
    entry.primaryWord ??
    cleanWord(entry.unicodeName.split(/\s+/).find(Boolean) ?? '') ??
    'emoji'
  );
}

async function reviewPrimaryWords(
  apiKey: string,
  model: string,
  entries: UnicodeEmojiEntry[],
) {
  const needsReview = entries.filter((entry) => !entry.primaryWord);

  if (needsReview.length === 0) {
    return new Map<string, string>();
  }

  const response = await openRouterJson<PrimaryResponse>({
    apiKey,
    model,
    title: 'EmojiTranslator Unicode primary meanings',
    system:
      'You assign conservative one-word meanings to Unicode emoji. Return compact valid JSON only.',
    user: `Purpose: EmojiTranslator maps title words to emoji. Unicode provides multi-word CLDR short names for many emoji. For each emoji, choose the most prominent one-word English meaning someone would expect in a quiz clue. Use lowercase ASCII, one word only, no spaces, no punctuation. Prefer concrete nouns. If the emoji is a flag, use the common one-word country/place name where possible.

Return JSON only:
{ "meanings": [{ "emoji": "string", "word": "string" }] }

Emoji:
${JSON.stringify(
  needsReview.map((entry) => ({
    emoji: entry.emoji,
    unicodeName: entry.unicodeName,
    group: entry.group,
    subgroup: entry.subgroup,
  })),
)}`,
  });

  return new Map(
    response.meanings
      .map((entry) => [entry.emoji, cleanWord(entry.word)] as const)
      .filter(([, word]) => validWord(word)),
  );
}

async function reviewAliases(
  apiKey: string,
  model: string,
  entries: ReviewedEmojiEntry[],
) {
  const response = await openRouterJson<AliasResponse>({
    apiKey,
    model,
    title: 'EmojiTranslator Unicode emoji aliases',
    system:
      'You generate conservative one-word aliases for Unicode emoji title matching. Return compact valid JSON only.',
    user: `Purpose: EmojiTranslator is a deterministic title-to-emoji converter. We need extra one-word aliases or associated concepts that people commonly know an emoji as, so title words can map to the right emoji. Include shortened names and closely associated concepts only. Example: champagne could include pop or cork if the emoji clearly supports that association. Do not use obscure trivia, brand names, movie plots, multi-word phrases, or vague emotions unless obvious.

For each emoji return up to 5 lowercase ASCII one-word aliases. They must be single words, no spaces, no punctuation, length 1-24. Do not repeat the primary word.

Return JSON only:
{ "aliases": [{ "emoji": "string", "words": ["string"] }] }

Emoji:
${JSON.stringify(
  entries.map((entry) => ({
    emoji: entry.emoji,
    unicodeName: entry.unicodeName,
    primaryWord: entry.reviewedPrimaryWord,
    group: entry.group,
    subgroup: entry.subgroup,
  })),
)}`,
  });

  return new Map(
    response.aliases.map(
      (entry) =>
        [
          entry.emoji,
          [...new Set(entry.words.map(cleanWord))]
            .filter((word) => validWord(word))
            .slice(0, 5),
        ] as const,
    ),
  );
}

function existingReview(path: string) {
  if (!existsSync(path)) {
    return new Map<string, ReviewedEmojiEntry>();
  }

  const data = JSON.parse(readFileSync(path, 'utf8')) as {
    entries?: ReviewedEmojiEntry[];
  };

  return new Map((data.entries ?? []).map((entry) => [entry.emoji, entry]));
}

const options = parseArgs();
const apiKey = openRouterApiKey();

if (!apiKey) {
  throw new Error(
    'OPEN_ROUTER_API_KEY was not found in the process environment or .env.',
  );
}

const baseEntries = (
  JSON.parse(readFileSync(options.input, 'utf8')) as UnicodeEmojiEntry[]
).slice(0, options.limit);
const reviewedByEmoji = options.resume
  ? existingReview(options.output)
  : new Map<string, ReviewedEmojiEntry>();

for (let start = 0; start < baseEntries.length; start += options.batchSize) {
  const batch = baseEntries.slice(start, start + options.batchSize);
  const pending = batch.filter((entry) => !reviewedByEmoji.has(entry.emoji));

  if (pending.length === 0) {
    continue;
  }

  console.log(
    `Reviewing Unicode emoji ${start + 1}-${start + batch.length}...`,
  );
  const primaryWords = await reviewPrimaryWords(apiKey, options.model, pending);
  const withPrimary = pending.map((entry) => ({
    ...entry,
    reviewedPrimaryWord:
      entry.primaryWord ??
      primaryWords.get(entry.emoji) ??
      fallbackPrimaryWord(entry),
    aliases: [],
  }));
  const aliasWords = await reviewAliases(apiKey, options.model, withPrimary);

  for (const entry of withPrimary) {
    const aliases = (aliasWords.get(entry.emoji) ?? []).filter(
      (word) => word !== entry.reviewedPrimaryWord,
    );
    reviewedByEmoji.set(entry.emoji, { ...entry, aliases });
  }

  writeJson(options.output, {
    generatedAt: new Date().toISOString(),
    source: options.input,
    model: options.model,
    entryCount: reviewedByEmoji.size,
    entries: [...reviewedByEmoji.values()],
  });
}

console.log(`Wrote ${reviewedByEmoji.size} reviewed emoji entries.`);
console.log(`Wrote ${options.output}`);
