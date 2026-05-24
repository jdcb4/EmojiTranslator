import { converterData } from '../src/data/converter/loadConverterData';
import { convertMovieTitleToEmoji } from '../src/domain/converter/convertTitle';
import {
  readTitles,
  summariseCorpusResults,
  toCorpusTitleResult,
  writeJson,
} from './corpusTools';

type Options = {
  input?: string;
  output: string;
  limit?: number;
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    output: 'review/corpus-coverage.json',
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--input') {
      options.input = args[index + 1];
      index += 1;
    } else if (arg === '--output') {
      options.output = args[index + 1] ?? options.output;
      index += 1;
    } else if (arg === '--limit') {
      options.limit = Number(args[index + 1]);
      index += 1;
    }
  }

  return options;
}

const options = parseArgs();
const titles = (
  options.input ? readTitles(options.input) : converterData.movieTitleTestSet
).slice(0, options.limit);
const results = titles.map((title) =>
  toCorpusTitleResult(
    title,
    convertMovieTitleToEmoji(title, { mode: 'hybrid' }),
  ),
);
const report = summariseCorpusResults(
  options.input ?? 'src/data/converter/movie-title-test-set.json',
  results,
);

writeJson(options.output, report);

console.log(`Corpus titles tested: ${report.titleCount}`);
console.log('');
console.log(`Excellent: ${report.counts.excellent}`);
console.log(`Usable: ${report.counts.usable}`);
console.log(`Needs review: ${report.counts.needsReview}`);
console.log(`Rejected: ${report.counts.rejected}`);
console.log('');
console.log(`Average confidence: ${report.averageConfidence.toFixed(2)}`);
console.log(`Average emoji length: ${report.averageEmojiLength.toFixed(1)}`);
console.log('');
console.log(`Wrote ${options.output}`);

if (report.unmappedWords.length > 0) {
  console.log('');
  console.log('Top unmapped words:');
  report.unmappedWords.slice(0, 10).forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.word} - ${entry.count}`);
  });
}
