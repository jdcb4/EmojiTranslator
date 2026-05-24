import { gameClues } from './loadGameData';

describe('gameClues', () => {
  it('has unique six-letter share codes', () => {
    const codes = gameClues.map((clue) => clue.code);

    expect(codes.every((code) => /^[A-Z]{6}$/.test(code))).toBe(true);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('includes high-recognition source metadata', () => {
    expect(gameClues.some((clue) => clue.highRecognition)).toBe(true);
  });
});
