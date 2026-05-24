import { converterData } from '../../data/converter/loadConverterData';
import type { TokenConversion } from '../../types/conversion';

const DICTIONARY_HOMOPHONE_SCORE = 43;

const pronunciationHomophones = new Map(
  converterData.pronunciationHomophones.map((entry) => [entry.input, entry]),
);

export function dictionaryHomophoneFallbackMatch(token: {
  original: string;
  normalised: string;
}): TokenConversion | null {
  const entry = pronunciationHomophones.get(token.normalised);

  if (!entry || entry.candidates.length === 0) {
    return null;
  }

  const [candidate] = entry.candidates;

  if (!candidate) {
    return null;
  }

  return {
    token: token.original,
    normalised: token.normalised,
    emoji: candidate.emoji,
    ruleUsed: 'dictionary_homophone',
    scoreImpact: DICTIONARY_HOMOPHONE_SCORE,
    explanation: `${token.original} sounds like ${candidate.word}, represented by ${candidate.emoji} (${entry.candidates.length} pronunciation candidate${entry.candidates.length === 1 ? '' : 's'})`,
  } satisfies TokenConversion;
}
