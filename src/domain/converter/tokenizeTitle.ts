import { normaliseToken } from './normaliseToken';

export type TitleToken = {
  original: string;
  normalised: string;
};

export function tokenizeTitle(title: string): TitleToken[] {
  return title
    .replace(/[–—]/g, '-')
    .replace(/[/:()[\],.!?]/g, ' ')
    .split(/\s+|-/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((original) => ({ original, normalised: normaliseToken(original) }))
    .filter((token) => token.normalised.length > 0);
}
