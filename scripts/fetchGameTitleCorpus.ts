import { execFileSync } from 'node:child_process';

import { writeJson } from './corpusTools';

type TitleKind = 'movie' | 'tv' | 'book';

type TitleEntry = {
  title: string;
  kind: TitleKind;
  source: string;
  wikidataId: string;
  sitelinks: number;
};

type SourceConfig = {
  source: string;
  kind: TitleKind;
  typeIds: string[];
  limit: number;
};

type SourceResult = {
  source: string;
  kind: TitleKind;
  count?: number;
  sample?: string[];
  error?: string;
};

type Options = {
  output: string;
  summary: string;
};

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';
const USER_AGENT =
  'EmojiTranslator game corpus research (https://github.com/jdcb4/EmojiTranslator)';

const SOURCES: SourceConfig[] = [
  {
    source: 'Wikidata films by sitelinks',
    kind: 'movie',
    typeIds: ['Q11424'],
    limit: 3500,
  },
  {
    source: 'Wikidata TV series by sitelinks',
    kind: 'tv',
    typeIds: ['Q5398426', 'Q1259759'],
    limit: 2500,
  },
  {
    source: 'Wikidata books and novels by sitelinks',
    kind: 'book',
    typeIds: ['Q571', 'Q8261', 'Q7725634'],
    limit: 3500,
  },
];

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    output: 'review/game-title-corpus.json',
    summary: 'review/game-title-corpus-summary.json',
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

function sparqlFor(source: SourceConfig) {
  const values = source.typeIds.map((id) => `wd:${id}`).join(' ');

  return `
SELECT ?item ?itemLabel ?sitelinks WHERE {
  VALUES ?type { ${values} }
  ?item wdt:P31 ?type;
        rdfs:label ?itemLabel;
        wikibase:sitelinks ?sitelinks.
  FILTER(LANG(?itemLabel) = "en")
  FILTER(STRLEN(STR(?itemLabel)) >= 2)
  FILTER(STRLEN(STR(?itemLabel)) <= 90)
}
ORDER BY DESC(?sitelinks)
LIMIT ${source.limit}
`;
}

async function fetchJson(url: string, timeoutMs = 90000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: 'application/sparql-results+json',
        'user-agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return (await response.json()) as WikidataResponse;
  } catch (error) {
    try {
      const raw = execFileSync(
        'curl.exe',
        [
          '--silent',
          '--show-error',
          '--location',
          '--max-time',
          String(Math.ceil(timeoutMs / 1000)),
          '--user-agent',
          USER_AGENT,
          '--header',
          'accept: application/sparql-results+json',
          url,
        ],
        { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 },
      );

      return JSON.parse(raw) as WikidataResponse;
    } catch {
      throw error;
    }
  } finally {
    clearTimeout(timeout);
  }
}

type WikidataResponse = {
  results: {
    bindings: Array<{
      item: { value: string };
      itemLabel: { value: string };
      sitelinks: { value: string };
    }>;
  };
};

function cleanTitle(title: string) {
  return title
    .replace(/\s+/g, ' ')
    .replace(/\s+\((film|novel|book|tv series|television series)\)$/i, '')
    .trim();
}

function usefulTitle(title: string) {
  if (!title || title.length < 2 || title.length > 90) {
    return false;
  }

  if (/^(list of|episode \d+|season \d+)/i.test(title)) {
    return false;
  }

  return /[a-z0-9]/i.test(title);
}

async function fetchSource(source: SourceConfig) {
  const query = sparqlFor(source);
  const url = `${WIKIDATA_ENDPOINT}?${new URLSearchParams({
    query,
    format: 'json',
  })}`;

  console.log(`Fetching ${source.source}...`);
  const data = await fetchJson(url);
  const entries = data.results.bindings
    .map((binding) => {
      const title = cleanTitle(binding.itemLabel.value);
      const wikidataId = binding.item.value.split('/').pop() ?? '';

      return {
        title,
        kind: source.kind,
        source: source.source,
        wikidataId,
        sitelinks: Number(binding.sitelinks.value),
      } satisfies TitleEntry;
    })
    .filter((entry) => usefulTitle(entry.title));

  return {
    entries,
    result: {
      source: source.source,
      kind: source.kind,
      count: entries.length,
      sample: entries.slice(0, 5).map((entry) => entry.title),
    } satisfies SourceResult,
  };
}

async function collectSource(source: SourceConfig) {
  try {
    return await fetchSource(source);
  } catch (error) {
    return {
      entries: [],
      result: {
        source: source.source,
        kind: source.kind,
        error: error instanceof Error ? error.message : String(error),
      } satisfies SourceResult,
    };
  }
}

const options = parseArgs();
const sources = await Promise.all(
  SOURCES.map((source) => collectSource(source)),
);
const seen = new Set<string>();
const corpus = sources
  .flatMap((source) => source.entries)
  .sort((left, right) => right.sitelinks - left.sitelinks)
  .filter((entry) => {
    const key = entry.title.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
const summary = {
  generatedAt: new Date().toISOString(),
  sources: sources.map((source) => source.result),
  uniqueTitles: corpus.length,
};

writeJson(options.output, corpus);
writeJson(options.summary, summary);

console.log(`Wrote ${corpus.length} unique titles to ${options.output}`);
console.log(`Wrote source summary to ${options.summary}`);
