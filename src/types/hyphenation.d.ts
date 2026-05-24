declare module 'hypher' {
  type HyphenationPatterns = {
    leftmin: number;
    rightmin: number;
    patterns: Record<number, string>;
    exceptions?: string;
  };

  export default class Hypher {
    constructor(patterns: HyphenationPatterns);
    hyphenate(word: string): string[];
  }
}

declare module 'hyphenation.en-us' {
  const patterns: {
    leftmin: number;
    rightmin: number;
    patterns: Record<number, string>;
    exceptions?: string;
  };

  export default patterns;
}
