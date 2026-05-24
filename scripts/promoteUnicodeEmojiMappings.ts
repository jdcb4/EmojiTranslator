import { readFileSync } from 'node:fs';

import { writeJson } from './corpusTools';

type EmojiConcept = {
  id: string;
  emoji: string;
  canonicalWord: string;
  displayName: string;
  directWords: string[];
  plurals: string[];
  synonyms: string[];
  relatedWords: string[];
  category: string;
  recognisability: number;
  ambiguity: number;
  quizUsefulness: number;
  source: 'unicode_cldr' | 'curated' | 'llm_assisted' | 'manual_reviewed';
  notes?: string;
};

type ReviewedEmojiEntry = {
  emoji: string;
  codepoints: string[];
  unicodeName: string;
  group: string;
  subgroup: string;
  primaryWord: string | null;
  reviewedPrimaryWord: string;
  aliases: string[];
};

type Options = {
  input: string;
  concepts: string;
  summary: string;
};

const CATEGORY_BY_GROUP: Record<string, string> = {
  'Smileys & Emotion': 'emotion',
  'People & Body': 'person',
  'Animals & Nature': 'nature',
  'Food & Drink': 'food',
  'Travel & Places': 'place',
  Activities: 'action',
  Objects: 'object',
  Symbols: 'symbol',
  Flags: 'symbol',
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    input: 'review/unicode-emoji-llm-review.json',
    concepts: 'src/data/converter/emoji-concepts.json',
    summary: 'review/unicode-promotion-summary.json',
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--input') {
      options.input = args[index + 1] ?? options.input;
      index += 1;
    } else if (arg === '--concepts') {
      options.concepts = args[index + 1] ?? options.concepts;
      index += 1;
    } else if (arg === '--summary') {
      options.summary = args[index + 1] ?? options.summary;
      index += 1;
    }
  }

  return options;
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

function unique(words: string[]) {
  return [...new Set(words.filter(Boolean))];
}

function validWord(word: string) {
  return /^[a-z0-9][a-z0-9]{1,23}$/.test(word) && !BLOCKED_WORDS.has(word);
}

const BLOCKED_WORDS = new Set([
  'about',
  'after',
  'am',
  'an',
  'and',
  'as',
  'at',
  'be',
  'been',
  'before',
  'by',
  'do',
  'for',
  'from',
  'he',
  'her',
  'him',
  'his',
  'how',
  'i',
  'in',
  'is',
  'it',
  'its',
  'me',
  'my',
  'of',
  'on',
  'or',
  'our',
  'she',
  'the',
  'their',
  'there',
  'they',
  'to',
  'us',
  'we',
  'what',
  'when',
  'where',
  'who',
  'why',
  'with',
  'you',
  'your',
]);

function pluralFor(word: string) {
  if (word.length <= 2 || /\d/.test(word)) {
    return [];
  }

  if (word.endsWith('y') && !/[aeiou]y$/.test(word)) {
    return [`${word.slice(0, -1)}ies`];
  }

  if (/(s|x|z|ch|sh)$/.test(word)) {
    return [`${word}es`];
  }

  return [`${word}s`];
}

function categoryFor(entry: ReviewedEmojiEntry) {
  if (entry.group === 'People & Body' && entry.subgroup.includes('body')) {
    return 'body';
  }

  if (entry.group === 'Animals & Nature' && entry.subgroup.includes('animal')) {
    return 'animal';
  }

  if (
    entry.group === 'Travel & Places' &&
    ['transport-air', 'transport-ground', 'transport-water'].includes(
      entry.subgroup,
    )
  ) {
    return 'vehicle';
  }

  return CATEGORY_BY_GROUP[entry.group] ?? 'object';
}

function toConcept(entry: ReviewedEmojiEntry): EmojiConcept | null {
  const primary = entry.reviewedPrimaryWord;

  if (!validWord(primary)) {
    return null;
  }

  const aliases = unique(entry.aliases).filter(
    (alias) => validWord(alias) && alias !== primary,
  );

  return {
    id: `unicode_${slug(primary)}_${entry.codepoints.join('_').toLowerCase()}`,
    emoji: entry.emoji,
    canonicalWord: primary,
    displayName: entry.unicodeName,
    directWords: unique([primary]),
    plurals: unique(pluralFor(primary)),
    synonyms: [],
    relatedWords: aliases,
    category: categoryFor(entry),
    recognisability: 0.76,
    ambiguity: 0.3,
    quizUsefulness: 0.7,
    source: entry.primaryWord ? 'unicode_cldr' : 'llm_assisted',
    notes: `Unicode Emoji 17.0 CLDR short name: ${entry.unicodeName}`,
  };
}

const options = parseArgs();
const concepts = JSON.parse(
  readFileSync(options.concepts, 'utf8'),
) as EmojiConcept[];
const review = JSON.parse(readFileSync(options.input, 'utf8')) as {
  entries: ReviewedEmojiEntry[];
};
const existingIds = new Set(concepts.map((concept) => concept.id));
const existingEmoji = new Set(concepts.map((concept) => concept.emoji));
const notAlreadyMapped = review.entries.filter(
  (entry) => !existingEmoji.has(entry.emoji),
);
const convertedConcepts = notAlreadyMapped.map(toConcept);
const invalidPrimaryWordCount = convertedConcepts.filter(
  (concept) => concept === null,
).length;
const additions = convertedConcepts
  .filter((concept): concept is EmojiConcept => concept !== null)
  .filter((concept) => !existingIds.has(concept.id));

concepts.push(...additions);
writeJson(options.concepts, concepts);
writeJson(options.summary, {
  generatedAt: new Date().toISOString(),
  source: options.input,
  existingConceptCount: concepts.length - additions.length,
  addedConceptCount: additions.length,
  finalConceptCount: concepts.length,
  skippedAlreadyMappedEmojiCount:
    review.entries.length - notAlreadyMapped.length,
  skippedInvalidPrimaryWordCount: invalidPrimaryWordCount,
  sampleAdditions: additions.slice(0, 20).map((concept) => ({
    emoji: concept.emoji,
    canonicalWord: concept.canonicalWord,
    aliases: concept.relatedWords,
    unicodeName: concept.displayName,
  })),
});

console.log(`Added ${additions.length} Unicode-derived concepts.`);
console.log(`Final concept count: ${concepts.length}`);
