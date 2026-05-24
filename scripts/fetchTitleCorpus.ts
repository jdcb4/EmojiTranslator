import { execFileSync } from 'node:child_process';

import { writeJson } from './corpusTools';

type SourceResult = {
  source: string;
  url: string;
  count?: number;
  sample?: string[];
  error?: string;
};

type TitleEntry = {
  title: string;
  source: string;
};

type Options = {
  output: string;
  summary: string;
};

const IMDB_TOP_1000_URL =
  'https://huggingface.co/datasets/drossi/EDA_on_IMDB_Movies_Dataset/resolve/main/imdb_top_1000.csv';
const ROTTEN_TOMATOES_300_URL =
  'https://editorial.rottentomatoes.com/guide/best-movies-of-all-time/';
const PROJECT_GUTENBERG_TOP_URL = 'https://www.gutenberg.org/browse/scores/top';

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    output: 'review/large-title-corpus.json',
    summary: 'review/large-title-corpus-summary.json',
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

async function fetchText(url: string, timeoutMs = 45000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: 'text/html,application/json,text/csv,*/*',
        'user-agent': 'EmojiTranslator coverage research',
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
          'EmojiTranslator coverage research',
          url,
        ],
        { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
      );
    } catch {
      throw error;
    }
  } finally {
    clearTimeout(timeout);
  }
}

function csvRows(raw: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    const next = raw[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }

      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function cleanTitle(title: string) {
  return title
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function getImdbTitles(): Promise<TitleEntry[]> {
  const rows = csvRows(await fetchText(IMDB_TOP_1000_URL));
  const [header = [], ...dataRows] = rows;
  const titleIndex = header.indexOf('Series_Title');

  if (titleIndex === -1) {
    throw new Error('IMDb CSV did not include Series_Title.');
  }

  return dataRows
    .map((row) => cleanTitle(row[titleIndex] ?? ''))
    .filter(Boolean)
    .map((title) => ({
      title,
      source: 'IMDb Top 1000 public CSV mirror',
    }));
}

async function getRottenTomatoesTitles(): Promise<TitleEntry[]> {
  const html = await fetchText(ROTTEN_TOMATOES_300_URL);
  const titles = [
    ...html.matchAll(
      /<a[^>]*class=["'][^"']*meta-title[^"']*["'][^>]*>(.*?)<\/a>/gi,
    ),
  ].map((match) => cleanTitle(match[1] ?? ''));

  return titles.filter(Boolean).map((title) => ({
    title,
    source: 'Rotten Tomatoes 300 Best Movies editorial page',
  }));
}

async function getGutenbergTitles(): Promise<TitleEntry[]> {
  const html = await fetchText(PROJECT_GUTENBERG_TOP_URL, 60000);
  const titles = [
    ...html.matchAll(/<a[^>]*href="\/ebooks\/\d+"[^>]*>(.*?)<\/a>/gi),
  ]
    .map((match) =>
      cleanTitle(match[1] ?? '')
        .replace(/\s+\(\d+\)$/, '')
        .replace(/\s+by\s+.+$/i, ''),
    )
    .filter(Boolean);
  const seen = new Set<string>();

  return titles
    .filter((title) => {
      const key = title.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .map((title) => ({
      title,
      source: 'Project Gutenberg top downloaded ebooks',
    }));
}

async function collectSource(
  source: string,
  url: string,
  getTitles: () => Promise<TitleEntry[]>,
): Promise<{ entries: TitleEntry[]; result: SourceResult }> {
  try {
    console.log(`Fetching ${source}...`);
    const entries = await getTitles();

    return {
      entries,
      result: {
        source,
        url,
        count: entries.length,
        sample: entries.slice(0, 5).map((entry) => entry.title),
      },
    };
  } catch (error) {
    return {
      entries: [],
      result: {
        source,
        url,
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

const options = parseArgs();
const sources = await Promise.all([
  collectSource(
    'IMDb Top 1000 public CSV mirror',
    IMDB_TOP_1000_URL,
    getImdbTitles,
  ),
  collectSource(
    'Rotten Tomatoes 300 Best Movies editorial page',
    ROTTEN_TOMATOES_300_URL,
    getRottenTomatoesTitles,
  ),
  collectSource(
    'Project Gutenberg top downloaded ebooks',
    PROJECT_GUTENBERG_TOP_URL,
    getGutenbergTitles,
  ),
]);
const seen = new Set<string>();
const corpus = sources
  .flatMap((source) => source.entries)
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
