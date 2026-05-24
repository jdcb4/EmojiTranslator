import { converterData } from '../../data/converter/loadConverterData';
import type { RuleUsed } from '../../types/conversion';
import type { EmojiConcept } from '../../types/emoji';
import { singulariseToken } from './normaliseToken';

export type WordCandidate = {
  emoji: string;
  conceptId: string;
  ruleUsed: Extract<RuleUsed, 'exact' | 'plural' | 'synonym' | 'related'>;
  score: number;
  explanation: string;
  concept: EmojiConcept;
};

const RULE_SCORES = {
  exact: 100,
  plural: 95,
  synonym: 80,
  related: 65,
} as const;

function addWords(
  index: Map<string, WordCandidate[]>,
  concept: EmojiConcept,
  words: string[],
  ruleUsed: WordCandidate['ruleUsed'],
) {
  for (const word of words) {
    const key = word.toLowerCase();
    const candidates = index.get(key) ?? [];
    candidates.push({
      emoji: concept.emoji,
      conceptId: concept.id,
      ruleUsed,
      score: RULE_SCORES[ruleUsed],
      explanation: `${word} maps to ${concept.emoji} (${concept.displayName}) by ${ruleUsed} rule`,
      concept,
    });
    index.set(key, candidates);
  }
}

function buildWordIndex() {
  const index = new Map<string, WordCandidate[]>();

  for (const concept of converterData.emojiConcepts) {
    addWords(
      index,
      concept,
      [concept.canonicalWord, ...concept.directWords],
      'exact',
    );
    addWords(index, concept, concept.plurals, 'plural');
    addWords(index, concept, concept.synonyms, 'synonym');
    addWords(index, concept, concept.relatedWords, 'related');
  }

  return index;
}

const wordIndex = buildWordIndex();

function rankCandidates(candidates: WordCandidate[]) {
  return [...candidates].sort((left, right) => {
    const leftScore =
      left.score * left.concept.recognisability * left.concept.quizUsefulness -
      left.concept.ambiguity * 10;
    const rightScore =
      right.score *
        right.concept.recognisability *
        right.concept.quizUsefulness -
      right.concept.ambiguity * 10;
    return rightScore - leftScore;
  })[0];
}

export function findBestWordCandidate(token: string) {
  const candidates =
    wordIndex.get(token) ?? wordIndex.get(singulariseToken(token)) ?? [];

  return rankCandidates(candidates);
}

export function findPluralWordCandidate(token: string) {
  const candidates = wordIndex
    .get(token)
    ?.filter((candidate) => candidate.ruleUsed === 'plural');

  return rankCandidates(candidates ?? []);
}
