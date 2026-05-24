import { convertMovieTitleToEmoji } from './convertTitle';
import { partWordFallbackMatch } from './partWordFallback';
import { converterData } from '../../data/converter/loadConverterData';

function regionalCodeFromFlagEmoji(emoji: string) {
  const codepoints = [...emoji].map((char) => char.codePointAt(0) ?? 0);

  if (
    codepoints.length !== 2 ||
    codepoints.some((codepoint) => codepoint < 0x1f1e6 || codepoint > 0x1f1ff)
  ) {
    return null;
  }

  return codepoints
    .map((codepoint) => String.fromCharCode(65 + codepoint - 0x1f1e6))
    .join('');
}

describe('convertMovieTitleToEmoji', () => {
  it.each([
    ['The Lion King', 'strict', '🦁👑'],
    ['Spider-Man', 'strict', '🕷️👨'],
    ['Cars', 'strict', '🚗🚗'],
    ['Toy Story', 'strict', '🧸📖'],
    ['School of Rock', 'strict', '🏫🪨'],
    ['Night at the Museum', 'strict', '🌙🏛️'],
    ['A Clockwork Orange', 'strict', '⏰⚙️🍊'],
    ["Ocean's Eleven", 'strict', '🌊1️⃣1️⃣'],
    ['Apollo 13', 'strict', '🚀1️⃣3️⃣'],
    ['Rocky IV', 'strict', '🪨4️⃣'],
    ['I, Robot', 'strict', '👁️🤖'],
    ['Before Sunrise', 'strict', '⬅️☀️'],
    ['Back to the Future', 'strict', '↩️🔮'],
    ['Back to the Future', 'rebus', '↩️2️⃣🔮'],
    ['Infinity', 'strict', '♾️'],
    ['Three Kings', 'strict', '👑👑👑'],
    ['2 Cars', 'strict', '🚗🚗'],
    ['Get Out', 'strict', '🤲➡️'],
    ['Love Actually', 'strict', '❤️✅'],
    ['Casablanca', 'strict', '🏠⚪'],
    ['Strangelove', 'strict', '❓❤️'],
    ['Swear', 'strict', '❗'],
    ['The Truman Show', 'rebus', '✅👨📺'],
    ['Finding Nemo', 'rebus', '🔍🦵🚜'],
    ['I, Robot', 'rebus', '👁️🤖'],
  ] as const)('converts %s in %s mode', (title, mode, expectedEmoji) => {
    const result = convertMovieTitleToEmoji(title, { mode });

    expect(result.emoji).toBe(expectedEmoji);
    expect(result.accepted).toBe(true);
  });

  it('repeats singular emoji for plural title words', () => {
    const cars = convertMovieTitleToEmoji('Cars', { mode: 'strict' });
    const aliens = convertMovieTitleToEmoji('Aliens', { mode: 'strict' });
    const rings = convertMovieTitleToEmoji('Rings', { mode: 'strict' });
    const shoes = convertMovieTitleToEmoji('Shoes', { mode: 'strict' });

    expect(cars.emoji).toBe('🚗🚗');
    expect(cars.tokens[0]?.ruleUsed).toBe('plural_repeated');
    expect(aliens.emoji).toBe('👽👽');
    expect(aliens.tokens[0]?.ruleUsed).toBe('plural_repeated');
    expect(rings.emoji).toBe('💍💍');
    expect(rings.tokens[0]?.ruleUsed).toBe('plural_repeated');
    expect(shoes.emoji).toBe('👟👟');
    expect(shoes.tokens[0]?.ruleUsed).toBe('plural_repeated');
  });

  it('uses a combo clue for band', () => {
    const result = convertMovieTitleToEmoji('Band', { mode: 'strict' });

    expect(result.emoji).toBe('🎸🥁🎹');
    expect(result.accepted).toBe(true);
  });

  it('uses the full pirate flag emoji for pirate-related words', () => {
    const pirate = convertMovieTitleToEmoji('Pirate', { mode: 'strict' });
    const pirates = convertMovieTitleToEmoji('Pirates', { mode: 'strict' });

    expect(pirate.emoji).toBe('🏴‍☠️');
    expect(pirates.emoji).toBe('🏴‍☠️🏴‍☠️');
  });

  it('leaves rejected maybe-promote candidates unmapped', () => {
    const result = convertMovieTitleToEmoji('Shiro', { mode: 'strict' });

    expect(result.accepted).toBe(false);
    expect(result.emoji).toBeNull();
  });

  it('represents and as a plus symbol', () => {
    const result = convertMovieTitleToEmoji('Beauty and the Beast', {
      mode: 'strict',
    });

    expect(result.emoji).toBe('💄+👹');
    expect(
      result.tokens.some((token) => token.ruleUsed === 'connector_symbol'),
    ).toBe(true);
  });

  it('maps common short words that have clear visual rebus symbols', () => {
    expect(convertMovieTitleToEmoji('It', { mode: 'strict' }).emoji).toBe('💻');
    expect(convertMovieTitleToEmoji('How', { mode: 'strict' }).emoji).toBe(
      '❓',
    );
    expect(convertMovieTitleToEmoji('Buy', { mode: 'strict' }).emoji).toBe(
      '🛒',
    );
    expect(convertMovieTitleToEmoji('Bye', { mode: 'strict' }).emoji).toBe(
      '👋',
    );
  });

  it('uses buy or bye sound-alikes for by-style words in rebus mode', () => {
    const by = convertMovieTitleToEmoji('By', { mode: 'rebus' });
    const bi = convertMovieTitleToEmoji('Bi', { mode: 'rebus' });
    const mary = convertMovieTitleToEmoji('Mary', { mode: 'rebus' });

    expect(by.emoji).toBe('🛒');
    expect(by.tokens[0]?.ruleUsed).toBe('homophone');
    expect(bi.emoji).toBe('👋');
    expect(bi.tokens[0]?.ruleUsed).toBe('homophone');
    expect(mary.emoji).toBe('💒');
    expect(mary.tokens[0]?.ruleUsed).toBe('homophone');
  });

  it('associates regional flag emoji with names, capitals, demonyms, and short codes', () => {
    const regionalFlags = converterData.emojiConcepts.filter((concept) =>
      regionalCodeFromFlagEmoji(concept.emoji),
    );
    const france = converterData.emojiConcepts.find(
      (concept) => concept.emoji === '🇫🇷',
    );
    const unitedStates = converterData.emojiConcepts.find(
      (concept) => concept.emoji === '🇺🇸',
    );

    expect(regionalFlags).toHaveLength(259);
    for (const concept of regionalFlags) {
      const code = regionalCodeFromFlagEmoji(concept.emoji);

      expect(concept.directWords).toContain(code?.toLowerCase());
    }

    expect(france?.directWords).toEqual(
      expect.arrayContaining(['france', 'french', 'paris', 'fr']),
    );
    expect(unitedStates?.directWords).toEqual(
      expect.arrayContaining([
        'unitedstates',
        'united states',
        'american',
        'washingtondc',
        'us',
        'usa',
      ]),
    );
  });

  it('uses a microphone-led clue for singing', () => {
    const result = convertMovieTitleToEmoji("Singin' in the Rain", {
      mode: 'strict',
    });

    expect(result.emoji).toBe('🎤🎵🌧️');
    expect(result.tokens[0]?.normalised).toBe('singin');
  });

  it('can use partial-word rebus even when the full title still needs review', () => {
    const result = convertMovieTitleToEmoji('Forrest Gump', { mode: 'rebus' });

    expect(result.emoji).toBe('🌲🌲');
    expect(result.accepted).toBe(false);
    expect(
      result.tokens.some((token) => token.ruleUsed === 'partial_word'),
    ).toBe(true);
  });

  it('uses the programmatic part-word fallback after reviewed rules are exhausted', () => {
    const result = convertMovieTitleToEmoji('Foreman Show', { mode: 'rebus' });

    expect(result.emoji).toBe('4️⃣👨📺');
    expect(result.accepted).toBe(true);
    expect(result.tokens[0]?.ruleUsed).toBe('part_word_fallback');
  });

  it('can build bounded syllable-like fallback clues for known chunk examples', () => {
    expect(
      partWordFallbackMatch({ original: 'Forrest', normalised: 'forrest' })
        ?.emoji,
    ).toBe('4️⃣🛌');
    expect(
      partWordFallbackMatch({ original: 'Nemo', normalised: 'nemo' })?.emoji,
    ).toBe('🦵🚜');
    expect(
      partWordFallbackMatch({ original: 'Truman', normalised: 'truman' })
        ?.emoji,
    ).toBe('✅👨');
    expect(
      partWordFallbackMatch({
        original: 'Shawshank',
        normalised: 'shawshank',
      })?.emoji,
    ).toBe('🏖️🔪');
  });

  it('uses exact dictionary homophones as a low-confidence rebus fallback', () => {
    const citizenKane = convertMovieTitleToEmoji('Citizen Kane', {
      mode: 'rebus',
    });
    const lifeOfPi = convertMovieTitleToEmoji('Life of Pi', { mode: 'rebus' });
    const wouldBeKing = convertMovieTitleToEmoji('The Man Who Would Be King', {
      mode: 'rebus',
    });

    expect(citizenKane.emoji).toBe('🧑🦯');
    expect(citizenKane.accepted).toBe(true);
    expect(citizenKane.tokens[1]?.ruleUsed).toBe('dictionary_homophone');
    expect(lifeOfPi.emoji).toBe('🌱🥧');
    expect(lifeOfPi.tokens[2]?.ruleUsed).toBe('dictionary_homophone');
    expect(wouldBeKing.emoji).toBe('👨🦉🪵🐝👑');
    expect(wouldBeKing.tokens[3]?.ruleUsed).toBe('homophone');
  });

  it('uses reviewed homophones imported from external rebus lists', () => {
    const meet = convertMovieTitleToEmoji('Meet the Parents', {
      mode: 'rebus',
    });
    const soul = convertMovieTitleToEmoji('Soul', { mode: 'rebus' });
    const whole = convertMovieTitleToEmoji('Whole', { mode: 'rebus' });

    expect(meet.tokens[0]?.emoji).toBe('🥩');
    expect(meet.tokens[0]?.ruleUsed).toBe('homophone');
    expect(soul.emoji).toBe('👟');
    expect(soul.tokens[0]?.ruleUsed).toBe('homophone');
    expect(whole.emoji).toBe('🕳️');
    expect(whole.tokens[0]?.ruleUsed).toBe('homophone');
  });

  it('uses reviewed part-word rules imported from external rebus lists', () => {
    const cabin = convertMovieTitleToEmoji('Cabin', { mode: 'rebus' });
    const season = convertMovieTitleToEmoji('Season', { mode: 'rebus' });

    expect(cabin.emoji).toBe('🚕🏨');
    expect(cabin.tokens[0]?.ruleUsed).toBe('partial_word');
    expect(season.emoji).toBe('🌊☀️');
    expect(season.tokens[0]?.ruleUsed).toBe('partial_word');
  });

  it('rejects programmatic part-word fallback when chunks cannot all be mapped', () => {
    expect(
      partWordFallbackMatch({ original: 'Aladdin', normalised: 'aladdin' }),
    ).toBeNull();
  });

  it('does not repeat nouns for larger numbers', () => {
    const result = convertMovieTitleToEmoji("Ocean's Eleven", {
      mode: 'strict',
    });

    expect(result.emoji).toBe('🌊1️⃣1️⃣');
    expect(
      result.tokens.some((token) => token.ruleUsed === 'numbered_noun_phrase'),
    ).toBe(false);
  });

  it('can produce hard rebus clues that still need review', () => {
    const result = convertMovieTitleToEmoji('Before Sunrise', {
      mode: 'rebus',
    });

    expect(result.emoji).toBe('🐝4️⃣☀️⬆️');
    expect(result.accepted).toBe(false);
  });

  it('uses only strict and rebus candidates in hybrid mode', () => {
    const result = convertMovieTitleToEmoji('Titanic', { mode: 'hybrid' });

    expect(result.modeUsed).toBe('hybrid');
    expect(JSON.stringify(result)).not.toContain('movie_override');
  });

  it('prefers a weak rebus candidate over an equally weak strict candidate when it maps more words', () => {
    const result = convertMovieTitleToEmoji('The Shawshank Redemption', {
      mode: 'hybrid',
    });

    expect(result.emoji).toBe('🏖️🔪');
    expect(result.accepted).toBe(false);
    expect(result.tokens.some((token) => token.ruleUsed === 'unmapped')).toBe(
      true,
    );
  });

  it('rejects unmappable titles instead of forcing them', () => {
    const result = convertMovieTitleToEmoji('Qzxv Blorpt', {
      mode: 'strict',
    });

    expect(result.accepted).toBe(false);
    expect(result.emoji).toBeNull();
    expect(result.warnings).toContain(
      'Conversion is weak and should be manually reviewed.',
    );
  });
});
