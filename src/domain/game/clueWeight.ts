type WeightedClue = {
  emoji: string;
  highRecognition: boolean;
};

export function emojiUnitCount(emoji: string) {
  return (
    emoji.match(
      /\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}\uFE0F?)*/gu,
    )?.length ?? 0
  );
}

export function gameClueWeight(clue: WeightedClue) {
  let weight = 1;

  if (clue.highRecognition) {
    weight *= 2;
  }

  if (emojiUnitCount(clue.emoji) >= 3) {
    weight *= 2;
  }

  return weight;
}

export function pickWeightedClue<T extends WeightedClue>(
  clues: T[],
  random = Math.random,
) {
  const totalWeight = clues.reduce(
    (total, clue) => total + gameClueWeight(clue),
    0,
  );
  let cursor = random() * totalWeight;

  for (const clue of clues) {
    cursor -= gameClueWeight(clue);

    if (cursor < 0) {
      return clue;
    }
  }

  return clues[clues.length - 1];
}
