import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname } from 'node:path';

import { doubleMetaphone } from 'double-metaphone';
import english from 'hyphenation.en-us';
import Hypher from 'hypher';

import type { ConversionResult, RuleUsed } from '../src/types/conversion';

export type Band = 'excellent' | 'usable' | 'needsReview' | 'rejected';

export type CorpusTitleResult = {
  title: string;
  emoji: string | null;
  confidence: number;
  accepted: boolean;
  band: Band;
  unmappedWords: string[];
  tokens: Array<{
    token: string;
    normalised: string;
    emoji?: string;
    ruleUsed: RuleUsed;
    explanation: string;
  }>;
};

export type CorpusCoverageReport = {
  generatedAt: string;
  source: string;
  titleCount: number;
  counts: Record<Band, number>;
  averageConfidence: number;
  averageEmojiLength: number;
  ruleCounts: Record<string, number>;
  unmappedWords: Array<{
    word: string;
    count: number;
    examples: string[];
  }>;
  rejectedTitles: CorpusTitleResult[];
  results: CorpusTitleResult[];
};

export type CandidateReview = {
  generatedAt: string;
  source: string;
  candidateCount: number;
  candidates: Array<{
    word: string;
    count: number;
    examples: string[];
    phoneticCodes: string[];
    hyphenation: string[];
    sampleSegmentations: string[][];
    suggestedAction:
      | 'review_direct_mapping'
      | 'review_homophone_or_part_word'
      | 'review_intentional_omission';
    reviewNotes: string[];
  }>;
};

const hyphenator = new Hypher(english);

export function bandFor(confidence: number): Band {
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

export function readTitles(inputPath: string) {
  const raw = readFileSync(inputPath, 'utf8');
  const extension = extname(inputPath).toLowerCase();
  const titles =
    extension === '.json' ? readJsonTitles(raw) : readLineOrCsvTitles(raw);
  const seen = new Set<string>();

  return titles
    .map((title) => title.trim())
    .filter(Boolean)
    .filter((title) => {
      const key = title.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function readJsonTitles(raw: string) {
  const data = JSON.parse(raw) as unknown;

  if (!Array.isArray(data)) {
    throw new Error('JSON corpus must be an array of strings or objects.');
  }

  return data
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry;
      }

      if (entry && typeof entry === 'object') {
        const record = entry as Record<string, unknown>;
        const value = record.title ?? record.name;
        return typeof value === 'string' ? value : '';
      }

      return '';
    })
    .filter(Boolean);
}

function readLineOrCsvTitles(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      if (index === 0 && /^title\s*(,|$)/i.test(line)) {
        return '';
      }

      return firstCsvCell(line);
    })
    .filter(Boolean);
}

function firstCsvCell(line: string) {
  if (!line.startsWith('"')) {
    return line.split(',')[0]?.trim() ?? '';
  }

  const endQuote = line.indexOf('"', 1);

  if (endQuote === -1) {
    return line.replace(/^"/, '').trim();
  }

  return line.slice(1, endQuote).replace(/""/g, '"').trim();
}

export function toCorpusTitleResult(
  title: string,
  result: ConversionResult,
): CorpusTitleResult {
  const unmappedWords = result.tokens
    .filter((token) => token.ruleUsed === 'unmapped')
    .map((token) => token.normalised);

  return {
    title,
    emoji: result.emoji,
    confidence: result.confidence,
    accepted: result.accepted,
    band: bandFor(result.confidence),
    unmappedWords,
    tokens: result.tokens.map((token) => ({
      token: token.token,
      normalised: token.normalised,
      emoji: token.emoji,
      ruleUsed: token.ruleUsed,
      explanation: token.explanation,
    })),
  };
}

export function summariseCorpusResults(
  source: string,
  results: CorpusTitleResult[],
): CorpusCoverageReport {
  const counts: Record<Band, number> = {
    excellent: 0,
    usable: 0,
    needsReview: 0,
    rejected: 0,
  };
  const ruleCounts: Record<string, number> = {};
  const unmapped = new Map<string, { count: number; examples: string[] }>();

  for (const result of results) {
    counts[result.band] += 1;

    for (const token of result.tokens) {
      ruleCounts[token.ruleUsed] = (ruleCounts[token.ruleUsed] ?? 0) + 1;

      if (token.ruleUsed === 'unmapped') {
        const current = unmapped.get(token.normalised) ?? {
          count: 0,
          examples: [],
        };
        current.count += 1;

        if (!current.examples.includes(result.title)) {
          current.examples.push(result.title);
        }

        unmapped.set(token.normalised, current);
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

  return {
    generatedAt: new Date().toISOString(),
    source,
    titleCount: results.length,
    counts,
    averageConfidence: Number(averageConfidence.toFixed(4)),
    averageEmojiLength: Number(averageEmojiLength.toFixed(4)),
    ruleCounts,
    unmappedWords: [...unmapped.entries()]
      .map(([word, entry]) => ({
        word,
        count: entry.count,
        examples: entry.examples.slice(0, 10),
      }))
      .sort(
        (left, right) =>
          right.count - left.count || left.word.localeCompare(right.word),
      ),
    rejectedTitles: results.filter((result) => result.band === 'rejected'),
    results,
  };
}

export function writeJson(path: string, data: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function phoneticCodes(value: string) {
  return [...new Set(doubleMetaphone(value).filter(Boolean))];
}

export function hyphenateWord(word: string) {
  return hyphenator.hyphenate(word);
}

export function sampleSegmentations(word: string) {
  const hyphenated = hyphenateWord(word);
  const segmentations: string[][] = [];

  if (hyphenated.length > 1) {
    segmentations.push(hyphenated);
  }

  for (let index = 2; index <= word.length - 2; index += 1) {
    segmentations.push([word.slice(0, index), word.slice(index)]);
  }

  return segmentations.slice(0, 8);
}
