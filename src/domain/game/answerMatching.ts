export type GuessMatchReason = 'empty' | 'exact' | 'near' | 'miss';

export type GuessMatchResult = {
  accepted: boolean;
  reason: GuessMatchReason;
  normalisedGuess: string;
  normalisedAnswer: string;
  distance: number;
  similarity: number;
};

const LEADING_ARTICLES = /^(the|a|an)\s+/;

export function normaliseTitleForGuess(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function answerVariants(answer: string) {
  const normalised = normaliseTitleForGuess(answer);
  const withoutLeadingArticle = normalised.replace(LEADING_ARTICLES, '');

  return [...new Set([normalised, withoutLeadingArticle])].filter(Boolean);
}

function maxAllowedDistance(length: number) {
  if (length <= 3) {
    return 0;
  }

  if (length <= 7) {
    return 1;
  }

  if (length <= 16) {
    return 2;
  }

  if (length <= 28) {
    return 3;
  }

  return 4;
}

function minRequiredSimilarity(length: number) {
  return length <= 7 ? 0.8 : 0.86;
}

export function levenshteinDistance(left: string, right: string) {
  if (left === right) {
    return 0;
  }

  if (left.length === 0) {
    return right.length;
  }

  if (right.length === 0) {
    return left.length;
  }

  const rows = Array.from({ length: left.length + 1 }, () =>
    Array.from({ length: right.length + 1 }, () => 0),
  );

  for (let leftIndex = 0; leftIndex <= left.length; leftIndex += 1) {
    rows[leftIndex][0] = leftIndex;
  }

  for (let rightIndex = 0; rightIndex <= right.length; rightIndex += 1) {
    rows[0][rightIndex] = rightIndex;
  }

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;

      rows[leftIndex][rightIndex] = Math.min(
        rows[leftIndex - 1][rightIndex] + 1,
        rows[leftIndex][rightIndex - 1] + 1,
        rows[leftIndex - 1][rightIndex - 1] + substitutionCost,
      );

      if (
        leftIndex > 1 &&
        rightIndex > 1 &&
        left[leftIndex - 1] === right[rightIndex - 2] &&
        left[leftIndex - 2] === right[rightIndex - 1]
      ) {
        rows[leftIndex][rightIndex] = Math.min(
          rows[leftIndex][rightIndex],
          rows[leftIndex - 2][rightIndex - 2] + 1,
        );
      }
    }
  }

  return rows[left.length][right.length] ?? 0;
}

function scoreGuessAgainstAnswer(guess: string, answer: string) {
  const distance = levenshteinDistance(guess, answer);
  const longest = Math.max(guess.length, answer.length, 1);
  const similarity = 1 - distance / longest;

  return { distance, similarity };
}

export function matchTitleGuess(
  guess: string,
  answer: string,
): GuessMatchResult {
  const normalisedGuess = normaliseTitleForGuess(guess).replace(
    LEADING_ARTICLES,
    '',
  );
  const variants = answerVariants(answer);
  const normalisedAnswer = variants[0] ?? normaliseTitleForGuess(answer);

  if (!normalisedGuess) {
    return {
      accepted: false,
      reason: 'empty',
      normalisedGuess,
      normalisedAnswer,
      distance: normalisedAnswer.length,
      similarity: 0,
    };
  }

  if (variants.includes(normalisedGuess)) {
    return {
      accepted: true,
      reason: 'exact',
      normalisedGuess,
      normalisedAnswer,
      distance: 0,
      similarity: 1,
    };
  }

  const scored = variants
    .map((variant) => ({
      answer: variant,
      ...scoreGuessAgainstAnswer(normalisedGuess, variant),
    }))
    .sort(
      (left, right) =>
        left.distance - right.distance || right.similarity - left.similarity,
    )[0];

  if (!scored) {
    return {
      accepted: false,
      reason: 'miss',
      normalisedGuess,
      normalisedAnswer,
      distance: 0,
      similarity: 0,
    };
  }

  const accepted =
    scored.distance <= maxAllowedDistance(scored.answer.length) &&
    scored.similarity >= minRequiredSimilarity(scored.answer.length);

  return {
    accepted,
    reason: accepted ? 'near' : 'miss',
    normalisedGuess,
    normalisedAnswer: scored.answer,
    distance: scored.distance,
    similarity: Number(scored.similarity.toFixed(3)),
  };
}
