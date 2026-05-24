import { buildGameShareText } from './shareText';

describe('buildGameShareText', () => {
  it('includes the instruction, emoji clue, and link', () => {
    const text = buildGameShareText(
      { emoji: '🦁👑', kind: 'movie' },
      'https://example.com/?clue=ABCDEF',
    );

    expect(text).toBe(
      [
        'Emoji Title Game',
        '',
        'Can you guess this Movie title?',
        '',
        '🦁👑',
        '',
        'Play here: https://example.com/?clue=ABCDEF',
      ].join('\n'),
    );
  });
});
