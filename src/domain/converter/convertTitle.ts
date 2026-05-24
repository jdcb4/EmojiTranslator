import { converterData } from '../../data/converter/loadConverterData';
import type {
  ConversionCandidate,
  ConversionMode,
  ConversionOptions,
  ConversionResult,
  RuleUsed,
  TokenConversion,
} from '../../types/conversion';
import { findBestWordCandidate, findPluralWordCandidate } from './lookupIndex';
import {
  numberToEmoji,
  numberWordToEmoji,
  tokenToNumberValue,
} from './numberRules';
import { partWordFallbackMatch } from './partWordFallback';
import { dictionaryHomophoneFallbackMatch } from './dictionaryHomophoneFallback';
import { phoneticWordFallbackMatch } from './phoneticWordFallback';
import { romanNumeralToNumber } from './normaliseToken';
import { tokenizeTitle, type TitleToken } from './tokenizeTitle';

const IGNORABLE_ARTICLES = new Set(['the', 'a', 'an']);
const LOW_VALUE_CONNECTORS = new Set([
  'of',
  'in',
  'on',
  'at',
  'to',
  'for',
  'with',
  'from',
  'there',
  'will',
  'be',
]);

const DEFAULT_OPTIONS: Required<ConversionOptions> = {
  mode: 'hybrid',
  maxEmojis: 8,
  allowHomophones: true,
  allowPartialWords: true,
  allowPhoneticWords: false,
  allowAmbiguousPartWordPhonetics: false,
  ignoreArticles: true,
  requireAllImportantWords: false,
  targetDifficulty: 'medium',
};

function emojiUnitCount(emoji: string) {
  return (
    Array.from(emoji.matchAll(/\p{Emoji}/gu)).length || Array.from(emoji).length
  );
}

function ignoredToken(token: TitleToken, options: Required<ConversionOptions>) {
  if (options.ignoreArticles && IGNORABLE_ARTICLES.has(token.normalised)) {
    return {
      token: token.original,
      normalised: token.normalised,
      ruleUsed: 'ignored_article',
      scoreImpact: 0,
      explanation: 'Ignored article',
    } satisfies TokenConversion;
  }

  if (LOW_VALUE_CONNECTORS.has(token.normalised)) {
    return {
      token: token.original,
      normalised: token.normalised,
      ruleUsed: 'ignored_connector',
      scoreImpact: 0,
      explanation: 'Ignored low-value connector',
    } satisfies TokenConversion;
  }

  return null;
}

function connectorSymbolMatch(token: TitleToken) {
  if (token.normalised !== 'and') {
    return null;
  }

  return {
    token: token.original,
    normalised: token.normalised,
    emoji: '+',
    ruleUsed: 'connector_symbol',
    scoreImpact: 100,
    explanation: `${token.original} is represented by +`,
  } satisfies TokenConversion;
}

function numberMatch(token: TitleToken) {
  const numericValue = /^\d+$/.test(token.normalised) ? token.normalised : null;
  const romanValue = romanNumeralToNumber(token.normalised);
  const emoji = numericValue
    ? numberToEmoji(numericValue)
    : (numberWordToEmoji(token.normalised) ?? null);
  const romanEmoji = romanValue === null ? null : numberToEmoji(romanValue);
  const matchedEmoji = emoji ?? romanEmoji;

  if (!matchedEmoji) {
    return null;
  }

  return {
    token: token.original,
    normalised: token.normalised,
    emoji: matchedEmoji,
    ruleUsed: 'number',
    scoreImpact: 75,
    explanation: `${token.original} maps to numeric emoji ${matchedEmoji}`,
  } satisfies TokenConversion;
}

function numberedNounPhraseMatch(tokens: TitleToken[], index: number) {
  const numberToken = tokens[index];
  const nounToken = tokens[index + 1];

  if (!numberToken || !nounToken) {
    return null;
  }

  const count = tokenToNumberValue(numberToken.normalised);

  if (count === null || count < 2 || count > 5) {
    return null;
  }

  const nounMatch = wordMatch(nounToken);

  if (!nounMatch?.emoji || nounMatch.ruleUsed === 'related') {
    return null;
  }

  const repeatedEmoji = nounMatch.emoji.repeat(count);
  const phrase = `${numberToken.original} ${nounToken.original}`;

  return {
    consumed: 2,
    conversion: {
      token: phrase,
      normalised: `${numberToken.normalised} ${nounToken.normalised}`,
      emoji: repeatedEmoji,
      ruleUsed: 'numbered_noun_phrase',
      scoreImpact: 88,
      explanation: `${phrase} is represented as ${count} × ${nounMatch.emoji}`,
    } satisfies TokenConversion,
  };
}

function compoundMatch(token: TitleToken, allowPartialWords: boolean) {
  const compoundRule = converterData.compoundRules.find(
    (rule) =>
      rule.input === token.normalised &&
      (allowPartialWords || rule.rule === 'compound'),
  );

  if (!compoundRule) {
    return null;
  }

  const ruleUsed: Extract<RuleUsed, 'compound' | 'partial_word'> =
    compoundRule.rule;
  const scoreImpact = ruleUsed === 'compound' ? 75 : 45;

  return {
    token: token.original,
    normalised: token.normalised,
    emoji: compoundRule.emoji,
    ruleUsed,
    scoreImpact,
    explanation: `${token.original} splits into ${compoundRule.parts.join(' + ')} → ${compoundRule.emoji}`,
  } satisfies TokenConversion;
}

function homophoneMatch(token: TitleToken) {
  const homophone = converterData.homophones.find(
    (entry) => entry.input === token.normalised,
  );

  if (!homophone) {
    return null;
  }

  return {
    token: token.original,
    normalised: token.normalised,
    emoji: homophone.emoji,
    ruleUsed: 'homophone',
    scoreImpact: Math.round(homophone.confidence * 65),
    explanation: `${token.original} sounds like ${homophone.soundsLike}, represented by ${homophone.emoji}`,
  } satisfies TokenConversion;
}

function strictLetterRebusMatch(token: TitleToken) {
  if (token.normalised !== 'i') {
    return null;
  }

  return {
    token: token.original,
    normalised: token.normalised,
    emoji: '👁️',
    ruleUsed: 'homophone',
    scoreImpact: 82,
    explanation: `${token.original} is represented by the eye sound-alike 👁️`,
  } satisfies TokenConversion;
}

function wordMatch(token: TitleToken) {
  const candidate = findBestWordCandidate(token.normalised);

  if (!candidate) {
    return null;
  }

  return {
    token: token.original,
    normalised: token.normalised,
    emoji: candidate.emoji,
    ruleUsed: candidate.ruleUsed,
    scoreImpact: candidate.score,
    explanation: candidate.explanation,
  } satisfies TokenConversion;
}

function pluralRepeatedMatch(token: TitleToken) {
  const candidate = findPluralWordCandidate(token.normalised);

  if (!candidate) {
    return null;
  }

  const repeatedEmoji = candidate.emoji.repeat(2);

  return {
    token: token.original,
    normalised: token.normalised,
    emoji: repeatedEmoji,
    ruleUsed: 'plural_repeated',
    scoreImpact: 92,
    explanation: `${token.original} is plural, represented as multiple ${candidate.emoji}`,
  } satisfies TokenConversion;
}

function unmappedToken(token: TitleToken) {
  return {
    token: token.original,
    normalised: token.normalised,
    ruleUsed: 'unmapped',
    scoreImpact: -80,
    explanation: `No reviewed mapping for ${token.original}`,
  } satisfies TokenConversion;
}

function scoreTokens(tokens: TokenConversion[], maxEmojis: number) {
  const scoreBearingTokens = tokens.filter(
    (token) =>
      token.ruleUsed !== 'ignored_article' &&
      token.ruleUsed !== 'ignored_connector',
  );
  const mappedTokens = scoreBearingTokens.filter((token) => token.emoji);
  const emoji = mappedTokens.map((token) => token.emoji).join('');
  const denominator = Math.max(scoreBearingTokens.length, 1);
  const rawScore =
    scoreBearingTokens.reduce((total, token) => total + token.scoreImpact, 0) /
    denominator;
  const emojiCount = emojiUnitCount(emoji);
  const lengthPenalty = Math.max(0, emojiCount - maxEmojis) * 10;
  const confidence = Math.max(0, Math.min(1, (rawScore - lengthPenalty) / 100));
  const warnings: string[] = [];

  if (scoreBearingTokens.length === 0) {
    warnings.push('No important title words were available to map.');
  }

  if (scoreBearingTokens.some((token) => token.ruleUsed === 'unmapped')) {
    warnings.push('One or more important title words could not be mapped.');
  }

  if (emojiCount > maxEmojis) {
    warnings.push(`Emoji clue is longer than the max of ${maxEmojis}.`);
  }

  if (confidence < 0.5) {
    warnings.push('Conversion is weak and should be manually reviewed.');
  }

  return {
    emoji: emoji.length > 0 ? emoji : null,
    confidence: Number(confidence.toFixed(2)),
    accepted: confidence >= 0.7 && emoji.length > 0,
    warnings,
  };
}

function convertStrict(
  title: string,
  options: Required<ConversionOptions>,
): ConversionCandidate {
  const titleTokens = tokenizeTitle(title);
  const conversions: TokenConversion[] = [];

  for (let index = 0; index < titleTokens.length; index += 1) {
    const token = titleTokens[index];
    const phraseMatch = numberedNounPhraseMatch(titleTokens, index);

    if (phraseMatch) {
      conversions.push(phraseMatch.conversion);
      index += phraseMatch.consumed - 1;
      continue;
    }

    conversions.push(
      ignoredToken(token, options) ??
        connectorSymbolMatch(token) ??
        strictLetterRebusMatch(token) ??
        numberMatch(token) ??
        compoundMatch(token, false) ??
        pluralRepeatedMatch(token) ??
        wordMatch(token) ??
        unmappedToken(token),
    );
  }
  const score = scoreTokens(conversions, options.maxEmojis);

  return { ...score, modeUsed: 'strict', tokens: conversions };
}

function convertRebus(
  title: string,
  options: Required<ConversionOptions>,
): ConversionCandidate {
  const titleTokens = tokenizeTitle(title);
  const conversions: TokenConversion[] = [];

  for (let index = 0; index < titleTokens.length; index += 1) {
    const token = titleTokens[index];
    const phraseMatch = numberedNounPhraseMatch(titleTokens, index);

    if (phraseMatch) {
      conversions.push(phraseMatch.conversion);
      index += phraseMatch.consumed - 1;
      continue;
    }

    conversions.push(
      (options.allowHomophones ? homophoneMatch(token) : null) ??
        connectorSymbolMatch(token) ??
        numberMatch(token) ??
        compoundMatch(token, options.allowPartialWords) ??
        pluralRepeatedMatch(token) ??
        wordMatch(token) ??
        ignoredToken(token, options) ??
        (options.allowHomophones
          ? dictionaryHomophoneFallbackMatch(token)
          : null) ??
        (options.allowPhoneticWords
          ? phoneticWordFallbackMatch(token)
          : null) ??
        (options.allowPartialWords
          ? partWordFallbackMatch(token, {
              allowAmbiguousPhonetics: options.allowAmbiguousPartWordPhonetics,
            })
          : null) ??
        unmappedToken(token),
    );
  }
  const score = scoreTokens(conversions, options.maxEmojis);

  return { ...score, modeUsed: 'rebus', tokens: conversions };
}

function makeResult(
  title: string,
  requestedMode: ConversionMode,
  selected: ConversionCandidate,
  alternatives: ConversionCandidate[],
) {
  return {
    title,
    ...selected,
    modeUsed: requestedMode === 'hybrid' ? 'hybrid' : selected.modeUsed,
    alternatives,
  } satisfies ConversionResult;
}

function mappedTokenCount(candidate: ConversionCandidate) {
  return candidate.tokens.filter((token) => token.emoji).length;
}

function compareCandidates(
  left: ConversionCandidate,
  right: ConversionCandidate,
) {
  const confidenceDifference = right.confidence - left.confidence;

  if (confidenceDifference !== 0) {
    return confidenceDifference;
  }

  return mappedTokenCount(right) - mappedTokenCount(left);
}

export function convertMovieTitleToEmoji(
  title: string,
  options: ConversionOptions = { mode: 'hybrid' },
): ConversionResult {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
  const trimmedTitle = title.trim();

  if (trimmedTitle.length === 0) {
    return {
      title,
      emoji: null,
      confidence: 0,
      accepted: false,
      modeUsed: resolvedOptions.mode,
      tokens: [],
      warnings: ['Enter a title before converting.'],
      alternatives: [],
    };
  }

  if (resolvedOptions.mode === 'strict') {
    const selected = convertStrict(trimmedTitle, resolvedOptions);
    return makeResult(trimmedTitle, 'strict', selected, []);
  }

  if (resolvedOptions.mode === 'rebus') {
    const selected = convertRebus(trimmedTitle, resolvedOptions);
    return makeResult(trimmedTitle, 'rebus', selected, []);
  }

  const strict = convertStrict(trimmedTitle, resolvedOptions);
  const rebus = convertRebus(trimmedTitle, resolvedOptions);
  const ranked = [strict, rebus].sort(compareCandidates);

  const selected = strict.accepted
    ? strict
    : rebus.accepted
      ? rebus
      : ranked[0];
  const alternatives = ranked
    .filter((candidate) => candidate !== selected)
    .slice(0, 3);

  return makeResult(trimmedTitle, 'hybrid', selected, alternatives);
}
