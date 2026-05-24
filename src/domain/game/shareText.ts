type ShareableKind = 'movie' | 'tv' | 'book' | 'unknown';

type ShareableClue = {
  emoji: string;
  kind: ShareableKind;
};

function shareKindLabel(kind: ShareableKind) {
  if (kind === 'tv') {
    return 'TV';
  }

  if (kind === 'movie') {
    return 'Movie';
  }

  if (kind === 'book') {
    return 'Book';
  }

  return 'Title';
}

export function buildGameShareText(clue: ShareableClue, url: string) {
  return [
    'Emoji Title Game',
    '',
    `Can you guess this ${shareKindLabel(clue.kind)} title?`,
    '',
    clue.emoji,
    '',
    `Play here: ${url}`,
  ].join('\n');
}
