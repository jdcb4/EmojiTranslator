import { readFileSync } from 'node:fs';

import { singulariseToken } from '../src/domain/converter/normaliseToken';
import type { EmojiConcept, EmojiConceptCategory } from '../src/types/emoji';
import { writeJson } from './corpusTools';

type HomophoneEntry = {
  input: string;
  soundsLike: string;
  emoji: string;
  confidence: number;
  example?: string;
};

type CompoundRule = {
  input: string;
  parts: string[];
  emoji: string;
  rule: 'compound' | 'partial_word';
};

type LlmSuggestion = {
  word: string;
  recommendedAction:
    | 'direct_mapping'
    | 'synonym'
    | 'homophone'
    | 'part_word'
    | 'omit'
    | string;
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

type Options = {
  input: string;
  concepts: string;
  homophones: string;
  compoundRules: string;
  summary: string;
  threshold: number;
};

const BLOCKED_DIRECT_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'be',
  'been',
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

const CATEGORY_HINTS: Array<[EmojiConceptCategory, RegExp]> = [
  ['animal', /\b(animal|bird|bull|calf|cat|dog|lion|snake|wolf)\b/i],
  ['person', /\b(man|woman|person|judge|saint|priest|rank|thief)\b/i],
  ['body', /\b(face|hand|eye|heart|scar)\b/i],
  ['place', /\b(apartment|building|road|town|paradise|room)\b/i],
  ['vehicle', /\b(car|ship|train|plane|sailboat)\b/i],
  ['nature', /\b(fire|mountain|sand|water|dune|ridge)\b/i],
  ['weather', /\b(hail|storm|weather)\b/i],
  ['food', /\b(food|berry|fruit)\b/i],
  ['emotion', /\b(worry|curse|like)\b/i],
  ['action', /\b(run|rush|stand|hunting|strike)\b/i],
  ['number', /\b(twelve|million|volume)\b/i],
  ['time', /\b(now|clock|requiem)\b/i],
  ['crime', /\b(murder|prosecution|prisoner)\b/i],
  ['symbol', /\b(arc|sign|chaos|grail|times|sparkles|west)\b/i],
];

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    input: 'review/llm-candidate-suggestions.json',
    concepts: 'src/data/converter/emoji-concepts.json',
    homophones: 'src/data/converter/homophones.json',
    compoundRules: 'src/data/converter/compound-rules.json',
    summary: 'review/llm-candidate-promotion-summary.json',
    threshold: 0.85,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--input') {
      options.input = args[index + 1] ?? options.input;
      index += 1;
    } else if (arg === '--concepts') {
      options.concepts = args[index + 1] ?? options.concepts;
      index += 1;
    } else if (arg === '--homophones') {
      options.homophones = args[index + 1] ?? options.homophones;
      index += 1;
    } else if (arg === '--compound-rules') {
      options.compoundRules = args[index + 1] ?? options.compoundRules;
      index += 1;
    } else if (arg === '--summary') {
      options.summary = args[index + 1] ?? options.summary;
      index += 1;
    } else if (arg === '--threshold') {
      options.threshold = Number(args[index + 1] ?? options.threshold);
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
    .slice(0, 60);
}

function normaliseWord(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function isValidWord(word: string) {
  return /^[a-z0-9][a-z0-9]{1,31}$/.test(word);
}

function isPromotableDirectWord(word: string) {
  return isValidWord(word) && !BLOCKED_DIRECT_WORDS.has(word);
}

function hasUsableEmoji(value: string | undefined) {
  return Boolean(value && value.trim().length > 0 && !/\s/.test(value));
}

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

function categoryFor(suggestion: LlmSuggestion): EmojiConceptCategory {
  const text = [
    suggestion.word,
    suggestion.directMapping?.conceptName,
    suggestion.directMapping?.reason,
    suggestion.homophones?.map((entry) => entry.soundsLike).join(' '),
    suggestion.partWord?.parts
      .map((part) => part.soundsLike ?? part.input)
      .join(' '),
  ]
    .filter(Boolean)
    .join(' ');

  return (
    CATEGORY_HINTS.find(([, regex]) => regex.test(text))?.[0] ?? 'abstract'
  );
}

function existingMappedWords(concepts: EmojiConcept[]) {
  const words = new Set<string>();

  for (const concept of concepts) {
    for (const word of [
      concept.canonicalWord,
      ...concept.directWords,
      ...concept.plurals,
      ...concept.synonyms,
      ...concept.relatedWords,
      ...(concept.homophones ?? []),
      ...(concept.soundAlikes ?? []),
    ]) {
      words.add(normaliseWord(word));
    }
  }

  return words;
}

function toDirectConcept(
  suggestion: LlmSuggestion,
  existingIds: Set<string>,
): EmojiConcept | null {
  const word = normaliseWord(suggestion.word);
  const mapping = suggestion.directMapping;

  if (
    !mapping ||
    !isPromotableDirectWord(word) ||
    !hasUsableEmoji(mapping.emoji)
  ) {
    return null;
  }

  const conceptWord = normaliseWord(mapping.conceptName);
  const singular = singulariseToken(word);
  const canonicalWord =
    word.endsWith('s') && singular !== word && singular.length > 2
      ? singular
      : word;
  const directWords = unique([
    canonicalWord,
    word,
    ...(isPromotableDirectWord(conceptWord) ? [conceptWord] : []),
  ]);
  const plurals = unique([
    ...pluralFor(canonicalWord),
    ...(word !== canonicalWord ? [word] : []),
  ]).filter((plural) => !directWords.includes(plural));
  const id = `llm_${slug(word)}_${slug(mapping.conceptName || word)}`;

  if (existingIds.has(id)) {
    return null;
  }

  return {
    id,
    emoji: mapping.emoji,
    canonicalWord,
    displayName: mapping.conceptName || word,
    directWords,
    plurals,
    synonyms: [],
    relatedWords: [],
    category: categoryFor(suggestion),
    recognisability: Number(Math.max(0.68, suggestion.confidence).toFixed(2)),
    ambiguity: Number(Math.max(0.12, 1 - suggestion.confidence).toFixed(2)),
    quizUsefulness: Number(
      Math.max(0.65, suggestion.confidence - 0.05).toFixed(2),
    ),
    source: 'llm_assisted',
    notes: `Promoted from movie corpus LLM review (${suggestion.recommendedAction}): ${mapping.reason}`,
  };
}

function toHomophoneEntries(suggestion: LlmSuggestion): HomophoneEntry[] {
  const sourceInput = normaliseWord(suggestion.word);

  return (suggestion.homophones ?? [])
    .map((entry) => ({
      input: normaliseWord(entry.input || sourceInput),
      soundsLike: normaliseWord(entry.soundsLike),
      emoji: entry.emoji,
      confidence: Number(Math.min(0.95, suggestion.confidence).toFixed(2)),
      example: `Promoted from movie corpus LLM review: ${entry.reason}`,
    }))
    .filter(
      (entry) =>
        isValidWord(entry.input) &&
        isValidWord(entry.soundsLike) &&
        hasUsableEmoji(entry.emoji),
    );
}

function toCompoundRule(suggestion: LlmSuggestion): CompoundRule | null {
  const input = normaliseWord(suggestion.word);
  const parts = suggestion.partWord?.parts ?? [];

  if (!isValidWord(input) || parts.length < 2) {
    return null;
  }

  const normalisedParts = parts
    .map((part) => normaliseWord(part.soundsLike ?? part.input))
    .filter(isValidWord);
  const emoji = parts.map((part) => part.emoji).join('');

  if (
    normalisedParts.length !== parts.length ||
    normalisedParts.length < 2 ||
    !hasUsableEmoji(emoji)
  ) {
    return null;
  }

  return {
    input,
    parts: normalisedParts,
    emoji,
    rule: 'partial_word',
  };
}

const options = parseArgs();
const concepts = JSON.parse(
  readFileSync(options.concepts, 'utf8'),
) as EmojiConcept[];
const homophones = JSON.parse(
  readFileSync(options.homophones, 'utf8'),
) as HomophoneEntry[];
const compoundRules = JSON.parse(
  readFileSync(options.compoundRules, 'utf8'),
) as CompoundRule[];
const suggestions = JSON.parse(
  readFileSync(options.input, 'utf8'),
) as LlmSuggestionFile;

const existingIds = new Set(concepts.map((concept) => concept.id));
const mappedWords = existingMappedWords(concepts);
const homophoneInputs = new Set(homophones.map((entry) => entry.input));
const compoundInputs = new Set(compoundRules.map((rule) => rule.input));
const addedConcepts: EmojiConcept[] = [];
const addedHomophones: HomophoneEntry[] = [];
const addedCompoundRules: CompoundRule[] = [];
const skipped: Array<{ word: string; reason: string }> = [];

for (const suggestion of suggestions.suggestions) {
  const word = normaliseWord(suggestion.word);

  if (suggestion.confidence < options.threshold) {
    skipped.push({ word, reason: 'below threshold' });
    continue;
  }

  if (
    !['direct_mapping', 'synonym', 'homophone', 'part_word'].includes(
      suggestion.recommendedAction,
    )
  ) {
    skipped.push({
      word,
      reason: `unsupported action ${suggestion.recommendedAction}`,
    });
    continue;
  }

  if (suggestion.recommendedAction === 'homophone') {
    const newEntries = toHomophoneEntries(suggestion).filter(
      (entry) => !homophoneInputs.has(entry.input),
    );

    for (const entry of newEntries) {
      homophones.push(entry);
      homophoneInputs.add(entry.input);
      addedHomophones.push(entry);
    }

    if (newEntries.length === 0) {
      skipped.push({ word, reason: 'no new valid homophone' });
    }

    continue;
  }

  if (suggestion.recommendedAction === 'part_word') {
    const rule = toCompoundRule(suggestion);

    if (rule && !compoundInputs.has(rule.input)) {
      compoundRules.push(rule);
      compoundInputs.add(rule.input);
      addedCompoundRules.push(rule);
    } else {
      skipped.push({ word, reason: 'no new valid part-word rule' });
    }

    continue;
  }

  if (mappedWords.has(word) || mappedWords.has(singulariseToken(word))) {
    skipped.push({ word, reason: 'already mapped' });
    continue;
  }

  const concept = toDirectConcept(suggestion, existingIds);

  if (!concept) {
    skipped.push({ word, reason: 'no valid direct concept' });
    continue;
  }

  concepts.push(concept);
  existingIds.add(concept.id);
  for (const mappedWord of [
    concept.canonicalWord,
    ...concept.directWords,
    ...concept.plurals,
    ...concept.synonyms,
    ...concept.relatedWords,
  ]) {
    mappedWords.add(normaliseWord(mappedWord));
  }
  addedConcepts.push(concept);
}

writeJson(options.concepts, concepts);
writeJson(options.homophones, homophones);
writeJson(options.compoundRules, compoundRules);
writeJson(options.summary, {
  generatedAt: new Date().toISOString(),
  source: options.input,
  threshold: options.threshold,
  model: suggestions.model,
  reviewedSuggestionCount: suggestions.suggestions.length,
  addedConceptCount: addedConcepts.length,
  addedHomophoneCount: addedHomophones.length,
  addedCompoundRuleCount: addedCompoundRules.length,
  addedTotal:
    addedConcepts.length + addedHomophones.length + addedCompoundRules.length,
  skippedCount: skipped.length,
  addedConcepts: addedConcepts.map((concept) => ({
    word: concept.canonicalWord,
    emoji: concept.emoji,
    displayName: concept.displayName,
  })),
  addedHomophones,
  addedCompoundRules,
  skipped,
});

console.log(
  `Added ${addedConcepts.length} concepts, ${addedHomophones.length} homophones, and ${addedCompoundRules.length} part-word rules.`,
);
