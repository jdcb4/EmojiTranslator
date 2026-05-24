import { doubleMetaphone } from 'double-metaphone';
import english from 'hyphenation.en-us';
import Hypher from 'hypher';

import { converterData } from '../../data/converter/loadConverterData';
import type { TokenConversion } from '../../types/conversion';
import type { EmojiConcept } from '../../types/emoji';
import { findBestWordCandidate } from './lookupIndex';

type PartWordSource = 'exact' | 'homophone' | 'phonetic';

type PartWordChunkMatch = {
  chunk: string;
  matchedWord: string;
  emoji: string;
  source: PartWordSource;
  score: number;
};

type PhoneticCandidate = {
  word: string;
  emoji: string;
  conceptId: string;
  concept: EmojiConcept;
};

const MIN_WORD_LENGTH = 4;
const MAX_WORD_LENGTH = 14;
const MIN_CHUNK_LENGTH = 2;
const MAX_CHUNKS = 4;
const MAX_SEGMENTATIONS = 32;
const MAX_PHONETIC_CANDIDATES = 2;
const MIN_PATH_SCORE = 50;
const PROGRAMMATIC_PART_WORD_SCORE = 40;

const hyphenator = new Hypher(english);

function phoneticCodes(value: string) {
  return [...new Set(doubleMetaphone(value).filter(Boolean))];
}

function candidateWeight(candidate: PhoneticCandidate) {
  return (
    candidate.concept.recognisability * candidate.concept.quizUsefulness -
    candidate.concept.ambiguity * 0.1
  );
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

function dedupeSegmentations(segmentations: string[][]) {
  const seen = new Set<string>();
  const deduped: string[][] = [];

  for (const segmentation of segmentations) {
    if (
      segmentation.length < 2 ||
      segmentation.length > MAX_CHUNKS ||
      segmentation.some((chunk) => chunk.length < MIN_CHUNK_LENGTH)
    ) {
      continue;
    }

    const key = segmentation.join('|');

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(segmentation);
  }

  return deduped.slice(0, MAX_SEGMENTATIONS);
}

function groupHyphenatedParts(parts: string[]) {
  if (parts.length < 2) {
    return [];
  }

  const groupings: string[][] = [];
  const boundaryCount = parts.length - 1;
  const maxMask = 2 ** boundaryCount;

  for (let mask = 1; mask < maxMask; mask += 1) {
    const grouping: string[] = [];
    let current = parts[0] ?? '';

    for (let boundary = 0; boundary < boundaryCount; boundary += 1) {
      const nextPart = parts[boundary + 1] ?? '';

      if ((mask & (1 << boundary)) !== 0) {
        grouping.push(current);
        current = nextPart;
      } else {
        current += nextPart;
      }
    }

    grouping.push(current);
    groupings.push(grouping);
  }

  return groupings.sort((left, right) => left.length - right.length);
}

function substringSegmentations(word: string) {
  const segmentations: string[][] = [];

  function walk(start: number, chunks: string[]) {
    if (chunks.length >= MAX_CHUNKS) {
      return;
    }

    for (
      let end = start + MIN_CHUNK_LENGTH;
      end <= word.length - MIN_CHUNK_LENGTH;
      end += 1
    ) {
      const nextChunks = [...chunks, word.slice(start, end)];
      const remaining = word.slice(end);

      if (remaining.length >= MIN_CHUNK_LENGTH) {
        segmentations.push([...nextChunks, remaining]);
      }

      walk(end, nextChunks);
    }
  }

  walk(0, []);

  return segmentations.sort((left, right) => left.length - right.length);
}

function generateSegmentations(word: string) {
  const hyphenated = hyphenator.hyphenate(word);
  return dedupeSegmentations([
    ...groupHyphenatedParts(hyphenated),
    ...substringSegmentations(word),
  ]);
}

function exactChunkMatch(chunk: string): PartWordChunkMatch | null {
  const candidate = findBestWordCandidate(chunk);

  if (!candidate || candidate.ruleUsed === 'related') {
    return null;
  }

  return {
    chunk,
    matchedWord: chunk,
    emoji: candidate.emoji,
    source: 'exact',
    score: candidate.score,
  };
}

function homophoneChunkMatch(chunk: string): PartWordChunkMatch | null {
  const homophone = converterData.homophones.find(
    (entry) => entry.input === chunk,
  );

  if (!homophone) {
    return null;
  }

  return {
    chunk,
    matchedWord: homophone.soundsLike,
    emoji: homophone.emoji,
    source: 'homophone',
    score: Math.round(homophone.confidence * 65),
  };
}

function phoneticChunkMatch(
  chunk: string,
  allowAmbiguousPhonetics: boolean,
): PartWordChunkMatch | null {
  const candidates = phoneticCodes(chunk).flatMap(
    (code) => phoneticIndex.get(code) ?? [],
  );
  const uniqueCandidates = [
    ...new Map(
      candidates
        .filter(
          (candidate) =>
            Math.abs(candidate.word.length - chunk.length) <=
              (chunk.length <= 3 ? 2 : 1) && candidate.word !== chunk,
        )
        .map((candidate) => [candidate.conceptId, candidate]),
    ).values(),
  ];

  if (
    uniqueCandidates.length === 0 ||
    (!allowAmbiguousPhonetics &&
      uniqueCandidates.length > MAX_PHONETIC_CANDIDATES)
  ) {
    return null;
  }

  const [candidate] = uniqueCandidates.sort(
    (left, right) => candidateWeight(right) - candidateWeight(left),
  );

  if (!candidate) {
    return null;
  }

  return {
    chunk,
    matchedWord: candidate.word,
    emoji: candidate.emoji,
    source: 'phonetic',
    score: 35,
  };
}

function matchChunk(chunk: string, allowAmbiguousPhonetics: boolean) {
  return (
    exactChunkMatch(chunk) ??
    homophoneChunkMatch(chunk) ??
    phoneticChunkMatch(chunk, allowAmbiguousPhonetics)
  );
}

function scorePath(matches: PartWordChunkMatch[]) {
  const average =
    matches.reduce((total, match) => total + match.score, 0) / matches.length;
  const chunkPenalty = Math.max(0, matches.length - 2) * 5;
  const phoneticPenalty =
    matches.filter((match) => match.source === 'phonetic').length * 8;

  return average - chunkPenalty - phoneticPenalty;
}

export function partWordFallbackMatch(
  token: {
    original: string;
    normalised: string;
  },
  options: { allowAmbiguousPhonetics?: boolean } = {},
): TokenConversion | null {
  if (
    token.normalised.length < MIN_WORD_LENGTH ||
    token.normalised.length > MAX_WORD_LENGTH ||
    !/^[a-z]+$/.test(token.normalised)
  ) {
    return null;
  }

  const paths = generateSegmentations(token.normalised)
    .map((segmentation) => {
      const matches = segmentation.map((chunk) =>
        matchChunk(chunk, options.allowAmbiguousPhonetics ?? false),
      );

      if (matches.some((match) => match === null)) {
        return null;
      }

      const completeMatches = matches as PartWordChunkMatch[];
      return {
        matches: completeMatches,
        score: scorePath(completeMatches),
      };
    })
    .filter((path) => path !== null)
    .sort((left, right) => right.score - left.score);

  const bestPath = paths[0];

  if (!bestPath || bestPath.score < MIN_PATH_SCORE) {
    return null;
  }

  const emoji = bestPath.matches.map((match) => match.emoji).join('');
  const split = bestPath.matches
    .map((match) =>
      match.source === 'exact'
        ? match.chunk
        : `${match.chunk} sounds like ${match.matchedWord}`,
    )
    .join(' + ');

  return {
    token: token.original,
    normalised: token.normalised,
    emoji,
    ruleUsed: 'part_word_fallback',
    scoreImpact: PROGRAMMATIC_PART_WORD_SCORE,
    explanation: `${token.original} was split programmatically: ${split} -> ${emoji}`,
  } satisfies TokenConversion;
}
