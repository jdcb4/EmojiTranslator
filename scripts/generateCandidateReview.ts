import { readFileSync } from 'node:fs';

import type { CorpusCoverageReport } from './corpusTools';
import {
  hyphenateWord,
  phoneticCodes,
  sampleSegmentations,
  writeJson,
  type CandidateReview,
} from './corpusTools';

type Options = {
  input: string;
  output: string;
  limit: number;
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    input: 'review/corpus-coverage.json',
    output: 'review/candidate-review.json',
    limit: 50,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--input') {
      options.input = args[index + 1] ?? options.input;
      index += 1;
    } else if (arg === '--output') {
      options.output = args[index + 1] ?? options.output;
      index += 1;
    } else if (arg === '--limit') {
      options.limit = Number(args[index + 1] ?? options.limit);
      index += 1;
    }
  }

  return options;
}

function actionFor(word: string, segmentations: string[][]) {
  if (word.length <= 2) {
    return 'review_intentional_omission' as const;
  }

  if (segmentations.some((segmentation) => segmentation.length > 1)) {
    return 'review_homophone_or_part_word' as const;
  }

  return 'review_direct_mapping' as const;
}

function notesFor(word: string, segmentations: string[][]) {
  const notes: string[] = [];

  if (word.length <= 2) {
    notes.push(
      'Very short token; usually omit unless it has a standard rebus meaning.',
    );
  }

  if (/^[a-z]+$/.test(word)) {
    notes.push('Review for direct emoji concept before adding homophones.');
  }

  if (segmentations.length > 0) {
    notes.push(
      'Review shown segmentations for fair chunk-level rebus candidates.',
    );
  }

  notes.push(
    'Do not promote if the clue depends on plot knowledge rather than title text.',
  );

  return notes;
}

const options = parseArgs();
const report = JSON.parse(
  readFileSync(options.input, 'utf8'),
) as CorpusCoverageReport;
const candidates = report.unmappedWords.slice(0, options.limit).map((entry) => {
  const hyphenation = hyphenateWord(entry.word);
  const segmentations = sampleSegmentations(entry.word);

  return {
    word: entry.word,
    count: entry.count,
    examples: entry.examples,
    phoneticCodes: phoneticCodes(entry.word),
    hyphenation,
    sampleSegmentations: segmentations,
    suggestedAction: actionFor(entry.word, segmentations),
    reviewNotes: notesFor(entry.word, segmentations),
  };
});
const review: CandidateReview = {
  generatedAt: new Date().toISOString(),
  source: options.input,
  candidateCount: candidates.length,
  candidates,
};

writeJson(options.output, review);

console.log(`Generated ${candidates.length} candidate review items.`);
console.log(`Wrote ${options.output}`);
