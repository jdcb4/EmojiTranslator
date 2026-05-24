import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { dictionary as cmuDictionary } from 'cmu-pronouncing-dictionary';

import { converterData } from '../src/data/converter/loadConverterData';
import type { RuleUsed } from '../src/types/conversion';
import type { EmojiConcept } from '../src/types/emoji';

type CandidateSource = Extract<RuleUsed, 'exact' | 'plural' | 'synonym'>;

type Candidate = {
  word: string;
  emoji: string;
  conceptId: string;
  source: CandidateSource;
  score: number;
  recognisability: number;
  quizUsefulness: number;
  ambiguity: number;
};

type HomophoneEntry = {
  input: string;
  candidates: Array<{
    word: string;
    emoji: string;
    conceptId: string;
    source: CandidateSource;
  }>;
};

const OUTPUT_PATH = resolve(
  'src',
  'data',
  'converter',
  'pronunciation-homophones.json',
);

const RULE_SCORES = {
  exact: 100,
  plural: 95,
  synonym: 80,
} as const;

const MAX_CANDIDATES = 3;
const MAX_WORD_LENGTH = 14;
const EXPLICIT_SHORT_INPUTS = new Set(['pi']);

function dictionaryWordKey(key: string) {
  return key.toLowerCase().replace(/\(\d+\)$/u, '');
}

function cleanPhones(phones: string) {
  return phones.split('#')[0]?.trim() ?? '';
}

function isRuntimeToken(word: string) {
  return /^[a-z]+$/u.test(word);
}

function canUseAsInput(word: string) {
  return (
    isRuntimeToken(word) &&
    word.length <= MAX_WORD_LENGTH &&
    (word.length >= 3 || EXPLICIT_SHORT_INPUTS.has(word))
  );
}

function likelySameWordLength(input: string, candidate: string) {
  const allowedDifference = input.length <= 4 ? 1 : 2;

  return Math.abs(input.length - candidate.length) <= allowedDifference;
}

function addCandidate(
  candidatesByPhone: Map<string, Candidate[]>,
  concept: EmojiConcept,
  word: string,
  source: CandidateSource,
  phonesByWord: Map<string, Set<string>>,
) {
  if (!isRuntimeToken(word)) {
    return;
  }

  const phones = phonesByWord.get(word);

  if (!phones) {
    return;
  }

  for (const phone of phones) {
    const candidates = candidatesByPhone.get(phone) ?? [];
    candidates.push({
      word,
      emoji: concept.emoji,
      conceptId: concept.id,
      source,
      score: RULE_SCORES[source],
      recognisability: concept.recognisability,
      quizUsefulness: concept.quizUsefulness,
      ambiguity: concept.ambiguity,
    });
    candidatesByPhone.set(phone, candidates);
  }
}

function buildPhonesByWord() {
  const phonesByWord = new Map<string, Set<string>>();

  for (const [rawWord, rawPhones] of Object.entries(cmuDictionary)) {
    const word = dictionaryWordKey(rawWord);
    const phones = cleanPhones(rawPhones);

    if (!isRuntimeToken(word) || phones.length === 0) {
      continue;
    }

    const phoneSet = phonesByWord.get(word) ?? new Set<string>();
    phoneSet.add(phones);
    phonesByWord.set(word, phoneSet);
  }

  return phonesByWord;
}

function candidateWeight(candidate: Candidate) {
  return (
    candidate.score * candidate.recognisability * candidate.quizUsefulness -
    candidate.ambiguity * 10
  );
}

function uniqueRankedCandidates(candidates: Candidate[]) {
  return [
    ...new Map(
      [...candidates]
        .sort((left, right) => candidateWeight(right) - candidateWeight(left))
        .map((candidate) => [candidate.conceptId, candidate]),
    ).values(),
  ];
}

const phonesByWord = buildPhonesByWord();
const candidatesByPhone = new Map<string, Candidate[]>();

for (const concept of converterData.emojiConcepts) {
  for (const word of [concept.canonicalWord, ...concept.directWords]) {
    addCandidate(candidatesByPhone, concept, word, 'exact', phonesByWord);
  }

  for (const word of concept.plurals) {
    addCandidate(candidatesByPhone, concept, word, 'plural', phonesByWord);
  }

  for (const word of concept.synonyms) {
    addCandidate(candidatesByPhone, concept, word, 'synonym', phonesByWord);
  }
}

const entries: HomophoneEntry[] = [];

for (const [input, phones] of [...phonesByWord.entries()].sort()) {
  if (!canUseAsInput(input)) {
    continue;
  }

  const candidates = uniqueRankedCandidates(
    [...phones]
      .flatMap((phone) => candidatesByPhone.get(phone) ?? [])
      .filter(
        (candidate) =>
          candidate.word !== input &&
          likelySameWordLength(input, candidate.word),
      ),
  );

  if (candidates.length === 0 || candidates.length > MAX_CANDIDATES) {
    continue;
  }

  entries.push({
    input,
    candidates: candidates.map((candidate) => ({
      word: candidate.word,
      emoji: candidate.emoji,
      conceptId: candidate.conceptId,
      source: candidate.source,
    })),
  });
}

writeFileSync(OUTPUT_PATH, `${JSON.stringify(entries, null, 2)}\n`);

console.log(`Generated ${entries.length} pronunciation homophone entries.`);
console.log(`Wrote ${OUTPUT_PATH}`);
