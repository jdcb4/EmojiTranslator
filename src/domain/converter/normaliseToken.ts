const ROMAN_NUMERALS: Record<string, number> = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
  viii: 8,
  ix: 9,
  x: 10,
};

const STYLISED_DIGIT_WORDS: Record<string, string> = {
  se7en: 'seven',
};

const IRREGULAR_SINGULARS: Record<string, string> = {
  knives: 'knife',
};

export function normaliseToken(token: string) {
  const cleaned = token
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[’‘`]/g, "'")
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/[^a-z0-9']/g, '')
    .replace(/'s$/g, '');

  return STYLISED_DIGIT_WORDS[cleaned] ?? cleaned;
}

export function singulariseToken(token: string) {
  if (IRREGULAR_SINGULARS[token]) {
    return IRREGULAR_SINGULARS[token];
  }

  if (token.endsWith('ies') && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith('es') && token.length > 3) {
    return token.slice(0, -2);
  }

  if (token.endsWith('s') && token.length > 3) {
    return token.slice(0, -1);
  }

  return token;
}

export function romanNumeralToNumber(token: string) {
  return ROMAN_NUMERALS[token.toLowerCase()] ?? null;
}
