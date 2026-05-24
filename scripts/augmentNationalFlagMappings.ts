import { readFileSync } from 'node:fs';

import type { EmojiConcept } from '../src/types/emoji';
import { writeJson } from './corpusTools';

type RestCountry = {
  cca2: string;
  cca3?: string;
  cioc?: string;
  fifa?: string;
  name: {
    common?: string;
    official?: string;
  };
  capital?: string[];
  altSpellings?: string[];
  demonyms?: {
    eng?: {
      f?: string;
      m?: string;
    };
  };
};

type RegionalMetadata = {
  code: string;
  names: string[];
  capitals: string[];
  codes: string[];
  demonyms: string[];
  source: 'restcountries' | 'manual_special_region';
};

type Options = {
  concepts: string;
  summary: string;
};

const REST_COUNTRIES_URL =
  'https://restcountries.com/v3.1/all?fields=cca2,cca3,cioc,fifa,name,capital,altSpellings,demonyms';

const SPECIAL_REGIONS: Record<string, RegionalMetadata> = {
  AC: {
    code: 'AC',
    names: ['Ascension Island'],
    capitals: ['Georgetown'],
    codes: ['AC'],
    demonyms: ['Ascension Islander'],
    source: 'manual_special_region',
  },
  CP: {
    code: 'CP',
    names: ['Clipperton Island'],
    capitals: [],
    codes: ['CP'],
    demonyms: [],
    source: 'manual_special_region',
  },
  CQ: {
    code: 'CQ',
    names: ['Sark'],
    capitals: [],
    codes: ['CQ'],
    demonyms: ['Sarkese'],
    source: 'manual_special_region',
  },
  DG: {
    code: 'DG',
    names: ['Diego Garcia'],
    capitals: ['Diego Garcia'],
    codes: ['DG'],
    demonyms: [],
    source: 'manual_special_region',
  },
  EA: {
    code: 'EA',
    names: ['Ceuta and Melilla', 'Ceuta & Melilla'],
    capitals: ['Ceuta', 'Melilla'],
    codes: ['EA'],
    demonyms: [],
    source: 'manual_special_region',
  },
  EU: {
    code: 'EU',
    names: ['European Union', 'EU'],
    capitals: ['Brussels'],
    codes: ['EU'],
    demonyms: ['European'],
    source: 'manual_special_region',
  },
  IC: {
    code: 'IC',
    names: ['Canary Islands'],
    capitals: ['Santa Cruz de Tenerife', 'Las Palmas'],
    codes: ['IC'],
    demonyms: ['Canarian'],
    source: 'manual_special_region',
  },
  TA: {
    code: 'TA',
    names: ['Tristan da Cunha'],
    capitals: ['Edinburgh of the Seven Seas'],
    codes: ['TA'],
    demonyms: ['Tristanian'],
    source: 'manual_special_region',
  },
  UN: {
    code: 'UN',
    names: ['United Nations', 'UN'],
    capitals: ['New York'],
    codes: ['UN'],
    demonyms: [],
    source: 'manual_special_region',
  },
  XK: {
    code: 'XK',
    names: ['Kosovo', 'Republic of Kosovo'],
    capitals: ['Pristina'],
    codes: ['XK', 'XKS'],
    demonyms: ['Kosovar'],
    source: 'manual_special_region',
  },
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    concepts: 'src/data/converter/emoji-concepts.json',
    summary: 'review/national-flag-augmentation-summary.json',
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--concepts') {
      options.concepts = args[index + 1] ?? options.concepts;
      index += 1;
    } else if (arg === '--summary') {
      options.summary = args[index + 1] ?? options.summary;
      index += 1;
    }
  }

  return options;
}

function regionalCodeFromFlagEmoji(emoji: string) {
  const codepoints = [...emoji].map((char) => char.codePointAt(0) ?? 0);

  if (
    codepoints.length !== 2 ||
    codepoints.some((codepoint) => codepoint < 0x1f1e6 || codepoint > 0x1f1ff)
  ) {
    return null;
  }

  return codepoints
    .map((codepoint) => String.fromCharCode(65 + codepoint - 0x1f1e6))
    .join('');
}

function normaliseKeyword(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function addKeyword(target: Set<string>, value: string | undefined) {
  if (!value) {
    return;
  }

  const normalised = normaliseKeyword(value);

  if (!normalised) {
    return;
  }

  target.add(normalised);
  target.add(normalised.replace(/\s+/g, ''));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function metadataFromCountry(country: RestCountry): RegionalMetadata {
  return {
    code: country.cca2.toUpperCase(),
    names: unique([
      country.name.common ?? '',
      country.name.official ?? '',
      ...(country.altSpellings ?? []),
    ]),
    capitals: country.capital ?? [],
    codes: unique([
      country.cca2,
      country.cca3 ?? '',
      country.cioc ?? '',
      country.fifa ?? '',
    ]),
    demonyms: unique([
      country.demonyms?.eng?.f ?? '',
      country.demonyms?.eng?.m ?? '',
    ]),
    source: 'restcountries',
  };
}

async function fetchCountryMetadata() {
  const response = await fetch(REST_COUNTRIES_URL);

  if (!response.ok) {
    throw new Error(
      `REST Countries fetch failed: ${response.status} ${response.statusText}`,
    );
  }

  const countries = (await response.json()) as RestCountry[];
  const metadata = new Map<string, RegionalMetadata>();

  for (const country of countries) {
    metadata.set(country.cca2.toUpperCase(), metadataFromCountry(country));
  }

  for (const [code, entry] of Object.entries(SPECIAL_REGIONS)) {
    metadata.set(code, entry);
  }

  return metadata;
}

function flagKeywords(metadata: RegionalMetadata) {
  const keywords = new Set<string>();

  for (const value of metadata.names) {
    addKeyword(keywords, value);
  }

  for (const value of metadata.capitals) {
    addKeyword(keywords, value);
  }

  for (const value of metadata.codes) {
    addKeyword(keywords, value);
  }

  for (const value of metadata.demonyms) {
    addKeyword(keywords, value);
  }

  return [...keywords].filter((keyword) => keyword.length >= 2).sort();
}

const options = parseArgs();
const concepts = JSON.parse(
  readFileSync(options.concepts, 'utf8'),
) as EmojiConcept[];
const metadataByCode = await fetchCountryMetadata();
const regionalFlags = concepts
  .map((concept, index) => ({
    concept,
    index,
    code: regionalCodeFromFlagEmoji(concept.emoji),
  }))
  .filter(
    (entry): entry is { concept: EmojiConcept; index: number; code: string } =>
      Boolean(entry.code),
  );
const augmented: Array<{
  code: string;
  emoji: string;
  displayName: string;
  addedKeywords: string[];
  source: RegionalMetadata['source'];
}> = [];
const unmatched: Array<{ code: string; emoji: string; displayName: string }> =
  [];

for (const entry of regionalFlags) {
  const metadata = metadataByCode.get(entry.code);

  if (!metadata) {
    unmatched.push({
      code: entry.code,
      emoji: entry.concept.emoji,
      displayName: entry.concept.displayName,
    });
    continue;
  }

  const keywords = flagKeywords(metadata);
  const existingDirectWords = new Set(entry.concept.directWords);
  const nextDirectWords = unique([...entry.concept.directWords, ...keywords]);
  const addedKeywords = nextDirectWords.filter(
    (word) => !existingDirectWords.has(word),
  );
  const commonName = normaliseKeyword(metadata.names[0] ?? '').replace(
    /\s+/g,
    '',
  );

  concepts[entry.index] = {
    ...entry.concept,
    canonicalWord: commonName || entry.concept.canonicalWord,
    directWords: nextDirectWords,
    relatedWords: entry.concept.relatedWords.filter(
      (word) => !nextDirectWords.includes(word),
    ),
    notes: unique([
      entry.concept.notes ?? '',
      `National/regional flag aliases enriched from ${metadata.source === 'restcountries' ? 'REST Countries v3.1' : 'manual special-region metadata'}: country or region names, alternate spellings, capital cities, demonyms, and ISO-style short codes.`,
    ]).join(' '),
  };

  augmented.push({
    code: entry.code,
    emoji: entry.concept.emoji,
    displayName: entry.concept.displayName,
    addedKeywords,
    source: metadata.source,
  });
}

writeJson(options.concepts, concepts);
writeJson(options.summary, {
  generatedAt: new Date().toISOString(),
  restCountriesSource: REST_COUNTRIES_URL,
  regionalFlagCount: regionalFlags.length,
  augmentedCount: augmented.length,
  restCountriesAugmentedCount: augmented.filter(
    (entry) => entry.source === 'restcountries',
  ).length,
  manualSpecialRegionAugmentedCount: augmented.filter(
    (entry) => entry.source === 'manual_special_region',
  ).length,
  unmatchedCount: unmatched.length,
  unmatched,
  sampleAugmentations: augmented.slice(0, 25),
});

console.log(`Regional flag concepts found: ${regionalFlags.length}`);
console.log(`Augmented flag concepts: ${augmented.length}`);
console.log(`Unmatched flag concepts: ${unmatched.length}`);
