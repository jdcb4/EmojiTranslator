import { matchTitleGuess, normaliseTitleForGuess } from './answerMatching';

describe('normaliseTitleForGuess', () => {
  it.each([
    ['Spider-Man: Into the Spider-Verse!', 'spider man into the spider verse'],
    ['Amelie', 'amelie'],
    ['Wall-E', 'wall e'],
    ['Beauty & the Beast', 'beauty and the beast'],
    ["Ocean's Eleven", 'oceans eleven'],
  ])('normalises %s', (input, expected) => {
    expect(normaliseTitleForGuess(input)).toBe(expected);
  });
});

describe('matchTitleGuess', () => {
  it.each([
    ['matrix', 'The Matrix', 'exact'],
    ['The Matrxi', 'The Matrix', 'near'],
    [
      'spider man into the spider verse',
      'Spider-Man: Into the Spider-Verse',
      'exact',
    ],
    ['beauty and teh beast', 'Beauty and the Beast', 'near'],
  ] as const)('accepts %s for %s', (guess, answer, reason) => {
    const result = matchTitleGuess(guess, answer);

    expect(result.accepted).toBe(true);
    expect(result.reason).toBe(reason);
  });

  it.each([
    ['', 'The Matrix'],
    ['War', 'Saw'],
    ['Beauty and the Castle', 'Beauty and the Beast'],
    ['The Lord of the Flies', 'The Lord of the Rings'],
  ])('rejects %s for %s', (guess, answer) => {
    expect(matchTitleGuess(guess, answer).accepted).toBe(false);
  });
});
