import { readFileSync } from 'node:fs';

import { convertMovieTitleToEmoji } from '../src/domain/converter/convertTitle';
import { writeJson } from './corpusTools';

type TitleKind = 'movie' | 'tv' | 'book' | 'unknown';

type CorpusEntry = {
  title?: unknown;
  kind?: unknown;
  source?: unknown;
  wikidataId?: unknown;
};

type GameClue = {
  id: string;
  code: string;
  title: string;
  emoji: string;
  kind: TitleKind;
  source: string;
  confidence: number;
};

type Options = {
  input: string;
  output: string;
  summary: string;
  minConfidence: number;
  maxEmojiUnits: number;
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    input: 'review/game-title-corpus.json',
    output: 'src/data/game/title-clues.json',
    summary: 'review/game-title-clues-summary.json',
    minConfidence: 0.9,
    maxEmojiUnits: 10,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--input') {
      options.input = args[index + 1] ?? options.input;
      index += 1;
    } else if (arg === '--output') {
      options.output = args[index + 1] ?? options.output;
      index += 1;
    } else if (arg === '--summary') {
      options.summary = args[index + 1] ?? options.summary;
      index += 1;
    } else if (arg === '--min-confidence') {
      options.minConfidence = Number(args[index + 1] ?? options.minConfidence);
      index += 1;
    } else if (arg === '--max-emoji-units') {
      options.maxEmojiUnits = Number(args[index + 1] ?? options.maxEmojiUnits);
      index += 1;
    }
  }

  return options;
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'title'
  );
}

function hashString(value: string) {
  let hash = 0x811c9dc5;

  for (const char of value) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function makeShareCode(value: string, salt: number) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let hash = hashString(`${value}:${salt}`);
  let code = '';

  for (let index = 0; index < 6; index += 1) {
    code += alphabet[hash % alphabet.length];
    hash = Math.floor(hash / alphabet.length);
  }

  return code;
}

function emojiUnitCount(emoji: string) {
  return (
    Array.from(emoji.matchAll(/\p{Emoji}/gu)).length || Array.from(emoji).length
  );
}

function readCorpus(path: string) {
  const data = JSON.parse(readFileSync(path, 'utf8')) as unknown;

  if (!Array.isArray(data)) {
    throw new Error('Game title corpus must be a JSON array.');
  }

  return data
    .map((entry): CorpusEntry => {
      if (typeof entry === 'string') {
        return { title: entry };
      }

      return entry && typeof entry === 'object' ? (entry as CorpusEntry) : {};
    })
    .filter((entry) => typeof entry.title === 'string' && entry.title.trim());
}

function titleKind(value: unknown): TitleKind {
  return value === 'movie' || value === 'tv' || value === 'book'
    ? value
    : 'unknown';
}

const options = parseArgs();
const corpus = readCorpus(options.input);
const accepted: GameClue[] = [];
const rejectedExamples: Array<{
  title: string;
  confidence: number;
  reason: string;
}> = [];
const usedIds = new Map<string, number>();
const usedCodes = new Set<string>();
const seenTitles = new Set<string>();
const seenEmojiTitlePairs = new Set<string>();

for (const entry of corpus) {
  const title = String(entry.title).trim();
  const titleKey = title.toLowerCase();

  if (seenTitles.has(titleKey)) {
    continue;
  }

  seenTitles.add(titleKey);

  const result = convertMovieTitleToEmoji(title, {
    mode: 'hybrid',
    maxEmojis: options.maxEmojiUnits,
  });
  const emoji = result.emoji;
  const hasUnmapped = result.tokens.some(
    (token) => token.ruleUsed === 'unmapped',
  );
  const reason = !emoji
    ? 'no emoji'
    : !result.accepted
      ? 'not accepted'
      : result.confidence < options.minConfidence
        ? 'below confidence threshold'
        : hasUnmapped
          ? 'has unmapped token'
          : emojiUnitCount(emoji) > options.maxEmojiUnits
            ? 'too many emoji'
            : '';

  if (reason) {
    if (rejectedExamples.length < 50) {
      rejectedExamples.push({
        title,
        confidence: result.confidence,
        reason,
      });
    }

    continue;
  }

  const pairKey = `${emoji}\u0000${titleKey}`;

  if (seenEmojiTitlePairs.has(pairKey)) {
    continue;
  }

  seenEmojiTitlePairs.add(pairKey);

  const baseId = slugify(title);
  const idCount = usedIds.get(baseId) ?? 0;
  usedIds.set(baseId, idCount + 1);
  const id = idCount === 0 ? baseId : `${baseId}-${idCount + 1}`;
  let salt = 0;
  let code = makeShareCode(`${id}:${title}:${entry.kind ?? ''}`, salt);

  while (usedCodes.has(code)) {
    salt += 1;
    code = makeShareCode(`${id}:${title}:${entry.kind ?? ''}`, salt);
  }

  usedCodes.add(code);

  accepted.push({
    id,
    code,
    title,
    emoji,
    kind: titleKind(entry.kind),
    source: typeof entry.source === 'string' ? entry.source : 'Local corpus',
    confidence: result.confidence,
  });
}

accepted.sort(
  (left, right) =>
    left.kind.localeCompare(right.kind) ||
    left.title.localeCompare(right.title),
);

const summary = {
  generatedAt: new Date().toISOString(),
  input: options.input,
  minConfidence: options.minConfidence,
  maxEmojiUnits: options.maxEmojiUnits,
  sourceTitles: corpus.length,
  accepted: accepted.length,
  rejected: corpus.length - accepted.length,
  acceptedByKind: accepted.reduce<Record<string, number>>((counts, clue) => {
    counts[clue.kind] = (counts[clue.kind] ?? 0) + 1;
    return counts;
  }, {}),
  rejectedExamples,
};

writeJson(options.output, accepted);
writeJson(options.summary, summary);

console.log(`Wrote ${accepted.length} game clues to ${options.output}`);
console.log(`Wrote generation summary to ${options.summary}`);
