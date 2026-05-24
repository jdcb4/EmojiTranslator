import { writeJson } from './corpusTools';

const EMOJI_TEST_URL =
  'https://www.unicode.org/Public/17.0.0/emoji/emoji-test.txt';
const SKIN_TONE_CODEPOINTS = new Set([
  '1F3FB',
  '1F3FC',
  '1F3FD',
  '1F3FE',
  '1F3FF',
]);

type UnicodeEmojiEntry = {
  emoji: string;
  codepoints: string[];
  unicodeName: string;
  group: string;
  subgroup: string;
  primaryWord: string | null;
  source: 'unicode_emoji_test_17';
};

type Options = {
  output: string;
  summary: string;
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    output: 'review/unicode-base-emojis.json',
    summary: 'review/unicode-base-emojis-summary.json',
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--output') {
      options.output = args[index + 1] ?? options.output;
      index += 1;
    } else if (arg === '--summary') {
      options.summary = args[index + 1] ?? options.summary;
      index += 1;
    }
  }

  return options;
}

function cleanName(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function oneWordDefinition(name: string) {
  const withoutPrefix = name
    .replace(/^flag:\s*/i, '')
    .replace(/^keycap:\s*/i, '')
    .replace(/^person:\s*/i, '');
  const normalized = withoutPrefix.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);

  return words.length === 1 ? words[0] : null;
}

function parseEmojiTest(raw: string) {
  const entries: UnicodeEmojiEntry[] = [];
  let group = '';
  let subgroup = '';

  for (const line of raw.split(/\r?\n/)) {
    const groupMatch = line.match(/^# group: (.+)$/);
    const subgroupMatch = line.match(/^# subgroup: (.+)$/);

    if (groupMatch) {
      group = groupMatch[1] ?? '';
      continue;
    }

    if (subgroupMatch) {
      subgroup = subgroupMatch[1] ?? '';
      continue;
    }

    const match = line.match(
      /^([0-9A-F ]+)\s*;\s*fully-qualified\s*#\s*(\S+)\s+E[0-9.]+\s+(.+)$/,
    );

    if (!match || group === 'Component') {
      continue;
    }

    const codepoints = (match[1] ?? '').trim().split(/\s+/);

    if (codepoints.some((codepoint) => SKIN_TONE_CODEPOINTS.has(codepoint))) {
      continue;
    }

    const unicodeName = cleanName(match[3] ?? '');

    entries.push({
      emoji: match[2] ?? '',
      codepoints,
      unicodeName,
      group,
      subgroup,
      primaryWord: oneWordDefinition(unicodeName),
      source: 'unicode_emoji_test_17',
    });
  }

  return entries;
}

const options = parseArgs();
const response = await fetch(EMOJI_TEST_URL);

if (!response.ok) {
  throw new Error(`Unicode fetch failed: ${response.status}`);
}

const entries = parseEmojiTest(await response.text());
const summary = {
  generatedAt: new Date().toISOString(),
  source: EMOJI_TEST_URL,
  count: entries.length,
  oneWordDefinitionCount: entries.filter((entry) => entry.primaryWord).length,
  needsPrimaryWordReviewCount: entries.filter((entry) => !entry.primaryWord)
    .length,
  groups: Object.fromEntries(
    Object.entries(Object.groupBy(entries, (entry) => entry.group)).map(
      ([key, value]) => [key, value?.length ?? 0],
    ),
  ),
};

writeJson(options.output, entries);
writeJson(options.summary, summary);

console.log(`Wrote ${entries.length} Unicode base emoji entries.`);
console.log(`Wrote ${options.output}`);
console.log(`Wrote ${options.summary}`);
