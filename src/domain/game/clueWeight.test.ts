import { emojiUnitCount, gameClueWeight, pickWeightedClue } from './clueWeight';

describe('emojiUnitCount', () => {
  it('counts visual emoji clusters', () => {
    expect(emojiUnitCount('🇺🇸💄')).toBe(2);
    expect(emojiUnitCount('🎄🌳+💒')).toBe(3);
    expect(emojiUnitCount('1️⃣🧑‍⚕️')).toBe(2);
  });
});

describe('gameClueWeight', () => {
  it('doubles high-recognition clues', () => {
    expect(gameClueWeight({ emoji: '🦁', highRecognition: true })).toBe(2);
  });

  it('doubles clues with three or more emoji', () => {
    expect(gameClueWeight({ emoji: '🦁👑🎬', highRecognition: false })).toBe(2);
  });

  it('compounds both weight boosts', () => {
    expect(gameClueWeight({ emoji: '🦁👑🎬', highRecognition: true })).toBe(4);
  });
});

describe('pickWeightedClue', () => {
  it('uses weighted slots when drawing', () => {
    const clues = [
      { emoji: '🦁', highRecognition: false, title: 'Light' },
      { emoji: '🦁👑🎬', highRecognition: true, title: 'Heavy' },
    ];

    expect(pickWeightedClue(clues, () => 0.1)?.title).toBe('Light');
    expect(pickWeightedClue(clues, () => 0.5)?.title).toBe('Heavy');
  });
});
