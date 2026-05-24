import { doubleMetaphone } from 'double-metaphone';

import { converterData } from '../../data/converter/loadConverterData';
import type { TokenConversion } from '../../types/conversion';
import type { EmojiConcept } from '../../types/emoji';

type PhoneticCandidate = {
  word: string;
  emoji: string;
  conceptId: string;
  concept: EmojiConcept;
};

const MIN_WORD_LENGTH = 3;
const MAX_WORD_LENGTH = 14;
const MAX_PHONETIC_CANDIDATES = 2;
const PHONETIC_WORD_SCORE = 42;

function phoneticCodes(value: string) {
  return [...new Set(doubleMetaphone(value).filter(Boolean))];
}

function addPhoneticWords(
  index: Map<string, PhoneticCandidate[]>,
  concept: EmojiConcept,
  words: string[],
) {
  for (const word of words) {
    if (!/^[a-z]+$/.test(word)) {
      continue;
    }

    for (const code of phoneticCodes(word)) {
      const candidates = index.get(code) ?? [];
      candidates.push({
        word,
        emoji: concept.emoji,
        conceptId: concept.id,
        concept,
      });
      index.set(code, candidates);
    }
  }
}

function buildPhoneticIndex() {
  const index = new Map<string, PhoneticCandidate[]>();

  for (const concept of converterData.emojiConcepts) {
    addPhoneticWords(index, concept, [
      concept.canonicalWord,
      ...concept.directWords,
      ...concept.plurals,
      ...concept.synonyms,
    ]);
  }

  return index;
}

const phoneticIndex = buildPhoneticIndex();

function candidateWeight(candidate: PhoneticCandidate) {
  return (
    candidate.concept.recognisability * candidate.concept.quizUsefulness -
    candidate.concept.ambiguity * 0.1
  );
}

function likelySameWordLength(token: string, candidate: string) {
  const allowedDifference = token.length <= 4 ? 2 : 1;

  return Math.abs(candidate.length - token.length) <= allowedDifference;
}

function candidatesFor(token: string) {
  return [
    ...new Map(
      phoneticCodes(token)
        .flatMap((code) => phoneticIndex.get(code) ?? [])
        .filter(
          (candidate) =>
            candidate.word !== token &&
            likelySameWordLength(token, candidate.word),
        )
        .map((candidate) => [candidate.conceptId, candidate]),
    ).values(),
  ];
}

export function phoneticWordFallbackMatch(token: {
  original: string;
  normalised: string;
}): TokenConversion | null {
  if (
    token.normalised.length < MIN_WORD_LENGTH ||
    token.normalised.length > MAX_WORD_LENGTH ||
    !/^[a-z]+$/.test(token.normalised)
  ) {
    return null;
  }

  const candidates = candidatesFor(token.normalised);

  if (candidates.length === 0 || candidates.length > MAX_PHONETIC_CANDIDATES) {
    return null;
  }

  const [candidate] = candidates.sort(
    (left, right) => candidateWeight(right) - candidateWeight(left),
  );

  if (!candidate) {
    return null;
  }

  return {
    token: token.original,
    normalised: token.normalised,
    emoji: candidate.emoji,
    ruleUsed: 'phonetic_word_fallback',
    scoreImpact: PHONETIC_WORD_SCORE,
    explanation: `${token.original} sounds like ${candidate.word}, represented by ${candidate.emoji}`,
  } satisfies TokenConversion;
}
