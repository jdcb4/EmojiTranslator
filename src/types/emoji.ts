export type EmojiConceptCategory =
  | 'animal'
  | 'person'
  | 'body'
  | 'object'
  | 'place'
  | 'vehicle'
  | 'nature'
  | 'weather'
  | 'space'
  | 'food'
  | 'emotion'
  | 'action'
  | 'symbol'
  | 'number'
  | 'time'
  | 'fantasy'
  | 'crime'
  | 'abstract';

export type EmojiConcept = {
  id: string;
  emoji: string;
  canonicalWord: string;
  displayName: string;
  directWords: string[];
  plurals: string[];
  synonyms: string[];
  relatedWords: string[];
  homophones?: string[];
  soundAlikes?: string[];
  category: EmojiConceptCategory;
  recognisability: number;
  ambiguity: number;
  quizUsefulness: number;
  source: 'unicode_cldr' | 'curated' | 'llm_assisted' | 'manual_reviewed';
  notes?: string;
};
