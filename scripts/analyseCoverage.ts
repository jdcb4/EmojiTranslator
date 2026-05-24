import { converterData } from '../src/data/converter/loadConverterData';
import { convertMovieTitleToEmoji } from '../src/domain/converter/convertTitle';

type Band = 'excellent' | 'usable' | 'needsReview' | 'rejected';

const bandLabels: Record<Band, string> = {
  excellent: 'Excellent',
  usable: 'Usable',
  needsReview: 'Needs review',
  rejected: 'Rejected',
};

function bandFor(confidence: number): Band {
  if (confidence >= 0.9) {
    return 'excellent';
  }

  if (confidence >= 0.7) {
    return 'usable';
  }

  if (confidence >= 0.5) {
    return 'needsReview';
  }

  return 'rejected';
}

const results = converterData.movieTitleTestSet.map((title) =>
  convertMovieTitleToEmoji(title, { mode: 'hybrid' }),
);

const counts: Record<Band, number> = {
  excellent: 0,
  usable: 0,
  needsReview: 0,
  rejected: 0,
};
const unmappedWords = new Map<string, number>();

for (const result of results) {
  counts[bandFor(result.confidence)] += 1;

  for (const token of result.tokens) {
    if (token.ruleUsed === 'unmapped') {
      unmappedWords.set(
        token.normalised,
        (unmappedWords.get(token.normalised) ?? 0) + 1,
      );
    }
  }
}

const averageConfidence =
  results.reduce((total, result) => total + result.confidence, 0) /
  Math.max(results.length, 1);
const averageEmojiLength =
  results.reduce(
    (total, result) => total + Array.from(result.emoji ?? '').length,
    0,
  ) / Math.max(results.length, 1);
const topUnmapped = [...unmappedWords.entries()]
  .sort((left, right) => right[1] - left[1])
  .slice(0, 10);

console.log(`Movie titles tested: ${results.length}`);
console.log('');

for (const band of Object.keys(counts) as Band[]) {
  console.log(`${bandLabels[band]}: ${counts[band]}`);
}

console.log('');
console.log(`Average confidence: ${averageConfidence.toFixed(2)}`);
console.log(`Average emoji length: ${averageEmojiLength.toFixed(1)}`);
console.log('');
console.log('Top unmapped title words:');

if (topUnmapped.length === 0) {
  console.log('None');
} else {
  topUnmapped.forEach(([word, count], index) => {
    console.log(`${index + 1}. ${word} - ${count}`);
  });
}
