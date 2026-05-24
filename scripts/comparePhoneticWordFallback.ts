import { convertMovieTitleToEmoji } from '../src/domain/converter/convertTitle';
import {
  readTitles,
  summariseCorpusResults,
  toCorpusTitleResult,
  writeJson,
} from './corpusTools';

type Options = {
  input: string;
  output: string;
  limit?: number;
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    input: 'review/large-title-corpus.json',
    output: 'review/phonetic-word-fallback-comparison.json',
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
      options.limit = Number(args[index + 1]);
      index += 1;
    }
  }

  return options;
}

const options = parseArgs();
const titles = readTitles(options.input).slice(0, options.limit);
const withoutPhonetic = titles.map((title) =>
  toCorpusTitleResult(
    title,
    convertMovieTitleToEmoji(title, {
      mode: 'hybrid',
      allowPhoneticWords: false,
    }),
  ),
);
const withPhonetic = titles.map((title) =>
  toCorpusTitleResult(
    title,
    convertMovieTitleToEmoji(title, {
      mode: 'hybrid',
      allowPhoneticWords: true,
    }),
  ),
);
const withByTitle = new Map(
  withPhonetic.map((result) => [result.title, result]),
);
const changed = withoutPhonetic
  .map((before) => ({
    before,
    after: withByTitle.get(before.title),
  }))
  .filter((entry) => entry.after && entry.before.emoji !== entry.after.emoji);
const movedOutOfRejected = changed.filter(
  (entry) =>
    entry.before.band === 'rejected' && entry.after?.band !== 'rejected',
);
const acceptedFromRejected = movedOutOfRejected.filter(
  (entry) => entry.after?.accepted,
);
const rejectedRegressions = changed.filter(
  (entry) =>
    entry.before.band !== 'rejected' && entry.after?.band === 'rejected',
);

const comparison = {
  generatedAt: new Date().toISOString(),
  input: options.input,
  titleCount: titles.length,
  withoutPhonetic: summariseCorpusResults(options.input, withoutPhonetic),
  withPhonetic: summariseCorpusResults(options.input, withPhonetic),
  changedCount: changed.length,
  movedOutOfRejectedCount: movedOutOfRejected.length,
  acceptedFromRejectedCount: acceptedFromRejected.length,
  rejectedRegressionCount: rejectedRegressions.length,
  sampleAcceptedFromRejected: acceptedFromRejected
    .slice(0, 30)
    .map((entry) => ({
      title: entry.before.title,
      beforeConfidence: entry.before.confidence,
      afterConfidence: entry.after?.confidence,
      beforeEmoji: entry.before.emoji,
      afterEmoji: entry.after?.emoji,
      phoneticTokens: entry.after?.tokens.filter(
        (token) => token.ruleUsed === 'phonetic_word_fallback',
      ),
    })),
  sampleChanged: changed.slice(0, 40).map((entry) => ({
    title: entry.before.title,
    beforeBand: entry.before.band,
    afterBand: entry.after?.band,
    beforeConfidence: entry.before.confidence,
    afterConfidence: entry.after?.confidence,
    beforeEmoji: entry.before.emoji,
    afterEmoji: entry.after?.emoji,
    phoneticTokens: entry.after?.tokens.filter(
      (token) => token.ruleUsed === 'phonetic_word_fallback',
    ),
  })),
};

writeJson(options.output, comparison);

console.log(`Titles tested: ${titles.length}`);
console.log('');
console.log('Without whole-word phonetic:');
console.log(JSON.stringify(comparison.withoutPhonetic.counts, null, 2));
console.log('');
console.log('With whole-word phonetic:');
console.log(JSON.stringify(comparison.withPhonetic.counts, null, 2));
console.log('');
console.log(`Changed outputs: ${comparison.changedCount}`);
console.log(`Moved out of rejected: ${comparison.movedOutOfRejectedCount}`);
console.log(`Accepted from rejected: ${comparison.acceptedFromRejectedCount}`);
console.log(`Rejected regressions: ${comparison.rejectedRegressionCount}`);
console.log(`Wrote ${options.output}`);
