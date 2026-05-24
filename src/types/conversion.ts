export type ConversionMode = 'strict' | 'rebus' | 'hybrid';

export type ConversionDifficulty = 'easy' | 'medium' | 'hard';

export type ConversionOptions = {
  mode: ConversionMode;
  maxEmojis?: number;
  allowHomophones?: boolean;
  allowPartialWords?: boolean;
  allowPhoneticWords?: boolean;
  allowAmbiguousPartWordPhonetics?: boolean;
  ignoreArticles?: boolean;
  requireAllImportantWords?: boolean;
  targetDifficulty?: ConversionDifficulty;
};

export type RuleUsed =
  | 'ignored_article'
  | 'ignored_connector'
  | 'connector_symbol'
  | 'exact'
  | 'plural'
  | 'plural_repeated'
  | 'synonym'
  | 'related'
  | 'compound'
  | 'number'
  | 'numbered_noun_phrase'
  | 'homophone'
  | 'dictionary_homophone'
  | 'partial_word'
  | 'part_word_fallback'
  | 'phonetic_word_fallback'
  | 'unmapped';

export type TokenConversion = {
  token: string;
  normalised: string;
  emoji?: string;
  ruleUsed: RuleUsed;
  scoreImpact: number;
  explanation: string;
};

export type ConversionCandidate = {
  emoji: string | null;
  confidence: number;
  accepted: boolean;
  modeUsed: Exclude<ConversionMode, 'hybrid'>;
  tokens: TokenConversion[];
  warnings: string[];
};

export type ConversionResult = ConversionCandidate & {
  title: string;
  modeUsed: ConversionMode;
  alternatives: ConversionCandidate[];
};
