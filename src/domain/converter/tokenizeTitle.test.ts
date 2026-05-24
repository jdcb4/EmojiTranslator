import { tokenizeTitle } from './tokenizeTitle';

describe('tokenizeTitle', () => {
  it.each([
    ['Spider-Man', ['spider', 'man']],
    ['Ocean’s Eleven', ['ocean', 'eleven']],
    ['Mission: Impossible', ['mission', 'impossible']],
    ['Rocky IV', ['rocky', 'iv']],
    ['Se7en', ['seven']],
  ])('normalises %s', (title, expectedTokens) => {
    expect(tokenizeTitle(title).map((token) => token.normalised)).toEqual(
      expectedTokens,
    );
  });
});
