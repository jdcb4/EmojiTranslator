const KEYCAPS: Record<string, string> = {
  '0': '0️⃣',
  '1': '1️⃣',
  '2': '2️⃣',
  '3': '3️⃣',
  '4': '4️⃣',
  '5': '5️⃣',
  '6': '6️⃣',
  '7': '7️⃣',
  '8': '8️⃣',
  '9': '9️⃣',
};

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  once: 1,
};

const ORDINAL_WORDS: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  ninth: 9,
  tenth: 10,
  eleventh: 11,
  twelfth: 12,
  thirteenth: 13,
  twentieth: 20,
};

export function tokenToNumberValue(token: string) {
  if (/^\d+$/.test(token)) {
    return Number(token);
  }

  return NUMBER_WORDS[token] ?? ORDINAL_WORDS[token] ?? null;
}

export function numberToEmoji(value: number | string) {
  const digits = String(value).split('');

  if (!digits.every((digit) => digit in KEYCAPS)) {
    return null;
  }

  return digits.map((digit) => KEYCAPS[digit]).join('');
}

export function numberWordToEmoji(token: string) {
  const value = tokenToNumberValue(token);
  return value === null ? null : numberToEmoji(value);
}
