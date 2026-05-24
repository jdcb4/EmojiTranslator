import { execFileSync } from 'node:child_process';

import { writeJson } from './corpusTools';

type TitleKind = 'movie' | 'tv' | 'book';

type TitleEntry = {
  title: string;
  kind: TitleKind;
  source: string;
  wikidataId: string;
  sitelinks: number;
  highRecognition?: boolean;
  recognitionSources?: string[];
  boxOfficeRank?: number;
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
const BOX_OFFICE_MOJO_URL =
  'https://www.boxofficemojo.com/chart/top_lifetime_gross/';
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

async function fetchText(url: string, timeoutMs = 90000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: 'text/html,*/*',
        'user-agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    try {
      return execFileSync(
        'curl.exe',
        [
          '--silent',
          '--show-error',
          '--location',
          '--max-time',
          String(Math.ceil(timeoutMs / 1000)),
          '--user-agent',
          USER_AGENT,
          url,
        ],
        { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 },
      );
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
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&middot;/g, '·')
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

async function getBoxOfficeMojoTitles() {
  const offsets = [0, 200, 400, 600, 800];
  const entries: TitleEntry[] = [];

  for (const offset of offsets) {
    const url =
      offset === 0
        ? BOX_OFFICE_MOJO_URL
        : `${BOX_OFFICE_MOJO_URL}?offset=${offset}`;
    console.log(
      `Fetching Box Office Mojo top lifetime grosses ${offset + 1}-${offset + 200}...`,
    );
    const html = await fetchText(url);
    const titles = [
      ...html.matchAll(
        /<a[^>]+href="\/title\/tt\d+\/\?ref_=bo_cso_table_\d+"[^>]*>(.*?)<\/a>/g,
      ),
    ].map((match) => cleanTitle(match[1] ?? ''));

    titles.forEach((title, index) => {
      if (!usefulTitle(title)) {
        return;
      }

      entries.push({
        title,
        kind: 'movie',
        source: 'Box Office Mojo top lifetime grosses',
        wikidataId: '',
        sitelinks: 0,
        highRecognition: true,
        recognitionSources: [
          'Box Office Mojo top 1000 domestic lifetime gross',
        ],
        boxOfficeRank: offset + index + 1,
      });
    });
  }

  return entries;
}

async function collectBoxOfficeMojoSource() {
  try {
    const entries = await getBoxOfficeMojoTitles();

    return {
      entries,
      result: {
        source: 'Box Office Mojo top lifetime grosses',
        kind: 'movie' as const,
        count: entries.length,
        sample: entries.slice(0, 5).map((entry) => entry.title),
      } satisfies SourceResult,
    };
  } catch (error) {
    return {
      entries: [],
      result: {
        source: 'Box Office Mojo top lifetime grosses',
        kind: 'movie' as const,
        error: error instanceof Error ? error.message : String(error),
      } satisfies SourceResult,
    };
  }
}

function mergeCorpusEntries(entries: TitleEntry[]) {
  const merged = new Map<string, TitleEntry>();

  for (const entry of entries) {
    const key = entry.title.toLowerCase();
    const current = merged.get(key);

    if (!current) {
      merged.set(key, {
        ...entry,
        recognitionSources: entry.recognitionSources ?? [],
      });
      continue;
    }

    current.source = [...new Set([current.source, entry.source])].join('; ');
    current.highRecognition =
      Boolean(current.highRecognition) || Boolean(entry.highRecognition);
    current.recognitionSources = [
      ...new Set([
        ...(current.recognitionSources ?? []),
        ...(entry.recognitionSources ?? []),
      ]),
    ];
    current.boxOfficeRank =
      current.boxOfficeRank === undefined
        ? entry.boxOfficeRank
        : entry.boxOfficeRank === undefined
          ? current.boxOfficeRank
          : Math.min(current.boxOfficeRank, entry.boxOfficeRank);
    current.sitelinks = Math.max(current.sitelinks, entry.sitelinks);
  }

  return [...merged.values()].sort(
    (left, right) =>
      Number(Boolean(right.highRecognition)) -
        Number(Boolean(left.highRecognition)) ||
      (left.boxOfficeRank ?? Number.POSITIVE_INFINITY) -
        (right.boxOfficeRank ?? Number.POSITIVE_INFINITY) ||
      right.sitelinks - left.sitelinks,
  );
}

const options = parseArgs();
const sources = await Promise.all(
  SOURCES.map((source) => collectSource(source)),
);
const boxOfficeMojo = await collectBoxOfficeMojoSource();
const allSources = [...sources, boxOfficeMojo];
const corpus = mergeCorpusEntries(
  allSources.flatMap((source) => source.entries),
);
const summary = {
  generatedAt: new Date().toISOString(),
  sources: allSources.map((source) => source.result),
  uniqueTitles: corpus.length,
  highRecognitionTitles: corpus.filter((entry) => entry.highRecognition).length,
};

writeJson(options.output, corpus);
writeJson(options.summary, summary);

console.log(`Wrote ${corpus.length} unique titles to ${options.output}`);
console.log(`Wrote source summary to ${options.summary}`);
